(function attachDnsLeakDetection(globalObject) {
  // ============================================================
  // DNS Leak Detection (v0.8.4) — modulo di detection isolato
  //
  // Osserva quale/quali resolver rispondono a piu campioni con
  // sottodominio unico (riusa PrivacyDnsProbe.runResolverSnapshotProbe).
  // Un solo resolver osservato = configurazione consistente; piu
  // resolver distinti = frammentazione / possibile leak.
  //
  // La rilevazione lato browser e INFERENZIALE: la confidenza resta
  // prudenziale e il risultato va comunicato come stima, mai come
  // certezza. Il modulo non conosce lo score ne la UI.
  // ============================================================

  const DEFAULT_SAMPLE_COUNT = 3;
  const MIN_SAMPLE_COUNT = 1;
  const MAX_SAMPLE_COUNT = 5;
  const MAX_INFERENTIAL_CONFIDENCE = 0.75;

  const FUTURE_SIGNALS = ["DNSSEC", "DoH Detection", "VPN Protection Analysis"];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeSampleCount(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return DEFAULT_SAMPLE_COUNT;
    }
    return clamp(Math.round(numeric), MIN_SAMPLE_COUNT, MAX_SAMPLE_COUNT);
  }

  function normalizeValue(value) {
    return String(value || "").trim();
  }

  function getReliabilityLabel(confidence) {
    if (confidence >= 0.9) {
      return "Alta";
    }
    if (confidence >= 0.6) {
      return "Media";
    }
    return "Bassa";
  }

  function networkKey(resolver) {
    const ipv4 = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(String(resolver || "").trim());
    if (ipv4) {
      return `${ipv4[1]}.${ipv4[2]}`;
    }
    return String(resolver || "").trim().toLowerCase();
  }

  function countDistinctNetworks(resolvers) {
    return new Set(resolvers.map(networkKey).filter(Boolean)).size;
  }

  function isProviderConfirmed(dnsEnvironment) {
    return Boolean(
      dnsEnvironment
      && (dnsEnvironment.determination === "confirmed"
        || (dnsEnvironment.sources && dnsEnvironment.sources.providerVerification))
    );
  }

  function buildFallbackDnsLeakEnvironment() {
    return {
      leakState: "not_determinable",
      samplesRequested: 0,
      samplesSucceeded: 0,
      observedResolvers: [],
      observedSourceIps: [],
      distinctResolverCount: 0,
      matchesIdentifiedProvider: null,
      confidence: 0.2,
      reliability: "Bassa",
      description: "Non e stato possibile osservare i resolver DNS in questa sessione, quindi non si puo stimare un'eventuale frammentazione o leak.",
      sources: { resolverSamples: false },
      futureSignals: FUTURE_SIGNALS,
      debug: { samples: [] }
    };
  }

  function buildProtectedDnsLeakEnvironment(dnsEnvironment) {
    return {
      leakState: "protected",
      samplesRequested: 0,
      samplesSucceeded: 0,
      observedResolvers: [],
      observedSourceIps: [],
      distinctResolverCount: 0,
      distinctNetworkCount: 0,
      providerConfirmed: true,
      matchesIdentifiedProvider: null,
      confidence: 0.9,
      reliability: "Alta",
      description: `La risoluzione DNS e confermata verso ${(dnsEnvironment && dnsEnvironment.provider) || "un provider noto"}: il traffico DNS passa da quel resolver, senza segnali di leak.`,
      sources: { resolverSamples: false },
      futureSignals: FUTURE_SIGNALS,
      debug: { samples: [] }
    };
  }

  function getProbeModule(injected) {
    if (injected && typeof injected.runResolverSnapshotProbe === "function") {
      return injected;
    }
    if (globalObject.PrivacyDnsProbe && typeof globalObject.PrivacyDnsProbe.runResolverSnapshotProbe === "function") {
      return globalObject.PrivacyDnsProbe;
    }
    return null;
  }

  function extractSample(probeResult) {
    const payload = probeResult && probeResult.payload ? probeResult.payload : null;
    const success = Boolean(payload && payload.success);
    return {
      requestedUrl: probeResult ? probeResult.requestedUrl : "",
      success,
      resolver: success ? normalizeValue(payload.output) : "",
      sourceIp: success ? normalizeValue(payload.source) : "",
      message: payload && payload.message ? payload.message : ""
    };
  }

  function evaluateProviderMatch(observedResolvers, dnsEnvironment) {
    const identifiedResolver = normalizeValue(dnsEnvironment && dnsEnvironment.resolverSnapshot);
    if (!identifiedResolver || identifiedResolver === "Non disponibile" || observedResolvers.length === 0) {
      return null;
    }
    return observedResolvers.some((resolver) => resolver.toLowerCase() === identifiedResolver.toLowerCase());
  }

  async function analyzeDnsLeak(options) {
    const resolvedOptions = options || {};
    const sampleCount = normalizeSampleCount(resolvedOptions.sampleCount || DEFAULT_SAMPLE_COUNT);
    const dnsEnvironment = resolvedOptions.dnsEnvironment || {};

    if (isProviderConfirmed(dnsEnvironment)) {
      return buildProtectedDnsLeakEnvironment(dnsEnvironment);
    }

    const probeModule = getProbeModule(resolvedOptions.probeModule);

    if (!probeModule) {
      return buildFallbackDnsLeakEnvironment();
    }

    const samples = [];
    for (let index = 0; index < sampleCount; index += 1) {
      let probeResult = null;
      try {
        probeResult = await probeModule.runResolverSnapshotProbe();
      } catch (error) {
        probeResult = null;
      }
      samples.push(extractSample(probeResult));
    }

    const succeededSamples = samples.filter((sample) => sample.success && sample.resolver);
    const samplesSucceeded = succeededSamples.length;

    if (samplesSucceeded === 0) {
      return {
        ...buildFallbackDnsLeakEnvironment(),
        samplesRequested: sampleCount,
        debug: { samples }
      };
    }

    const observedResolvers = Array.from(new Set(succeededSamples.map((sample) => sample.resolver)));
    const observedSourceIps = Array.from(
      new Set(succeededSamples.map((sample) => sample.sourceIp).filter(Boolean))
    );
    const distinctResolverCount = observedResolvers.length;
    const distinctNetworkCount = countDistinctNetworks(observedResolvers);
    const providerConfirmed = isProviderConfirmed(dnsEnvironment);

    // Un provider confermato (es. NextDNS verificato) significa che il DNS
    // passa dimostrabilmente da quel resolver: nessun leak, a prescindere
    // dalla dispersione degli IP di egress. Solo con provider ignoto e reti
    // realmente diverse ha senso ipotizzare una frammentazione.
    let leakState;
    if (providerConfirmed) {
      leakState = "protected";
    } else if (distinctNetworkCount >= 2) {
      leakState = "multiple_resolvers";
    } else {
      leakState = "single_resolver";
    }

    const confidence = clamp(0.2 + 0.15 * samplesSucceeded, 0.2, MAX_INFERENTIAL_CONFIDENCE);

    let description;
    if (leakState === "protected") {
      description = `La risoluzione DNS e confermata verso un provider noto (${(dnsEnvironment && dnsEnvironment.provider) || "provider verificato"}): il traffico DNS passa da quel resolver, senza segnali di leak.`;
    } else if (leakState === "multiple_resolvers") {
      description = `Su ${samplesSucceeded} campioni sono emerse risoluzioni da ${distinctNetworkCount} reti diverse senza un provider riconosciuto: possibile frammentazione o leak da verificare.`;
    } else {
      description = `Su ${samplesSucceeded} campioni la risoluzione appare consistente su un'unica rete, ma il provider non e stato riconosciuto.`;
    }

    return {
      leakState,
      samplesRequested: sampleCount,
      samplesSucceeded,
      observedResolvers,
      observedSourceIps,
      distinctResolverCount,
      distinctNetworkCount,
      providerConfirmed,
      matchesIdentifiedProvider: evaluateProviderMatch(observedResolvers, dnsEnvironment),
      confidence,
      reliability: getReliabilityLabel(confidence),
      description,
      sources: { resolverSamples: true },
      futureSignals: FUTURE_SIGNALS,
      debug: { samples }
    };
  }

  globalObject.PrivacyDnsLeakDetection = {
    analyzeDnsLeak,
    getFallbackDnsLeakEnvironment: buildFallbackDnsLeakEnvironment
  };
})(window);
