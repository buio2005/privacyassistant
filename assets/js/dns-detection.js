(function attachDnsDetection(globalObject) {
  const FUTURE_SIGNALS = [
    "DNSSEC",
    "DNS Leak Detection",
    "DoH Detection"
  ];

  const NOT_DETERMINABLE_PROVIDER = "Provider DNS non determinabile";
  const SIGNATURE_PRIORITY = {
    exact_ip: 3,
    cidr_ipv4: 2,
    contains: 2,
    regex: 1
  };

  function createBaseDebugState() {
    return {
      probes: {
        whichResolveRs: {
          requestedUrl: "",
          response: null
        }
      },
      observedResolver: "Non disponibile",
      sourceIpObserved: "Non disponibile",
      identificationMethod: "Provider DNS non determinabile",
      signatureFound: "Nessuna corrispondenza",
      providerCandidate: "Nessuna corrispondenza",
      confidenceLevel: "Bassa"
    };
  }

  function buildFallbackDnsEnvironment() {
    return {
      provider: NOT_DETERMINABLE_PROVIDER,
      providerId: "unknown",
      privacyLevel: "Non disponibile",
      description: "Il browser non espone direttamente quale resolver DNS stia usando e in questa sessione non e stato possibile identificarlo con sufficiente affidabilita.",
      reliability: "Bassa",
      confidence: 0.24,
      determination: "not_determinable",
      identificationMethod: "not_determinable",
      identificationMethodLabel: "Provider DNS non determinabile",
      matchedSignatureLabel: "Nessuna corrispondenza",
      matchedSignatureValue: "Non disponibile",
      resolverSnapshot: "Non disponibile",
      resolverSourceIp: "Non disponibile",
      sources: {
        resolverSnapshot: false
      },
      futureSignals: FUTURE_SIGNALS,
      debug: createBaseDebugState()
    };
  }

  function getCatalogModule() {
    return globalObject.PrivacyDnsProviderCatalog;
  }

  function getProbeModule() {
    return globalObject.PrivacyDnsProbe;
  }

  function getConfidenceModule() {
    return globalObject.PrivacyDnsConfidenceEngine;
  }

  function normalizeResolverValue(value) {
    return String(value || "").trim();
  }

  function isValidIpv4(value) {
    const segments = String(value || "").trim().split(".");

    if (segments.length !== 4) {
      return false;
    }

    return segments.every((segment) => {
      if (!/^\d{1,3}$/.test(segment)) {
        return false;
      }

      const numericSegment = Number(segment);
      return numericSegment >= 0 && numericSegment <= 255;
    });
  }

  function ipv4ToInteger(value) {
    if (!isValidIpv4(value)) {
      return null;
    }

    return String(value).split(".").reduce((accumulator, segment) => {
      return ((accumulator << 8) >>> 0) + Number(segment);
    }, 0) >>> 0;
  }

  function isIpv4InCidr(ipAddress, cidrValue) {
    const normalizedCidr = String(cidrValue || "").trim();
    const cidrParts = normalizedCidr.split("/");

    if (cidrParts.length !== 2) {
      return false;
    }

    const networkAddress = cidrParts[0];
    const prefixLength = Number(cidrParts[1]);
    const ipInteger = ipv4ToInteger(ipAddress);
    const networkInteger = ipv4ToInteger(networkAddress);

    if (
      ipInteger === null
      || networkInteger === null
      || !Number.isInteger(prefixLength)
      || prefixLength < 0
      || prefixLength > 32
    ) {
      return false;
    }

    const mask = prefixLength === 0
      ? 0
      : (0xffffffff << (32 - prefixLength)) >>> 0;

    return (ipInteger & mask) === (networkInteger & mask);
  }

  function doesSignatureMatch(observedResolver, signatureKind, candidateValue) {
    const normalizedResolver = normalizeResolverValue(observedResolver).toLowerCase();
    const normalizedCandidate = String(candidateValue || "").trim().toLowerCase();

    if (!normalizedResolver || !normalizedCandidate) {
      return false;
    }

    if (signatureKind === "exact_ip") {
      return normalizedResolver === normalizedCandidate;
    }

    if (signatureKind === "cidr_ipv4") {
      return isIpv4InCidr(normalizedResolver, normalizedCandidate);
    }

    if (signatureKind === "contains") {
      return normalizedResolver.includes(normalizedCandidate);
    }

    if (signatureKind === "regex") {
      return new RegExp(candidateValue, "i").test(observedResolver);
    }

    return false;
  }

  function findProviderFromCatalog(observedResolver, providerCatalog) {
    let bestMatch = null;

    providerCatalog.forEach((provider) => {
      (provider.signatures || []).forEach((signature) => {
        (signature.values || []).forEach((candidateValue) => {
          if (!doesSignatureMatch(observedResolver, signature.kind, candidateValue)) {
            return;
          }

          const match = {
            provider,
            signature: {
              kind: signature.kind,
              method: signature.method,
              label: signature.label
            },
            signatureValue: String(candidateValue)
          };

          if (!bestMatch || (SIGNATURE_PRIORITY[signature.kind] || 0) > (SIGNATURE_PRIORITY[bestMatch.signature.kind] || 0)) {
            bestMatch = match;
          }
        });
      });
    });

    return bestMatch;
  }

  function doesVerificationMatch(text, matcher) {
    if (!matcher || !matcher.kind) {
      return false;
    }

    if (matcher.kind === "regex") {
      return new RegExp(matcher.value, "i").test(text);
    }

    if (matcher.kind === "contains") {
      return String(text || "").toLowerCase().includes(String(matcher.value || "").toLowerCase());
    }

    return false;
  }

  function generateUniqueToken() {
    return `pca-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
  }

  async function runProviderVerification(provider, debugState, probeModule) {
    const verificationProbes = provider && provider.verificationProbes ? provider.verificationProbes : [];

    for (const verificationProbe of verificationProbes) {
      const requestUrl = verificationProbe.uniqueSubdomain
        ? verificationProbe.url.replace("{unique}", generateUniqueToken())
        : verificationProbe.url;
      const probeResult = await probeModule.runTextProbe(requestUrl);
      const matchResults = (verificationProbe.matchers || []).map((matcher) => {
        return doesVerificationMatch(probeResult.text, matcher);
      });
      const matched = verificationProbe.successPolicy === "all"
        ? matchResults.length > 0 && matchResults.every(Boolean)
        : matchResults.some(Boolean);

      debugState.probes[verificationProbe.id] = {
        requestedUrl: requestUrl,
        called: true,
        matched,
        responseText: probeResult.text,
        error: probeResult.error
      };

      if (matched) {
        return {
          matched: true,
          method: "provider_verification",
          label: verificationProbe.label,
          signatureValue: requestUrl
        };
      }
    }

    return null;
  }

  // Verifica indipendente dallo snapshot: quando il resolver osservato non
  // aggancia il catalogo (tipico con DoH/VPN, dove l'egress non e catalogato),
  // interroga in parallelo le sonde di verifica dei provider che ne hanno una.
  // Solo il provider realmente in uso produce un match, grazie ai matcher
  // positivi e specifici (es. NextDNS "status: ok"). Degrada senza eccezioni.
  async function runVerificationFallback(providerCatalog, debugState, probeModule) {
    const verifiableProviders = providerCatalog.filter((provider) => {
      return Array.isArray(provider.verificationProbes) && provider.verificationProbes.length > 0;
    });

    const results = await Promise.all(
      verifiableProviders.map(async (provider) => {
        const verification = await runProviderVerification(provider, debugState, probeModule);
        return verification ? { provider, verification } : null;
      })
    );

    return results.find(Boolean) || null;
  }

  async function detectDnsEnvironment() {
    const fallbackState = buildFallbackDnsEnvironment();
    const catalogModule = getCatalogModule();
    const probeModule = getProbeModule();
    const confidenceModule = getConfidenceModule();

    if (!catalogModule || !probeModule || !confidenceModule) {
      return fallbackState;
    }

    const debugState = createBaseDebugState();
    let resolverProbe = null;

    try {
      resolverProbe = await probeModule.runResolverSnapshotProbe();
    } catch (error) {
      resolverProbe = null;
    }

    const snapshotPayload = resolverProbe ? resolverProbe.payload : null;
    debugState.probes.whichResolveRs.requestedUrl = resolverProbe ? resolverProbe.requestedUrl : "";
    debugState.probes.whichResolveRs.response = snapshotPayload;

    const observedResolver = snapshotPayload && snapshotPayload.success
      ? normalizeResolverValue(snapshotPayload.output)
      : "";
    const resolverSourceIp = snapshotPayload && snapshotPayload.success
      ? normalizeResolverValue(snapshotPayload.source)
      : "";

    debugState.observedResolver = observedResolver || "Non disponibile";
    debugState.sourceIpObserved = resolverSourceIp || "Non disponibile";

    const providerCatalog = catalogModule.getProviderCatalog();
    const catalogMatch = findProviderFromCatalog(observedResolver, providerCatalog);
    const verificationMatch = catalogMatch
      ? await runProviderVerification(catalogMatch.provider, debugState, probeModule)
      : null;
    const confidenceResult = confidenceModule.evaluateIdentification({
      match: catalogMatch,
      verification: verificationMatch
    });

    debugState.identificationMethod = confidenceResult.identificationMethodLabel;
    debugState.signatureFound = confidenceResult.matchedSignatureLabel === "Nessuna corrispondenza"
      ? confidenceResult.matchedSignatureLabel
      : `${confidenceResult.matchedSignatureLabel}: ${confidenceResult.matchedSignatureValue}`;
    debugState.providerCandidate = catalogMatch ? catalogMatch.provider.name : "Nessuna corrispondenza";
    debugState.confidenceLevel = confidenceResult.reliability;

    if (!catalogMatch) {
      const verificationFallback = await runVerificationFallback(providerCatalog, debugState, probeModule);

      if (verificationFallback) {
        const fallbackConfidence = confidenceModule.evaluateIdentification({
          match: null,
          verification: verificationFallback.verification
        });

        debugState.identificationMethod = fallbackConfidence.identificationMethodLabel;
        debugState.signatureFound = `${fallbackConfidence.matchedSignatureLabel}: ${fallbackConfidence.matchedSignatureValue}`;
        debugState.providerCandidate = verificationFallback.provider.name;
        debugState.confidenceLevel = fallbackConfidence.reliability;

        return {
          provider: verificationFallback.provider.name,
          providerId: verificationFallback.provider.id,
          privacyLevel: verificationFallback.provider.privacyLevel,
          description: verificationFallback.provider.description,
          reliability: fallbackConfidence.reliability,
          confidence: fallbackConfidence.confidence,
          determination: fallbackConfidence.determination,
          identificationMethod: fallbackConfidence.identificationMethod,
          identificationMethodLabel: fallbackConfidence.identificationMethodLabel,
          matchedSignatureLabel: fallbackConfidence.matchedSignatureLabel,
          matchedSignatureValue: fallbackConfidence.matchedSignatureValue,
          resolverSnapshot: observedResolver || "Non disponibile",
          resolverSourceIp: resolverSourceIp || "Non disponibile",
          sources: {
            resolverSnapshot: Boolean(observedResolver),
            providerVerification: true
          },
          futureSignals: FUTURE_SIGNALS,
          debug: debugState
        };
      }

      return {
        ...fallbackState,
        resolverSnapshot: observedResolver || fallbackState.resolverSnapshot,
        resolverSourceIp: resolverSourceIp || fallbackState.resolverSourceIp,
        sources: {
          resolverSnapshot: Boolean(observedResolver)
        },
        debug: debugState
      };
    }

    return {
      provider: catalogMatch.provider.name,
      providerId: catalogMatch.provider.id,
      privacyLevel: catalogMatch.provider.privacyLevel,
      description: catalogMatch.provider.description,
      reliability: confidenceResult.reliability,
      confidence: confidenceResult.confidence,
      determination: confidenceResult.determination,
      identificationMethod: confidenceResult.identificationMethod,
      identificationMethodLabel: confidenceResult.identificationMethodLabel,
      matchedSignatureLabel: confidenceResult.matchedSignatureLabel,
      matchedSignatureValue: confidenceResult.matchedSignatureValue,
      resolverSnapshot: observedResolver || "Non disponibile",
      resolverSourceIp: resolverSourceIp || "Non disponibile",
      sources: {
        resolverSnapshot: Boolean(observedResolver)
      },
      futureSignals: FUTURE_SIGNALS,
      debug: debugState
    };
  }

  globalObject.PrivacyDnsDetection = {
    detectDnsEnvironment,
    getFallbackDnsEnvironment: buildFallbackDnsEnvironment
  };
})(window);
