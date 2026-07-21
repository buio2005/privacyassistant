(function attachDnsConfidenceEngine(globalObject) {
  const METHOD_LABELS = {
    catalog_provider: "Identificazione tramite catalogo provider",
    catalog_network: "Identificazione tramite rete provider catalogata",
    catalog_hostname: "Identificazione tramite hostname provider",
    catalog_signature: "Identificazione tramite firma catalogata",
    provider_verification: "Identificazione verificata dal provider",
    not_determinable: "Provider DNS non determinabile"
  };

  const METHOD_CONFIDENCE = {
    catalog_provider: 0.9,
    catalog_network: 0.82,
    catalog_hostname: 0.84,
    catalog_signature: 0.78,
    provider_verification: 0.97
  };

  function getReliabilityLabel(confidence) {
    if (confidence >= 0.9) {
      return "Alta";
    }
    if (confidence >= 0.6) {
      return "Media";
    }
    return "Bassa";
  }

  function evaluateIdentification(payload) {
    const match = payload && payload.match ? payload.match : null;
    const verification = payload && payload.verification ? payload.verification : null;

    if (!match) {
      if (verification && verification.matched) {
        const verifiedConfidence = METHOD_CONFIDENCE.provider_verification;
        return {
          confidence: verifiedConfidence,
          reliability: getReliabilityLabel(verifiedConfidence),
          determination: "confirmed",
          identificationMethod: "provider_verification",
          identificationMethodLabel: METHOD_LABELS.provider_verification,
          matchedSignatureLabel: verification.label || "Verifica provider",
          matchedSignatureValue: verification.signatureValue || "Non disponibile"
        };
      }

      return {
        confidence: 0.24,
        reliability: "Bassa",
        determination: "not_determinable",
        identificationMethod: "not_determinable",
        identificationMethodLabel: METHOD_LABELS.not_determinable,
        matchedSignatureLabel: "Nessuna corrispondenza",
        matchedSignatureValue: "Non disponibile"
      };
    }

    let identificationMethod = match.signature.method || "catalog_signature";
    let confidence = METHOD_CONFIDENCE[identificationMethod] || 0.68;
    let determination = identificationMethod === "catalog_provider" ? "catalog_identified" : "estimated";

    if (verification && verification.matched) {
      identificationMethod = "provider_verification";
      confidence = METHOD_CONFIDENCE.provider_verification;
      determination = "confirmed";
    }

    return {
      confidence,
      reliability: getReliabilityLabel(confidence),
      determination,
      identificationMethod,
      identificationMethodLabel: METHOD_LABELS[identificationMethod] || METHOD_LABELS.catalog_signature,
      matchedSignatureLabel: match.signature.label || "Firma catalogata",
      matchedSignatureValue: match.signatureValue || "Non disponibile"
    };
  }

  globalObject.PrivacyDnsConfidenceEngine = {
    evaluateIdentification
  };
})(window);
