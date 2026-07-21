(function attachPrivacyIntelligenceEngine(globalObject) {
  const CONTRACT_VERSION = "0.8.6";
  const CONTRACT_NAME = "privacy-signal-contract";
  const FUTURE_SIGNAL_ADAPTERS = [
    "VPN Protection Analysis",
    "DNS Leak Detection",
    "DNSSEC",
    "Guided Privacy Assistant"
  ];
  const COMMON_RESOLUTIONS = new Set([
    "1280 x 720",
    "1280 x 800",
    "1366 x 768",
    "1440 x 900",
    "1536 x 864",
    "1600 x 900",
    "1920 x 1080",
    "2560 x 1440"
  ]);
  const ALLOWED_SEVERITIES = new Set(["low", "medium", "high"]);
  const ALLOWED_PRIORITIES = new Set(["Bassa", "Media", "Alta"]);
  const ALLOWED_POLARITIES = new Set(["positive", "negative", "neutral"]);
  const ALLOWED_REMEDIATION_STATUSES = new Set([
    "direct",
    "indirect",
    "external_tool",
    "not_remediable",
    "not_applicable"
  ]);
  const ALLOWED_USER_CONTROL = new Set(["high", "medium", "low", "none"]);
  const ALLOWED_ESTIMATE_STATUS = new Set(["estimated", "not_estimated", "not_applicable"]);
  const ALLOWED_BENEFIT_LEVELS = new Set(["low", "medium", "high", null]);
  const SEVERITY_WEIGHTS = { low: 1, medium: 2, high: 3 };
  const PRIORITY_WEIGHTS = { Bassa: 1, Media: 2, Alta: 3 };
  const USER_CONTROL_WEIGHTS = { none: 0, low: 1, medium: 2, high: 3 };
  const REMEDIATION_WEIGHTS = {
    not_applicable: 0,
    not_remediable: 0,
    external_tool: 1,
    indirect: 2,
    direct: 3
  };
  const BENEFIT_WEIGHTS = { low: 1, medium: 2, high: 3 };
  const ROOT_CAUSE_CATALOG_VERSION = "0.8.2";
  const ROOT_CAUSE_CATALOG = Object.freeze({
    browser_foundation_quality: Object.freeze({
      rootCauseId: "browser_foundation_quality",
      domain: "browser",
      kind: "primary",
      activationMode: "automatic",
      title: "Qualita della base browser",
      description: "Rappresenta la qualita funzionale della base privacy del browser e della sua manutenzione nel tempo."
    }),
    dns_resolver_quality: Object.freeze({
      rootCauseId: "dns_resolver_quality",
      domain: "dns",
      kind: "primary",
      activationMode: "automatic",
      title: "Qualita del resolver DNS",
      description: "Rappresenta la qualita funzionale del resolver DNS rispetto al profilo privacy osservato."
    }),
    dns_security_posture: Object.freeze({
      rootCauseId: "dns_security_posture",
      domain: "dns",
      kind: "primary",
      activationMode: "automatic",
      title: "Postura di sicurezza DNS",
      description: "Rappresenta le protezioni di integrita del DNS, in particolare la validazione DNSSEC del resolver."
    }),
    webrtc_exposure_control: Object.freeze({
      rootCauseId: "webrtc_exposure_control",
      domain: "webrtc",
      kind: "primary",
      activationMode: "automatic",
      title: "Controllo dell'esposizione WebRTC",
      description: "Rappresenta quanto il browser controlla o espone le informazioni di rete attraverso WebRTC."
    }),
    network_tracking_preference: Object.freeze({
      rootCauseId: "network_tracking_preference",
      domain: "network",
      kind: "primary",
      activationMode: "automatic",
      title: "Preferenza di tracciamento in rete",
      description: "Rappresenta la preferenza osservabile del browser rispetto al segnale Do Not Track."
    }),
    network_profile_specificity: Object.freeze({
      rootCauseId: "network_profile_specificity",
      domain: "network",
      kind: "primary",
      activationMode: "automatic",
      title: "Specificita del profilo di rete",
      description: "Rappresenta quanto il profilo ambientale esposto dal browser appare generico oppure specifico."
    }),
    privacy_score_context: Object.freeze({
      rootCauseId: "privacy_score_context",
      domain: "score",
      kind: "contextual",
      activationMode: "reserved",
      title: "Contesto sintetico del punteggio privacy",
      description: "Root Cause contestuale riservata alla sintesi del punteggio; non deve essere creata automaticamente dai segnali di score."
    })
  });
  const ROOT_CAUSE_SIGNAL_MAPPING = Object.freeze({
    browser_privacy_foundation: "browser_foundation_quality",
    browser_family_profile: "browser_foundation_quality",
    browser_version_freshness: "browser_foundation_quality",
    network_do_not_track_preference: "network_tracking_preference",
    network_language_specificity: "network_profile_specificity",
    network_timezone_specificity: "network_profile_specificity",
    network_resolution_commonness: "network_profile_specificity",
    dns_provider_quality: "dns_resolver_quality",
    dns_leak_exposure: "dns_resolver_quality",
    dnssec_validation: "dns_security_posture",
    webrtc_functional_state: "webrtc_exposure_control",
    webrtc_public_address_observation: "webrtc_exposure_control",
    webrtc_mdns_masking: "webrtc_exposure_control"
  });
  const ROOT_CAUSE_EXCLUSION_RULES = Object.freeze([
    Object.freeze({
      matchType: "exact",
      value: "network_ip_stack_visibility",
      reason: "context_signal_not_root_cause"
    }),
    Object.freeze({
      matchType: "exact",
      value: "dns_detection_reliability",
      reason: "reliability_signal_not_root_cause"
    }),
    Object.freeze({
      matchType: "exact",
      value: "privacy_score_band",
      reason: "score_context_not_root_cause"
    }),
    Object.freeze({
      matchType: "prefix",
      value: "privacy_score_factor_",
      reason: "score_synthesis_not_root_cause"
    }),
    Object.freeze({
      matchType: "exact",
      value: "vpn_presence_observation",
      reason: "context_signal_not_root_cause"
    })
  ]);

  function isMeaningfulValue(value) {
    return value !== null
      && value !== undefined
      && value !== ""
      && value !== "Non disponibile"
      && value !== "Not available";
  }

  function normalizeConfidenceValue(value, fallback) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return fallback;
    }

    return Math.max(0, Math.min(1, numericValue));
  }

  function normalizeLikelyGain(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return 0;
    }

    return Math.round(numericValue);
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function uniqueStrings(values) {
    return Array.from(new Set((values || []).filter(Boolean).map((value) => String(value))));
  }

  function buildSourceFields(source, fields) {
    return (fields || []).filter(Boolean).map((fieldName) => `${source}.${fieldName}`);
  }

  function createConfidence(confidenceDefinition) {
    if (typeof confidenceDefinition === "number") {
      const normalizedValue = normalizeConfidenceValue(confidenceDefinition, 0.6);
      return {
        sourceConfidence: normalizedValue,
        interpretationConfidence: normalizedValue,
        overallConfidence: normalizedValue
      };
    }

    const sourceConfidence = normalizeConfidenceValue(
      confidenceDefinition && confidenceDefinition.sourceConfidence,
      0.6
    );
    const interpretationConfidence = normalizeConfidenceValue(
      confidenceDefinition && confidenceDefinition.interpretationConfidence,
      sourceConfidence
    );
    const overallConfidence = normalizeConfidenceValue(
      confidenceDefinition && confidenceDefinition.overallConfidence,
      (sourceConfidence + interpretationConfidence) / 2
    );

    return {
      sourceConfidence,
      interpretationConfidence,
      overallConfidence
    };
  }

  function createRemediation(remediationDefinition) {
    const status = remediationDefinition && ALLOWED_REMEDIATION_STATUSES.has(remediationDefinition.status)
      ? remediationDefinition.status
      : "not_applicable";
    const userControl = remediationDefinition && ALLOWED_USER_CONTROL.has(remediationDefinition.userControl)
      ? remediationDefinition.userControl
      : "none";

    return {
      status,
      userControl
    };
  }

  function createBenefitEstimate(benefitDefinition) {
    const status = benefitDefinition && ALLOWED_ESTIMATE_STATUS.has(benefitDefinition.status)
      ? benefitDefinition.status
      : "not_applicable";
    const level = benefitDefinition && ALLOWED_BENEFIT_LEVELS.has(benefitDefinition.level)
      ? benefitDefinition.level
      : (status === "estimated" ? "low" : null);
    const basis = benefitDefinition && benefitDefinition.basis
      ? String(benefitDefinition.basis)
      : "plausible";

    return {
      status,
      level,
      basis
    };
  }

  function createScoreImpactEstimate(estimateDefinition) {
    const status = estimateDefinition && ALLOWED_ESTIMATE_STATUS.has(estimateDefinition.status)
      ? estimateDefinition.status
      : "not_applicable";

    return {
      status,
      likelyGain: status === "estimated"
        ? normalizeLikelyGain(estimateDefinition && estimateDefinition.likelyGain)
        : 0
    };
  }

  function buildDefaultDecisionHints(definition, confidence) {
    const hints = [];

    if (definition.status === "informative") {
      hints.push("context_signal_only");
    }

    if (definition.polarity === "negative" && definition.status === "active") {
      hints.push("candidate_for_main_issue", "candidate_for_priority_action");
    }

    if (definition.polarity === "positive" && definition.status === "active") {
      hints.push("candidate_for_strength");
    }

    if (definition.remediation && definition.remediation.status === "direct") {
      hints.push("direct_user_action");
    }

    if (definition.remediation && definition.remediation.status === "external_tool") {
      hints.push("requires_external_tool");
    }

    if (confidence.overallConfidence < 0.6) {
      hints.push("requires_prudence");
    }

    return hints;
  }

  function createDecisionSupport(definition, confidence) {
    return {
      reasonCodes: uniqueStrings(
        definition.decisionSupport && definition.decisionSupport.reasonCodes
          ? definition.decisionSupport.reasonCodes
          : []
      ),
      decisionHints: uniqueStrings(
        (definition.decisionSupport && definition.decisionSupport.decisionHints
          ? definition.decisionSupport.decisionHints
          : []).concat(buildDefaultDecisionHints(definition, confidence))
      )
    };
  }

  function createSignalProfile(profileDefinition) {
    return {
      normalizedValue: profileDefinition.normalizedValue,
      polarity: profileDefinition.polarity || "neutral",
      intrinsicSeverity: profileDefinition.intrinsicSeverity || "low",
      suggestedPriority: profileDefinition.suggestedPriority || "Bassa",
      remediation: createRemediation(profileDefinition.remediation),
      benefitEstimate: createBenefitEstimate(profileDefinition.benefitEstimate),
      scoreImpactEstimate: createScoreImpactEstimate(profileDefinition.scoreImpactEstimate),
      decisionSupport: profileDefinition.decisionSupport || {}
    };
  }

  function createSignal(definition) {
    const confidence = createConfidence(definition.confidence);
    const remediation = createRemediation(definition.remediation);
    const benefitEstimate = createBenefitEstimate(definition.benefitEstimate);
    const scoreImpactEstimate = createScoreImpactEstimate(definition.scoreImpactEstimate);

    return {
      id: definition.id,
      source: definition.source,
      category: definition.category || "general",
      polarity: definition.polarity || "neutral",
      intrinsicSeverity: definition.intrinsicSeverity || "low",
      suggestedPriority: definition.suggestedPriority || "Bassa",
      status: definition.status || "informative",
      confidence,
      title: definition.title || definition.id,
      detail: definition.detail || "",
      suggestedAction: definition.suggestedAction || "",
      rationale: definition.rationale || "",
      decisionSupport: createDecisionSupport(
        {
          polarity: definition.polarity || "neutral",
          status: definition.status || "informative",
          remediation,
          decisionSupport: definition.decisionSupport
        },
        confidence
      ),
      evidence: uniqueStrings(definition.evidence || []),
      tags: uniqueStrings(definition.tags || []),
      sourceFields: buildSourceFields(definition.source, definition.sourceFields || []),
      rawValue: definition.rawValue,
      normalizedValue: definition.normalizedValue,
      remediation,
      benefitEstimate,
      scoreImpactEstimate,
      contractVersion: CONTRACT_VERSION
    };
  }

  function mapBrowserPrivacyLevel(level) {
    const normalizedLevel = String(level || "Base");

    if (normalizedLevel === "Base") {
      return createSignalProfile({
        normalizedValue: "base",
        polarity: "negative",
        intrinsicSeverity: "medium",
        suggestedPriority: "Media",
        remediation: { status: "indirect", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: 5 },
        decisionSupport: {
          reasonCodes: ["browser_privacy_level_base"],
          decisionHints: ["foundation_signal"]
        }
      });
    }

    if (normalizedLevel === "Buono") {
      return createSignalProfile({
        normalizedValue: "good",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["browser_privacy_level_good"]
        }
      });
    }

    if (normalizedLevel === "Avanzato") {
      return createSignalProfile({
        normalizedValue: "advanced",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["browser_privacy_level_advanced"]
        }
      });
    }

    if (normalizedLevel === "Molto Avanzato") {
      return createSignalProfile({
        normalizedValue: "very_advanced",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["browser_privacy_level_very_advanced"]
        }
      });
    }

    if (normalizedLevel === "Specializzato") {
      return createSignalProfile({
        normalizedValue: "specialized",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["browser_privacy_level_specialized"]
        }
      });
    }

    return createSignalProfile({
      normalizedValue: "unknown",
      polarity: "neutral",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "not_applicable", userControl: "none" },
      benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
      scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
      decisionSupport: {
        reasonCodes: ["browser_privacy_level_unknown"],
        decisionHints: ["requires_prudence"]
      }
    });
  }

  function getBrowserVersionFreshness(browserEnvironment) {
    const normalizedVersion = String(browserEnvironment && browserEnvironment.version || "").trim();
    const majorMatch = normalizedVersion.match(/^(\d+)/);
    const majorVersion = majorMatch ? parseInt(majorMatch[1], 10) : null;
    const family = browserEnvironment && browserEnvironment.family ? browserEnvironment.family : "Non disponibile";

    if (majorVersion === null) {
      return createSignalProfile({
        normalizedValue: "unknown",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["browser_version_unknown"],
          decisionHints: ["requires_prudence"]
        }
      });
    }

    if (family === "Chromium Family") {
      if (majorVersion >= 120) {
        return createSignalProfile({
          normalizedValue: "current",
          polarity: "positive",
          intrinsicSeverity: "low",
          suggestedPriority: "Bassa",
          remediation: { status: "not_applicable", userControl: "none" },
          benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
          scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
          decisionSupport: { reasonCodes: ["browser_version_current"] }
        });
      }

      if (majorVersion >= 110) {
        return createSignalProfile({
          normalizedValue: "recent",
          polarity: "neutral",
          intrinsicSeverity: "low",
          suggestedPriority: "Media",
          remediation: { status: "direct", userControl: "high" },
          benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
          scoreImpactEstimate: { status: "estimated", likelyGain: 2 },
          decisionSupport: { reasonCodes: ["browser_version_recent"] }
        });
      }

      return createSignalProfile({
        normalizedValue: "outdated",
        polarity: "negative",
        intrinsicSeverity: "medium",
        suggestedPriority: "Media",
        remediation: { status: "direct", userControl: "high" },
        benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: 4 },
        decisionSupport: { reasonCodes: ["browser_version_outdated"] }
      });
    }

    if (family === "Firefox Family" || family === "Tor Family") {
      if (majorVersion >= 115) {
        return createSignalProfile({
          normalizedValue: "current",
          polarity: "positive",
          intrinsicSeverity: "low",
          suggestedPriority: "Bassa",
          remediation: { status: "not_applicable", userControl: "none" },
          benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
          scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
          decisionSupport: { reasonCodes: ["browser_version_current"] }
        });
      }

      if (majorVersion >= 102) {
        return createSignalProfile({
          normalizedValue: "recent",
          polarity: "neutral",
          intrinsicSeverity: "low",
          suggestedPriority: "Media",
          remediation: { status: "direct", userControl: "high" },
          benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
          scoreImpactEstimate: { status: "estimated", likelyGain: 2 },
          decisionSupport: { reasonCodes: ["browser_version_recent"] }
        });
      }

      return createSignalProfile({
        normalizedValue: "outdated",
        polarity: "negative",
        intrinsicSeverity: "medium",
        suggestedPriority: "Media",
        remediation: { status: "direct", userControl: "high" },
        benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: 4 },
        decisionSupport: { reasonCodes: ["browser_version_outdated"] }
      });
    }

    return createSignalProfile({
      normalizedValue: "unknown_family",
      polarity: "neutral",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "not_applicable", userControl: "none" },
      benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
      scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
      decisionSupport: {
        reasonCodes: ["browser_family_unknown_for_version"],
        decisionHints: ["requires_prudence"]
      }
    });
  }

  function adaptBrowserSignals(browserEnvironment) {
    const resolvedEnvironment = browserEnvironment || {};
    const privacyFoundation = mapBrowserPrivacyLevel(resolvedEnvironment.privacyLevel);
    const versionFreshness = getBrowserVersionFreshness(resolvedEnvironment);
    const familyId = String(resolvedEnvironment.family || "Non disponibile");
    const familySignalProfile = familyId === "Tor Family"
      ? createSignalProfile({
          normalizedValue: "tor_family",
          polarity: "positive",
          intrinsicSeverity: "low",
          suggestedPriority: "Bassa",
          remediation: { status: "not_applicable", userControl: "none" },
          benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
          scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
          decisionSupport: { reasonCodes: ["browser_family_tor"] }
        })
      : familyId === "Firefox Family"
        ? createSignalProfile({
            normalizedValue: "firefox_family",
            polarity: "positive",
            intrinsicSeverity: "low",
            suggestedPriority: "Bassa",
            remediation: { status: "not_applicable", userControl: "none" },
            benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
            scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
            decisionSupport: { reasonCodes: ["browser_family_firefox"] }
          })
        : familyId === "Chromium Family"
          ? createSignalProfile({
              normalizedValue: "chromium_family",
              polarity: "neutral",
              intrinsicSeverity: "low",
              suggestedPriority: "Bassa",
              remediation: { status: "not_applicable", userControl: "none" },
              benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
              scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
              decisionSupport: { reasonCodes: ["browser_family_chromium"] }
            })
          : createSignalProfile({
              normalizedValue: "unknown_family",
              polarity: "neutral",
              intrinsicSeverity: "low",
              suggestedPriority: "Bassa",
              remediation: { status: "not_applicable", userControl: "none" },
              benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
              scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
              decisionSupport: {
                reasonCodes: ["browser_family_unknown"],
                decisionHints: ["requires_prudence"]
              }
            });

    return [
      createSignal({
        id: "browser_privacy_foundation",
        source: "browser",
        category: "browser_foundation",
        polarity: privacyFoundation.polarity,
        intrinsicSeverity: privacyFoundation.intrinsicSeverity,
        suggestedPriority: privacyFoundation.suggestedPriority,
        status: "active",
        confidence: {
          sourceConfidence: 0.92,
          interpretationConfidence: 0.9
        },
        title: "Base privacy del browser",
        detail: `Il browser rilevato e ${resolvedEnvironment.browser || "Non disponibile"} e il suo livello privacy informativo e ${resolvedEnvironment.privacyLevel || "Non disponibile"}.`,
        suggestedAction: privacyFoundation.remediation.status !== "not_applicable"
          ? "Valuta un browser con una base privacy piu forte oppure rafforza le impostazioni del browser attuale."
          : "Mantieni questa base browser e concentra l'attenzione sui segnali tecnici che incidono di piu.",
        rationale: "Il segnale deriva dal profilo privacy attribuito al browser rilevato dal modulo Browser Detection.",
        decisionSupport: privacyFoundation.decisionSupport,
        evidence: [
          `Browser: ${resolvedEnvironment.browser || "Non disponibile"}`,
          `Livello privacy: ${resolvedEnvironment.privacyLevel || "Non disponibile"}`,
          `Famiglia: ${resolvedEnvironment.family || "Non disponibile"}`
        ],
        sourceFields: ["browser", "privacyLevel", "family"],
        rawValue: resolvedEnvironment.privacyLevel,
        normalizedValue: privacyFoundation.normalizedValue,
        remediation: privacyFoundation.remediation,
        benefitEstimate: privacyFoundation.benefitEstimate,
        scoreImpactEstimate: privacyFoundation.scoreImpactEstimate,
        tags: ["browser", "foundation"]
      }),
      createSignal({
        id: "browser_family_profile",
        source: "browser",
        category: "browser_foundation",
        polarity: familySignalProfile.polarity,
        intrinsicSeverity: familySignalProfile.intrinsicSeverity,
        suggestedPriority: familySignalProfile.suggestedPriority,
        status: "active",
        confidence: {
          sourceConfidence: 0.88,
          interpretationConfidence: 0.84
        },
        title: "Famiglia tecnica del browser",
        detail: `La famiglia browser rilevata e ${resolvedEnvironment.family || "Non disponibile"}.`,
        suggestedAction: "Usa questa informazione come contesto: la famiglia browser influisce sulla base di partenza, ma non sostituisce le altre verifiche.",
        rationale: "Il segnale descrive la famiglia tecnica del browser e aiuta a contestualizzare compatibilita, base privacy e margini di miglioramento.",
        decisionSupport: familySignalProfile.decisionSupport,
        evidence: [
          `Famiglia: ${resolvedEnvironment.family || "Non disponibile"}`,
          `Browser ID: ${resolvedEnvironment.browserId || "unknown"}`
        ],
        sourceFields: ["family", "browserId"],
        rawValue: resolvedEnvironment.family,
        normalizedValue: familySignalProfile.normalizedValue,
        remediation: familySignalProfile.remediation,
        benefitEstimate: familySignalProfile.benefitEstimate,
        scoreImpactEstimate: familySignalProfile.scoreImpactEstimate,
        tags: ["browser", "family"]
      }),
      createSignal({
        id: "browser_version_freshness",
        source: "browser",
        category: "browser_foundation",
        polarity: versionFreshness.polarity,
        intrinsicSeverity: versionFreshness.intrinsicSeverity,
        suggestedPriority: versionFreshness.suggestedPriority,
        status: "active",
        confidence: {
          sourceConfidence: 0.85,
          interpretationConfidence: 0.82
        },
        title: "Aggiornamento del browser",
        detail: `La versione osservata e ${resolvedEnvironment.version || "Non disponibile"} e viene normalizzata come ${versionFreshness.normalizedValue}.`,
        suggestedAction: versionFreshness.remediation.status === "direct"
          ? "Controlla se e disponibile una versione piu recente del browser."
          : "La versione osservata non richiede un intervento prioritario sulla base di questo segnale.",
        rationale: "Il segnale usa la versione principale e la famiglia browser per stimare se il browser appare aggiornato rispetto a soglie informative del progetto.",
        decisionSupport: versionFreshness.decisionSupport,
        evidence: [
          `Versione: ${resolvedEnvironment.version || "Non disponibile"}`,
          `Famiglia: ${resolvedEnvironment.family || "Non disponibile"}`
        ],
        sourceFields: ["version", "family"],
        rawValue: resolvedEnvironment.version,
        normalizedValue: versionFreshness.normalizedValue,
        remediation: versionFreshness.remediation,
        benefitEstimate: versionFreshness.benefitEstimate,
        scoreImpactEstimate: versionFreshness.scoreImpactEstimate,
        tags: ["browser", "version"]
      })
    ];
  }

  function normalizeLanguageSpecificity(languageValue) {
    const normalized = String(languageValue || "").trim();

    if (!isMeaningfulValue(normalized)) {
      return createSignalProfile({
        normalizedValue: "unavailable",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["language_unavailable"],
          decisionHints: ["requires_prudence"]
        }
      });
    }

    if (/^[a-z]{2}$/i.test(normalized)) {
      return createSignalProfile({
        normalizedValue: "language_only",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["language_generic"]
        }
      });
    }

    if (/^[a-z]{2}-[A-Z]{2}$/i.test(normalized)) {
      return createSignalProfile({
        normalizedValue: "locale_specific",
        polarity: "negative",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "direct", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "low", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: 1 },
        decisionSupport: {
          reasonCodes: ["language_locale_specific"]
        }
      });
    }

    return createSignalProfile({
      normalizedValue: "custom_format",
      polarity: "neutral",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "not_applicable", userControl: "none" },
      benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
      scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
      decisionSupport: {
        reasonCodes: ["language_custom_format"],
        decisionHints: ["requires_prudence"]
      }
    });
  }

  function normalizeTimezoneSpecificity(timezoneValue) {
    const normalized = String(timezoneValue || "").trim();

    if (!isMeaningfulValue(normalized)) {
      return createSignalProfile({
        normalizedValue: "unavailable",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["timezone_unavailable"],
          decisionHints: ["requires_prudence"]
        }
      });
    }

    if (normalized === "UTC") {
      return createSignalProfile({
        normalizedValue: "utc",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["timezone_utc"]
        }
      });
    }

    return createSignalProfile({
      normalizedValue: "named_timezone",
      polarity: "neutral",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "indirect", userControl: "low" },
      benefitEstimate: { status: "estimated", level: "low", basis: "plausible" },
      scoreImpactEstimate: { status: "estimated", likelyGain: 1 },
      decisionSupport: {
        reasonCodes: ["timezone_named"]
      }
    });
  }

  function normalizeResolutionCommonness(resolutionValue) {
    const normalized = String(resolutionValue || "").trim();

    if (!isMeaningfulValue(normalized)) {
      return createSignalProfile({
        normalizedValue: "unavailable",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["resolution_unavailable"],
          decisionHints: ["requires_prudence"]
        }
      });
    }

    if (COMMON_RESOLUTIONS.has(normalized)) {
      return createSignalProfile({
        normalizedValue: "common",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["resolution_common"]
        }
      });
    }

    return createSignalProfile({
      normalizedValue: "less_common",
      polarity: "neutral",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "not_applicable", userControl: "none" },
      benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
      scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
      decisionSupport: {
        reasonCodes: ["resolution_less_common"]
      }
    });
  }

  function adaptNetworkSignals(networkEnvironment) {
    const resolvedEnvironment = networkEnvironment || {};
    const hasIpv4 = isMeaningfulValue(resolvedEnvironment.ipv4);
    const hasIpv6 = isMeaningfulValue(resolvedEnvironment.ipv6);
    const dntEnabled = resolvedEnvironment.doNotTrack === "Attivo";
    const dntDisabled = resolvedEnvironment.doNotTrack === "Disattivo";
    const languageSpecificity = normalizeLanguageSpecificity(resolvedEnvironment.browserLanguage);
    const timezoneSpecificity = normalizeTimezoneSpecificity(resolvedEnvironment.timezone);
    const resolutionCommonness = normalizeResolutionCommonness(resolvedEnvironment.screenResolution);
    const stackProfile = hasIpv4 && hasIpv6
      ? "dual_stack_visible"
      : hasIpv6
        ? "ipv6_only_visible"
        : hasIpv4
          ? "ipv4_only_visible"
          : "ip_not_available";

    return [
      createSignal({
        id: "network_do_not_track_preference",
        source: "network",
        category: "network_exposure",
        polarity: dntEnabled ? "positive" : dntDisabled ? "negative" : "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: dntDisabled ? "Media" : "Bassa",
        status: "active",
        confidence: {
          sourceConfidence: 0.86,
          interpretationConfidence: 0.84
        },
        title: "Preferenza Do Not Track",
        detail: `Il browser dichiara Do Not Track: ${resolvedEnvironment.doNotTrack || "Non disponibile"}.`,
        suggestedAction: dntDisabled
          ? "Valuta di attivare Do Not Track sapendo che non sostituisce le protezioni tecniche, ma puo aggiungere un segnale di preferenza."
          : "Mantieni questa preferenza e considera Do Not Track come un supporto, non come protezione sufficiente da solo.",
        rationale: "Il segnale deriva dalla preferenza DNT esposta dal browser al modulo Network Detection.",
        decisionSupport: {
          reasonCodes: [dntDisabled ? "dnt_disabled" : dntEnabled ? "dnt_enabled" : "dnt_unavailable"]
        },
        evidence: [`Do Not Track: ${resolvedEnvironment.doNotTrack || "Non disponibile"}`],
        sourceFields: ["doNotTrack"],
        rawValue: resolvedEnvironment.doNotTrack,
        normalizedValue: dntEnabled ? "enabled" : dntDisabled ? "disabled" : "unavailable",
        remediation: dntDisabled
          ? { status: "direct", userControl: "high" }
          : { status: "not_applicable", userControl: "none" },
        benefitEstimate: dntDisabled
          ? { status: "estimated", level: "low", basis: "plausible" }
          : { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: dntDisabled
          ? { status: "estimated", likelyGain: 2 }
          : { status: "not_applicable", likelyGain: 0 },
        tags: ["network", "dnt"]
      }),
      createSignal({
        id: "network_ip_stack_visibility",
        source: "network",
        category: "network_exposure",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        status: "active",
        confidence: {
          sourceConfidence: 0.82,
          interpretationConfidence: 0.78
        },
        title: "Visibilita dello stack IP",
        detail: `IPv4 osservato: ${resolvedEnvironment.ipv4 || "Non disponibile"}; IPv6 osservato: ${resolvedEnvironment.ipv6 || "Non disponibile"}.`,
        suggestedAction: "Usa questo segnale come contesto di esposizione di rete, senza interpretarlo da solo come problema principale.",
        rationale: "Il segnale descrive quali indirizzi pubblici risultano osservabili nella sessione corrente.",
        decisionSupport: {
          reasonCodes: ["network_ip_stack_visibility"],
          decisionHints: ["context_signal_only"]
        },
        evidence: [
          `IPv4: ${resolvedEnvironment.ipv4 || "Non disponibile"}`,
          `IPv6: ${resolvedEnvironment.ipv6 || "Non disponibile"}`
        ],
        sourceFields: ["ipv4", "ipv6"],
        rawValue: { ipv4: resolvedEnvironment.ipv4, ipv6: resolvedEnvironment.ipv6 },
        normalizedValue: stackProfile,
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        tags: ["network", "ip"]
      }),
      createSignal({
        id: "network_language_specificity",
        source: "network",
        category: "network_exposure",
        polarity: languageSpecificity.polarity,
        intrinsicSeverity: languageSpecificity.intrinsicSeverity,
        suggestedPriority: languageSpecificity.suggestedPriority,
        status: "active",
        confidence: {
          sourceConfidence: 0.78,
          interpretationConfidence: 0.74
        },
        title: "Specificita della lingua browser",
        detail: `La lingua dichiarata dal browser e ${resolvedEnvironment.browserLanguage || "Non disponibile"}.`,
        suggestedAction: languageSpecificity.remediation.status === "direct"
          ? "Se vuoi ridurre leggermente la specificita del profilo, valuta una lingua browser meno granulare."
          : "Questo segnale ha un ruolo secondario e serve soprattutto come contesto del profilo esposto.",
        rationale: "Il segnale misura se il browser espone una lingua generica o una locale piu specifica.",
        decisionSupport: languageSpecificity.decisionSupport,
        evidence: [`Lingua browser: ${resolvedEnvironment.browserLanguage || "Non disponibile"}`],
        sourceFields: ["browserLanguage"],
        rawValue: resolvedEnvironment.browserLanguage,
        normalizedValue: languageSpecificity.normalizedValue,
        remediation: languageSpecificity.remediation,
        benefitEstimate: languageSpecificity.benefitEstimate,
        scoreImpactEstimate: languageSpecificity.scoreImpactEstimate,
        tags: ["network", "language"]
      }),
      createSignal({
        id: "network_timezone_specificity",
        source: "network",
        category: "network_exposure",
        polarity: timezoneSpecificity.polarity,
        intrinsicSeverity: timezoneSpecificity.intrinsicSeverity,
        suggestedPriority: timezoneSpecificity.suggestedPriority,
        status: "active",
        confidence: {
          sourceConfidence: 0.8,
          interpretationConfidence: 0.75
        },
        title: "Specificita del fuso orario",
        detail: `Il fuso orario osservato e ${resolvedEnvironment.timezone || "Non disponibile"}.`,
        suggestedAction: timezoneSpecificity.remediation.status !== "not_applicable"
          ? "Valuta se usare un contesto temporale meno specifico quando il tuo modello di uso lo consente."
          : "Il segnale ha valore contestuale e non richiede un intervento prioritario in questa fase.",
        rationale: "Il segnale descrive quanto il fuso orario dichiarato puo contribuire al profilo ambientale esposto.",
        decisionSupport: timezoneSpecificity.decisionSupport,
        evidence: [`Timezone: ${resolvedEnvironment.timezone || "Non disponibile"}`],
        sourceFields: ["timezone"],
        rawValue: resolvedEnvironment.timezone,
        normalizedValue: timezoneSpecificity.normalizedValue,
        remediation: timezoneSpecificity.remediation,
        benefitEstimate: timezoneSpecificity.benefitEstimate,
        scoreImpactEstimate: timezoneSpecificity.scoreImpactEstimate,
        tags: ["network", "timezone"]
      }),
      createSignal({
        id: "network_resolution_commonness",
        source: "network",
        category: "network_exposure",
        polarity: resolutionCommonness.polarity,
        intrinsicSeverity: resolutionCommonness.intrinsicSeverity,
        suggestedPriority: resolutionCommonness.suggestedPriority,
        status: "active",
        confidence: {
          sourceConfidence: 0.76,
          interpretationConfidence: 0.72
        },
        title: "Comuniata della risoluzione schermo",
        detail: `La risoluzione esposta al browser e ${resolvedEnvironment.screenResolution || "Non disponibile"}.`,
        suggestedAction: "Usa questo segnale come contesto del profilo ambientale, non come intervento prioritario isolato.",
        rationale: "Il segnale stima se la risoluzione osservata appare comune o piu particolare rispetto ai profili piu diffusi.",
        decisionSupport: resolutionCommonness.decisionSupport,
        evidence: [`Risoluzione: ${resolvedEnvironment.screenResolution || "Non disponibile"}`],
        sourceFields: ["screenResolution"],
        rawValue: resolvedEnvironment.screenResolution,
        normalizedValue: resolutionCommonness.normalizedValue,
        remediation: resolutionCommonness.remediation,
        benefitEstimate: resolutionCommonness.benefitEstimate,
        scoreImpactEstimate: resolutionCommonness.scoreImpactEstimate,
        tags: ["network", "screen"]
      })
    ];
  }

  function getDnsProviderQuality(providerName) {
    const normalizedProvider = String(providerName || "").trim();

    if (normalizedProvider === "NextDNS" || normalizedProvider === "ControlD" || normalizedProvider === "Quad9") {
      return createSignalProfile({
        normalizedValue: "strong_privacy_provider",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["dns_provider_strong_privacy"]
        }
      });
    }

    if (normalizedProvider === "AdGuard DNS" || normalizedProvider === "Cloudflare") {
      return createSignalProfile({
        normalizedValue: "good_privacy_provider",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["dns_provider_good_privacy"]
        }
      });
    }

    if (normalizedProvider === "OpenDNS" || normalizedProvider === "Google DNS") {
      return createSignalProfile({
        normalizedValue: "mixed_privacy_provider",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Media",
        remediation: { status: "external_tool", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: 3 },
        decisionSupport: {
          reasonCodes: ["dns_provider_mixed_privacy"]
        }
      });
    }

    return createSignalProfile({
      normalizedValue: "provider_not_determinable",
      polarity: "neutral",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "not_applicable", userControl: "none" },
      benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
      scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
      decisionSupport: {
        reasonCodes: ["dns_provider_not_determinable"],
        decisionHints: ["requires_prudence"]
      }
    });
  }

  function normalizeDnsReliability(reliability, confidence) {
    const normalizedReliability = String(reliability || "").trim();
    const numericConfidence = normalizeConfidenceValue(confidence, 0.24);

    if (normalizedReliability === "Alta" || numericConfidence >= 0.85) {
      return createSignalProfile({
        normalizedValue: "high",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: { reasonCodes: ["dns_reliability_high"] }
      });
    }

    if (normalizedReliability === "Media" || numericConfidence >= 0.6) {
      return createSignalProfile({
        normalizedValue: "medium",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: { reasonCodes: ["dns_reliability_medium"] }
      });
    }

    return createSignalProfile({
      normalizedValue: "low",
      polarity: "neutral",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "not_applicable", userControl: "none" },
      benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
      scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
      decisionSupport: {
        reasonCodes: ["dns_reliability_low"],
        decisionHints: ["requires_prudence"]
      }
    });
  }

  function adaptDnsSignals(dnsEnvironment) {
    const resolvedEnvironment = dnsEnvironment || {};
    const providerQuality = getDnsProviderQuality(resolvedEnvironment.provider);
    const reliabilityProfile = normalizeDnsReliability(resolvedEnvironment.reliability, resolvedEnvironment.confidence);

    return [
      createSignal({
        id: "dns_provider_quality",
        source: "dns",
        category: "dns_quality",
        polarity: providerQuality.polarity,
        intrinsicSeverity: providerQuality.intrinsicSeverity,
        suggestedPriority: providerQuality.suggestedPriority,
        status: "active",
        confidence: {
          sourceConfidence: normalizeConfidenceValue(resolvedEnvironment.confidence, 0.24),
          interpretationConfidence: 0.78
        },
        title: "Qualita privacy del provider DNS",
        detail: `Provider rilevato: ${resolvedEnvironment.provider || "Provider DNS non determinabile"}. Livello privacy stimato: ${resolvedEnvironment.privacyLevel || "Non disponibile"}.`,
        suggestedAction: providerQuality.remediation.status !== "not_applicable"
          ? "Se vuoi un miglioramento concreto, valuta un resolver piu orientato alla privacy."
          : "Usa questo segnale come parte del contesto generale della configurazione.",
        rationale: "Il segnale deriva dal provider DNS rilevato e dalla qualita privacy informativa associata nel catalogo del progetto.",
        decisionSupport: providerQuality.decisionSupport,
        evidence: [
          `Provider: ${resolvedEnvironment.provider || "Provider DNS non determinabile"}`,
          `Livello privacy: ${resolvedEnvironment.privacyLevel || "Non disponibile"}`,
          `Affidabilita: ${resolvedEnvironment.reliability || "Bassa"}`
        ],
        sourceFields: ["provider", "privacyLevel", "reliability", "confidence"],
        rawValue: resolvedEnvironment.provider,
        normalizedValue: providerQuality.normalizedValue,
        remediation: providerQuality.remediation,
        benefitEstimate: providerQuality.benefitEstimate,
        scoreImpactEstimate: providerQuality.scoreImpactEstimate,
        tags: ["dns", "provider"]
      }),
      createSignal({
        id: "dns_detection_reliability",
        source: "dns",
        category: "dns_quality",
        polarity: reliabilityProfile.polarity,
        intrinsicSeverity: reliabilityProfile.intrinsicSeverity,
        suggestedPriority: "Bassa",
        status: "informative",
        confidence: {
          sourceConfidence: normalizeConfidenceValue(resolvedEnvironment.confidence, 0.24),
          interpretationConfidence: 0.84
        },
        title: "Affidabilita della rilevazione DNS",
        detail: `La rilevazione DNS ha affidabilita ${resolvedEnvironment.reliability || "Bassa"} con confidenza ${Math.round(normalizeConfidenceValue(resolvedEnvironment.confidence, 0.24) * 100)}%.`,
        suggestedAction: "Usa questo segnale per pesare correttamente il valore del risultato DNS dentro la lettura complessiva.",
        rationale: "Il segnale non giudica il provider in se, ma quanto la rilevazione appare affidabile in questa sessione.",
        decisionSupport: reliabilityProfile.decisionSupport,
        evidence: [
          `Affidabilita: ${resolvedEnvironment.reliability || "Bassa"}`,
          `Confidenza: ${Math.round(normalizeConfidenceValue(resolvedEnvironment.confidence, 0.24) * 100)}%`,
          `Metodo: ${resolvedEnvironment.identificationMethodLabel || "Provider DNS non determinabile"}`
        ],
        sourceFields: ["reliability", "confidence", "identificationMethodLabel"],
        rawValue: resolvedEnvironment.reliability,
        normalizedValue: reliabilityProfile.normalizedValue,
        remediation: reliabilityProfile.remediation,
        benefitEstimate: reliabilityProfile.benefitEstimate,
        scoreImpactEstimate: reliabilityProfile.scoreImpactEstimate,
        tags: ["dns", "reliability"]
      })
    ];
  }

  function getDnsLeakProfile(dnsLeakEnvironment) {
    const state = dnsLeakEnvironment && dnsLeakEnvironment.leakState
      ? dnsLeakEnvironment.leakState
      : "not_determinable";

    if (state === "multiple_resolvers") {
      return createSignalProfile({
        normalizedValue: "multiple_resolvers",
        polarity: "negative",
        intrinsicSeverity: "medium",
        suggestedPriority: "Media",
        remediation: { status: "external_tool", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: 5 },
        decisionSupport: { reasonCodes: ["dns_leak_multiple_resolvers"] }
      });
    }

    if (state === "protected") {
      return createSignalProfile({
        normalizedValue: "protected",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: { reasonCodes: ["dns_leak_protected"] }
      });
    }

    if (state === "single_resolver") {
      return createSignalProfile({
        normalizedValue: "single_resolver",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: { reasonCodes: ["dns_leak_single_resolver"] }
      });
    }

    return createSignalProfile({
      normalizedValue: "not_determinable",
      polarity: "neutral",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "not_applicable", userControl: "none" },
      benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
      scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
      decisionSupport: { reasonCodes: ["dns_leak_not_determinable"] }
    });
  }

  function adaptDnsLeakSignals(dnsLeakEnvironment) {
    const resolvedEnvironment = dnsLeakEnvironment || {};
    const profile = getDnsLeakProfile(resolvedEnvironment);
    const state = profile.normalizedValue;
    const isIssue = state === "multiple_resolvers";
    const isStrength = state === "protected";
    const distinctResolverCount = Number.isFinite(resolvedEnvironment.distinctResolverCount)
      ? resolvedEnvironment.distinctResolverCount
      : 0;
    const samplesSucceeded = Number.isFinite(resolvedEnvironment.samplesSucceeded)
      ? resolvedEnvironment.samplesSucceeded
      : 0;
    const samplesRequested = Number.isFinite(resolvedEnvironment.samplesRequested)
      ? resolvedEnvironment.samplesRequested
      : 0;

    return [
      createSignal({
        id: "dns_leak_exposure",
        source: "dns",
        category: "dns_quality",
        polarity: profile.polarity,
        intrinsicSeverity: profile.intrinsicSeverity,
        suggestedPriority: profile.suggestedPriority,
        status: (isIssue || isStrength) ? "active" : "informative",
        confidence: {
          sourceConfidence: normalizeConfidenceValue(resolvedEnvironment.confidence, 0.2),
          interpretationConfidence: 0.7
        },
        title: "Esposizione da leak DNS",
        detail: resolvedEnvironment.description || "Stato del leak DNS non determinabile in questa sessione.",
        suggestedAction: isIssue
          ? "Se usi una VPN o un DNS privato, verifica che tutto il traffico DNS passi da quel resolver ed evita risoluzioni fuori tunnel."
          : isStrength
            ? "Nessuna azione necessaria: il DNS passa da un provider verificato ed e la configurazione da mantenere."
            : "Usa questo segnale come parte del contesto DNS complessivo.",
        rationale: "Il segnale deriva dall'osservazione di quanti resolver DNS distinti rispondono a piu campioni con sottodominio unico.",
        decisionSupport: profile.decisionSupport,
        evidence: [
          `Stato leak: ${resolvedEnvironment.leakState || "not_determinable"}`,
          `Resolver distinti osservati: ${distinctResolverCount}`,
          `Campioni riusciti: ${samplesSucceeded}/${samplesRequested}`
        ],
        sourceFields: ["leakState", "distinctResolverCount", "samplesSucceeded", "confidence"],
        rawValue: resolvedEnvironment.leakState,
        normalizedValue: profile.normalizedValue,
        remediation: profile.remediation,
        benefitEstimate: profile.benefitEstimate,
        scoreImpactEstimate: profile.scoreImpactEstimate,
        tags: ["dns", "leak"]
      })
    ];
  }

  function getDnsSecurityProfile(dnsSecurityEnvironment) {
    const state = dnsSecurityEnvironment && dnsSecurityEnvironment.dnssecState
      ? dnsSecurityEnvironment.dnssecState
      : "not_determinable";

    if (state === "validating") {
      return createSignalProfile({
        normalizedValue: "validating",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: { reasonCodes: ["dnssec_validating"] }
      });
    }

    if (state === "not_validating") {
      return createSignalProfile({
        normalizedValue: "not_validating",
        polarity: "negative",
        intrinsicSeverity: "medium",
        suggestedPriority: "Media",
        remediation: { status: "external_tool", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: 4 },
        decisionSupport: { reasonCodes: ["dnssec_not_validating"] }
      });
    }

    return createSignalProfile({
      normalizedValue: "not_determinable",
      polarity: "neutral",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "not_applicable", userControl: "none" },
      benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
      scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
      decisionSupport: { reasonCodes: ["dnssec_not_determinable"] }
    });
  }

  function adaptDnsSecuritySignals(dnsSecurityEnvironment) {
    const resolvedEnvironment = dnsSecurityEnvironment || {};
    const profile = getDnsSecurityProfile(resolvedEnvironment);
    const state = profile.normalizedValue;
    const isIssue = state === "not_validating";
    const isStrength = state === "validating";

    return [
      createSignal({
        id: "dnssec_validation",
        source: "dns",
        category: "dns_security",
        polarity: profile.polarity,
        intrinsicSeverity: profile.intrinsicSeverity,
        suggestedPriority: profile.suggestedPriority,
        status: (isIssue || isStrength) ? "active" : "informative",
        confidence: {
          sourceConfidence: normalizeConfidenceValue(resolvedEnvironment.confidence, 0.2),
          interpretationConfidence: 0.7
        },
        title: "Validazione DNSSEC",
        detail: resolvedEnvironment.description || "Stato della validazione DNSSEC non determinabile in questa sessione.",
        suggestedAction: isIssue
          ? "Valuta un resolver che validi DNSSEC (molti DNS orientati alla privacy lo fanno) per proteggere le risposte DNS dalla manomissione."
          : isStrength
            ? "Nessuna azione necessaria: il resolver valida DNSSEC, configurazione da mantenere."
            : "Usa questo segnale come parte del contesto di sicurezza DNS.",
        rationale: "Il segnale deriva dal comportamento del resolver verso domini con firma DNSSEC valida e volutamente rotta.",
        decisionSupport: profile.decisionSupport,
        evidence: [
          `Stato DNSSEC: ${resolvedEnvironment.dnssecState || "not_determinable"}`,
          `Controlli conclusivi: ${Number.isFinite(resolvedEnvironment.pairsConclusive) ? resolvedEnvironment.pairsConclusive : 0}/${Number.isFinite(resolvedEnvironment.pairsTested) ? resolvedEnvironment.pairsTested : 0}`
        ],
        sourceFields: ["dnssecState", "pairsConclusive", "confidence"],
        rawValue: resolvedEnvironment.dnssecState,
        normalizedValue: profile.normalizedValue,
        remediation: profile.remediation,
        benefitEstimate: profile.benefitEstimate,
        scoreImpactEstimate: profile.scoreImpactEstimate,
        tags: ["dns", "dnssec", "security"]
      })
    ];
  }

  function adaptVpnSignals(vpnEnvironment) {
    const resolvedEnvironment = vpnEnvironment || {};
    const state = resolvedEnvironment.vpnState === "signals_present"
      ? "signals_present"
      : resolvedEnvironment.vpnState === "no_signals"
        ? "no_signals"
        : "not_determinable";

    const evidence = Array.isArray(resolvedEnvironment.indicators) && resolvedEnvironment.indicators.length > 0
      ? resolvedEnvironment.indicators.map((indicator) => `${indicator.id}: ${indicator.basis}`)
      : [`Organizzazione IP osservata: ${resolvedEnvironment.observedOrg || "Non disponibile"}`];

    return [
      createSignal({
        id: "vpn_presence_observation",
        source: "network",
        category: "network_context",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        status: "informative",
        confidence: {
          sourceConfidence: normalizeConfidenceValue(resolvedEnvironment.confidence, 0.2),
          interpretationConfidence: 0.6
        },
        title: "Osservazione uso VPN o proxy",
        detail: resolvedEnvironment.description || "Uso di VPN o proxy non determinabile in questa sessione.",
        suggestedAction: "Segnale puramente osservativo: indica se risulta l'uso di una VPN o proxy, senza esprimere alcun giudizio.",
        rationale: "Il segnale osserva indizi di rete (organizzazione dell'IP pubblico, discrepanza di timezone) compatibili con l'uso di una VPN o proxy. Non valuta la VPN.",
        decisionSupport: { reasonCodes: [`vpn_${state}`], decisionHints: ["context_signal_only"] },
        evidence,
        sourceFields: ["vpnState", "observedOrg", "confidence"],
        rawValue: resolvedEnvironment.vpnState,
        normalizedValue: state,
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        tags: ["network", "vpn", "context"]
      })
    ];
  }

  function getWebRtcStateProfile(stateKey) {
    if (stateKey === "public_ip_exposed") {
      return createSignalProfile({
        normalizedValue: "public_ip_exposed",
        polarity: "negative",
        intrinsicSeverity: "high",
        suggestedPriority: "Alta",
        remediation: { status: "direct", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "high", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: 10 },
        decisionSupport: {
          reasonCodes: ["webrtc_public_ip_exposed"]
        }
      });
    }

    if (stateKey === "local_ip_visible") {
      return createSignalProfile({
        normalizedValue: "local_ip_visible",
        polarity: "negative",
        intrinsicSeverity: "medium",
        suggestedPriority: "Media",
        remediation: { status: "direct", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: 6 },
        decisionSupport: {
          reasonCodes: ["webrtc_local_ip_visible"]
        }
      });
    }

    if (stateKey === "mdns_active") {
      return createSignalProfile({
        normalizedValue: "mdns_active",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["webrtc_mdns_active"]
        }
      });
    }

    if (stateKey === "relay_detected") {
      return createSignalProfile({
        normalizedValue: "relay_detected",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["webrtc_relay_detected"]
        }
      });
    }

    if (stateKey === "protected") {
      return createSignalProfile({
        normalizedValue: "protected",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["webrtc_protected"]
        }
      });
    }

    return createSignalProfile({
      normalizedValue: "verify_configuration",
      polarity: "neutral",
      intrinsicSeverity: "medium",
      suggestedPriority: "Media",
      remediation: { status: "indirect", userControl: "low" },
      benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
      scoreImpactEstimate: { status: "estimated", likelyGain: 4 },
      decisionSupport: {
        reasonCodes: ["webrtc_verify_configuration"],
        decisionHints: ["requires_prudence"]
      }
    });
  }

  function adaptWebRtcSignals(webrtcEnvironment) {
    const resolvedEnvironment = webrtcEnvironment || {};
    const technicalFindings = resolvedEnvironment.technicalFindings || {};
    const stateProfile = getWebRtcStateProfile(resolvedEnvironment.stateKey || resolvedEnvironment.functionalStateKey);
    const publicAddresses = uniqueStrings(technicalFindings.publicAddresses || []);
    const mdnsHostnames = uniqueStrings(technicalFindings.mdnsHostnames || []);

    return [
      createSignal({
        id: "webrtc_functional_state",
        source: "webrtc",
        category: "webrtc_exposure",
        polarity: stateProfile.polarity,
        intrinsicSeverity: stateProfile.intrinsicSeverity,
        suggestedPriority: stateProfile.suggestedPriority,
        status: "active",
        confidence: {
          sourceConfidence: normalizeConfidenceValue(resolvedEnvironment.confidence, 0.78),
          interpretationConfidence: 0.86
        },
        title: "Stato funzionale WebRTC",
        detail: `${resolvedEnvironment.state || "Protetto"}. ${resolvedEnvironment.simpleExplanation || ""}`.trim(),
        suggestedAction: resolvedEnvironment.suggestedAction || "Mantieni monitorata questa area e rivaluta il risultato con le future integrazioni del progetto.",
        rationale: "Il segnale deriva dallo stato funzionale WebRTC gia interpretato dal modulo dedicato, senza introdurre ulteriori decisioni trasversali.",
        decisionSupport: stateProfile.decisionSupport,
        evidence: [
          `Stato: ${resolvedEnvironment.state || "Protetto"}`,
          `Rischio: ${resolvedEnvironment.riskLevel || "Basso"}`,
          `Priorita: ${resolvedEnvironment.priority || "Bassa"}`,
          `Riepilogo candidati: ${resolvedEnvironment.candidateSummary || "Non disponibile"}`
        ],
        sourceFields: ["state", "stateKey", "riskLevel", "priority", "candidateSummary"],
        rawValue: resolvedEnvironment.stateKey || resolvedEnvironment.functionalStateKey,
        normalizedValue: stateProfile.normalizedValue,
        remediation: stateProfile.remediation,
        benefitEstimate: stateProfile.benefitEstimate,
        scoreImpactEstimate: stateProfile.scoreImpactEstimate,
        tags: ["webrtc", "state"]
      }),
      createSignal({
        id: "webrtc_public_address_observation",
        source: "webrtc",
        category: "webrtc_exposure",
        polarity: publicAddresses.length > 0 ? "negative" : "neutral",
        intrinsicSeverity: publicAddresses.length > 0 ? "high" : "low",
        suggestedPriority: publicAddresses.length > 0 ? "Alta" : "Bassa",
        status: publicAddresses.length > 0 ? "active" : "informative",
        confidence: {
          sourceConfidence: normalizeConfidenceValue(resolvedEnvironment.confidence, 0.78),
          interpretationConfidence: 0.88
        },
        title: "Osservazione di indirizzi pubblici WebRTC",
        detail: publicAddresses.length > 0
          ? `Durante la raccolta WebRTC sono stati osservati questi indirizzi pubblici: ${publicAddresses.join(", ")}.`
          : "Durante la raccolta WebRTC non sono emersi indirizzi pubblici espliciti.",
        suggestedAction: publicAddresses.length > 0
          ? "Se vuoi ridurre il rischio, controlla le impostazioni WebRTC del browser o della configurazione privacy che stai usando."
          : "Non serve un intervento specifico su questo segnale nella sessione corrente.",
        rationale: "Il segnale descrive l'evidenza tecnica piu forte raccolta dai candidati WebRTC: la presenza o meno di indirizzi pubblici.",
        decisionSupport: {
          reasonCodes: [publicAddresses.length > 0 ? "webrtc_public_addresses_observed" : "webrtc_no_public_addresses_observed"],
          decisionHints: publicAddresses.length > 0 ? ["direct_network_exposure"] : ["context_signal_only"]
        },
        evidence: publicAddresses.length > 0
          ? publicAddresses.map((address) => `Indirizzo pubblico osservato: ${address}`)
          : ["Nessun indirizzo pubblico osservato"],
        sourceFields: ["technicalFindings"],
        rawValue: publicAddresses,
        normalizedValue: publicAddresses.length > 0 ? "public_addresses_observed" : "no_public_addresses_observed",
        remediation: publicAddresses.length > 0
          ? { status: "direct", userControl: "medium" }
          : { status: "not_applicable", userControl: "none" },
        benefitEstimate: publicAddresses.length > 0
          ? { status: "estimated", level: "high", basis: "plausible" }
          : { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: publicAddresses.length > 0
          ? { status: "estimated", likelyGain: 10 }
          : { status: "not_applicable", likelyGain: 0 },
        tags: ["webrtc", "public-ip"]
      }),
      createSignal({
        id: "webrtc_mdns_masking",
        source: "webrtc",
        category: "webrtc_exposure",
        polarity: mdnsHostnames.length > 0 ? "positive" : "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        status: mdnsHostnames.length > 0 ? "active" : "informative",
        confidence: {
          sourceConfidence: normalizeConfidenceValue(resolvedEnvironment.confidence, 0.78),
          interpretationConfidence: 0.8
        },
        title: "Mascheramento mDNS WebRTC",
        detail: mdnsHostnames.length > 0
          ? `Sono stati osservati hostname mDNS come ${mdnsHostnames.slice(0, 2).join(", ")}.`
          : "Nella sessione corrente non sono emersi hostname mDNS espliciti.",
        suggestedAction: "Usa questo segnale per capire se il browser sta mascherando parte delle informazioni locali WebRTC.",
        rationale: "Il segnale descrive una evidenza tecnica utile per distinguere esposizione reale da mascheramento locale tramite mDNS.",
        decisionSupport: {
          reasonCodes: [mdnsHostnames.length > 0 ? "webrtc_mdns_observed" : "webrtc_mdns_not_observed"],
          decisionHints: ["context_signal_only"]
        },
        evidence: mdnsHostnames.length > 0
          ? mdnsHostnames.map((hostname) => `Hostname mDNS: ${hostname}`)
          : ["Nessun hostname mDNS osservato"],
        sourceFields: ["technicalFindings"],
        rawValue: mdnsHostnames,
        normalizedValue: mdnsHostnames.length > 0 ? "mdns_present" : "mdns_not_observed",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        tags: ["webrtc", "mdns"]
      })
    ];
  }

  function getScoreBandProfile(score) {
    const numericScore = Number(score);

    if (!Number.isFinite(numericScore)) {
      return createSignalProfile({
        normalizedValue: "unknown",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_estimated", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["score_unknown"],
          decisionHints: ["requires_prudence"]
        }
      });
    }

    if (numericScore <= 30) {
      return createSignalProfile({
        normalizedValue: "needs_improvement",
        polarity: "negative",
        intrinsicSeverity: "high",
        suggestedPriority: "Alta",
        remediation: { status: "indirect", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "high", basis: "plausible" },
        scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["score_needs_improvement"]
        }
      });
    }

    if (numericScore <= 60) {
      return createSignalProfile({
        normalizedValue: "fair",
        polarity: "neutral",
        intrinsicSeverity: "medium",
        suggestedPriority: "Media",
        remediation: { status: "indirect", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
        scoreImpactEstimate: { status: "not_estimated", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["score_fair"]
        }
      });
    }

    if (numericScore <= 80) {
      return createSignalProfile({
        normalizedValue: "good",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["score_good"]
        }
      });
    }

    return createSignalProfile({
      normalizedValue: "excellent",
      polarity: "positive",
      intrinsicSeverity: "low",
      suggestedPriority: "Bassa",
      remediation: { status: "not_applicable", userControl: "none" },
      benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
      scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
      decisionSupport: {
        reasonCodes: ["score_excellent"]
      }
    });
  }

  function getFactorSignalProfile(factor) {
    const awardedPoints = Number(factor && factor.awardedPoints);
    const maxPoints = Number(factor && factor.maxPoints);
    const ratio = maxPoints > 0 ? awardedPoints / maxPoints : 0;

    if (ratio >= 0.75) {
      return createSignalProfile({
        normalizedValue: "strong",
        polarity: "positive",
        intrinsicSeverity: "low",
        suggestedPriority: "Bassa",
        remediation: { status: "not_applicable", userControl: "none" },
        benefitEstimate: { status: "not_applicable", level: null, basis: "plausible" },
        scoreImpactEstimate: { status: "not_applicable", likelyGain: 0 },
        decisionSupport: {
          reasonCodes: ["score_factor_strong"]
        }
      });
    }

    if (ratio >= 0.45) {
      return createSignalProfile({
        normalizedValue: "mixed",
        polarity: "neutral",
        intrinsicSeverity: "low",
        suggestedPriority: "Media",
        remediation: { status: "indirect", userControl: "medium" },
        benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
        scoreImpactEstimate: { status: "estimated", likelyGain: Math.max(1, Math.round((maxPoints - awardedPoints) / 2)) },
        decisionSupport: {
          reasonCodes: ["score_factor_mixed"]
        }
      });
    }

    return createSignalProfile({
      normalizedValue: "weak",
      polarity: "negative",
      intrinsicSeverity: "medium",
      suggestedPriority: "Media",
      remediation: { status: "indirect", userControl: "medium" },
      benefitEstimate: { status: "estimated", level: "medium", basis: "plausible" },
      scoreImpactEstimate: { status: "estimated", likelyGain: Math.max(1, Math.round(maxPoints - awardedPoints)) },
      decisionSupport: {
        reasonCodes: ["score_factor_weak"]
      }
    });
  }

  function adaptPrivacyScoreSignals(privacyScore) {
    const resolvedScore = privacyScore || {};
    const factors = Array.isArray(resolvedScore.factors) ? resolvedScore.factors : [];
    const overallBand = getScoreBandProfile(resolvedScore.score);
    const signals = [
      createSignal({
        id: "privacy_score_band",
        source: "score",
        category: "score_context",
        polarity: overallBand.polarity,
        intrinsicSeverity: overallBand.intrinsicSeverity,
        suggestedPriority: overallBand.suggestedPriority,
        status: "active",
        confidence: {
          sourceConfidence: 0.9,
          interpretationConfidence: 0.86
        },
        title: "Fascia del Privacy Score",
        detail: `Il punteggio attuale e ${resolvedScore.score || 0}/${resolvedScore.maxScore || 100} con livello ${resolvedScore.level || "Non disponibile"}.`,
        suggestedAction: "Usa il punteggio come sintesi del contesto, non come unico criterio di giudizio.",
        rationale: "Il segnale normalizza il punteggio complessivo generato dal Privacy Score Engine.",
        decisionSupport: overallBand.decisionSupport,
        evidence: [
          `Score: ${resolvedScore.score || 0}/${resolvedScore.maxScore || 100}`,
          `Livello: ${resolvedScore.level || "Non disponibile"}`
        ],
        sourceFields: ["score", "level"],
        rawValue: resolvedScore.score,
        normalizedValue: overallBand.normalizedValue,
        remediation: overallBand.remediation,
        benefitEstimate: overallBand.benefitEstimate,
        scoreImpactEstimate: overallBand.scoreImpactEstimate,
        tags: ["score", "overall"]
      })
    ];

    factors.forEach((factor) => {
      const profile = getFactorSignalProfile(factor);

      signals.push(
        createSignal({
          id: `privacy_score_factor_${slugify(factor.key || factor.label)}`,
          source: "score",
          category: "score_factor",
          polarity: profile.polarity,
          intrinsicSeverity: profile.intrinsicSeverity,
          suggestedPriority: profile.suggestedPriority,
          status: "active",
          confidence: {
            sourceConfidence: 0.82,
            interpretationConfidence: 0.78
          },
          title: `Fattore score: ${factor.label || factor.key || "Non disponibile"}`,
          detail: factor.detail || "",
          suggestedAction: profile.polarity === "negative" || profile.polarity === "neutral"
            ? "Questo fattore puo contribuire a un futuro percorso di miglioramento se confermato da altri segnali."
            : "Questo fattore rappresenta un elemento gia favorevole del profilo attuale.",
          rationale: "Il segnale deriva da un fattore gia calcolato dal Privacy Score Engine e lo rende confrontabile con gli altri moduli del progetto.",
          decisionSupport: {
            reasonCodes: (profile.decisionSupport.reasonCodes || []).concat(`score_factor_${slugify(profile.normalizedValue)}`)
          },
          evidence: [
            `Punti assegnati: ${factor.awardedPoints}/${factor.maxPoints}`,
            `Tono: ${factor.tone || "info"}`
          ],
          sourceFields: ["factors"],
          rawValue: {
            awardedPoints: factor.awardedPoints,
            maxPoints: factor.maxPoints,
            label: factor.label
          },
          normalizedValue: profile.normalizedValue,
          remediation: profile.remediation,
          benefitEstimate: profile.benefitEstimate,
          scoreImpactEstimate: profile.scoreImpactEstimate,
          tags: ["score", "factor", slugify(factor.key || factor.label)]
        })
      );
    });

    return signals;
  }

  function buildContext(inputContext) {
    const resolvedInput = inputContext || {};

    return {
      browserEnvironment: resolvedInput.browserEnvironment || {},
      networkEnvironment: resolvedInput.networkEnvironment || {},
      dnsEnvironment: resolvedInput.dnsEnvironment || {},
      dnsLeakEnvironment: resolvedInput.dnsLeakEnvironment || {},
      dnsSecurityEnvironment: resolvedInput.dnsSecurityEnvironment || {},
      vpnEnvironment: resolvedInput.vpnEnvironment || {},
      webrtcEnvironment: resolvedInput.webrtcEnvironment || {},
      privacyScore: resolvedInput.privacyScore || {}
    };
  }

  function buildAdapterMetadata(signals) {
    const groupedCounts = signals.reduce((accumulator, signal) => {
      accumulator[signal.source] = (accumulator[signal.source] || 0) + 1;
      return accumulator;
    }, {});

    return {
      contractName: CONTRACT_NAME,
      contractVersion: CONTRACT_VERSION,
      signalCount: signals.length,
      groupedCounts,
      futureSignalAdapters: FUTURE_SIGNAL_ADAPTERS
    };
  }

  function cloneRootCauseCatalogEntries() {
    return Object.keys(ROOT_CAUSE_CATALOG).map((rootCauseId) => {
      return { ...ROOT_CAUSE_CATALOG[rootCauseId] };
    });
  }

  function getSeverityWeight(value) {
    return SEVERITY_WEIGHTS[value] || 0;
  }

  function getPriorityWeight(value) {
    return PRIORITY_WEIGHTS[value] || 0;
  }

  function getRemediationWeight(remediation) {
    return remediation && remediation.status ? (REMEDIATION_WEIGHTS[remediation.status] || 0) : 0;
  }

  function getUserControlWeight(remediation) {
    return remediation && remediation.userControl ? (USER_CONTROL_WEIGHTS[remediation.userControl] || 0) : 0;
  }

  function getBenefitWeight(benefitEstimate) {
    if (!benefitEstimate || benefitEstimate.status !== "estimated") {
      return 0;
    }

    return BENEFIT_WEIGHTS[benefitEstimate.level] || 0;
  }

  function hasDecisionHint(signal, hint) {
    return Boolean(
      signal
      && signal.decisionSupport
      && Array.isArray(signal.decisionSupport.decisionHints)
      && signal.decisionSupport.decisionHints.includes(hint)
    );
  }

  function hasReasonCode(signal, code) {
    return Boolean(
      signal
      && signal.decisionSupport
      && Array.isArray(signal.decisionSupport.reasonCodes)
      && signal.decisionSupport.reasonCodes.includes(code)
    );
  }

  function isActionableRemediation(remediation) {
    return Boolean(remediation && (remediation.status === "direct" || remediation.status === "indirect" || remediation.status === "external_tool"));
  }

  function getSignalOverallConfidence(signal) {
    return signal && signal.confidence ? signal.confidence.overallConfidence : 0.5;
  }

  function isRelevantIssueCandidate(signal) {
    if (!signal || signal.status !== "active" || signal.polarity === "positive") {
      return false;
    }

    if (getSignalOverallConfidence(signal) < 0.55) {
      return false;
    }

    return signal.polarity === "negative"
      || getSeverityWeight(signal.intrinsicSeverity) >= 2
      || isActionableRemediation(signal.remediation)
      || hasDecisionHint(signal, "candidate_for_main_issue");
  }

  function buildAnalysisSignalReference(signal, score) {
    if (!signal) {
      return null;
    }

    return {
      signalId: signal.id,
      title: signal.title,
      source: signal.source,
      category: signal.category,
      normalizedValue: signal.normalizedValue,
      polarity: signal.polarity,
      intrinsicSeverity: signal.intrinsicSeverity,
      suggestedPriority: signal.suggestedPriority,
      status: signal.status,
      confidence: signal.confidence,
      remediation: signal.remediation,
      benefitEstimate: signal.benefitEstimate,
      scoreImpactEstimate: signal.scoreImpactEstimate,
      rationale: signal.rationale,
      reasonCodes: signal.decisionSupport ? signal.decisionSupport.reasonCodes : [],
      decisionHints: signal.decisionSupport ? signal.decisionSupport.decisionHints : [],
      evidence: signal.evidence,
      suggestedAction: signal.suggestedAction,
      analysisScore: typeof score === "number" ? Math.round(score * 100) / 100 : null
    };
  }

  function scoreIssueCandidate(signal) {
    if (!isRelevantIssueCandidate(signal)) {
      return -Infinity;
    }

    const confidence = getSignalOverallConfidence(signal);
    const remediationWeight = getRemediationWeight(signal.remediation);
    const benefitWeight = getBenefitWeight(signal.benefitEstimate);
    let score = getSeverityWeight(signal.intrinsicSeverity) * 3
      + getPriorityWeight(signal.suggestedPriority) * 2
      + confidence * 4
      + remediationWeight * 1.5
      + getUserControlWeight(signal.remediation) * 0.5
      + benefitWeight * 1.5;

    if (signal.polarity === "negative") {
      score += 3;
    } else if (signal.polarity === "neutral") {
      score += 1;
    } else {
      score -= 4;
    }

    if (hasDecisionHint(signal, "candidate_for_main_issue")) {
      score += 1.5;
    }

    if (hasDecisionHint(signal, "requires_prudence")) {
      score -= 1;
    }

    if (!isActionableRemediation(signal.remediation)) {
      score -= 1.5;
    }

    if (confidence < 0.55) {
      score -= 2;
    }

    return score;
  }

  function scoreStrengthCandidate(signal) {
    if (!signal || signal.status !== "active" || signal.polarity !== "positive") {
      return -Infinity;
    }

    const confidence = getSignalOverallConfidence(signal);
    let score = confidence * 4 + getPriorityWeight(signal.suggestedPriority);

    if (hasDecisionHint(signal, "candidate_for_strength")) {
      score += 1.5;
    }

    if (hasDecisionHint(signal, "requires_prudence")) {
      score -= 1;
    }

    if (hasReasonCode(signal, "score_excellent") || hasReasonCode(signal, "score_good")) {
      score += 0.5;
    }

    return score;
  }

  function scorePriorityActionCandidate(signal) {
    if (!signal || signal.status !== "active" || !isActionableRemediation(signal.remediation)) {
      return -Infinity;
    }

    const confidence = getSignalOverallConfidence(signal);
    const likelyGain = signal.scoreImpactEstimate && signal.scoreImpactEstimate.status === "estimated"
      ? signal.scoreImpactEstimate.likelyGain
      : 0;
    let score = getSeverityWeight(signal.intrinsicSeverity) * 2
      + getPriorityWeight(signal.suggestedPriority) * 1.5
      + getRemediationWeight(signal.remediation) * 2
      + getUserControlWeight(signal.remediation)
      + getBenefitWeight(signal.benefitEstimate) * 2
      + confidence * 3
      + (likelyGain * 0.2);

    if (signal.polarity === "negative") {
      score += 2;
    } else if (signal.polarity === "neutral") {
      score += 1;
    }

    if (hasDecisionHint(signal, "candidate_for_priority_action")) {
      score += 1.5;
    }

    if (hasDecisionHint(signal, "requires_external_tool")) {
      score -= 0.5;
    }

    if (hasDecisionHint(signal, "requires_prudence")) {
      score -= 1;
    }

    return score;
  }

  function selectMainIssue(signals) {
    const candidates = (signals || [])
      .map((signal) => ({ signal, score: scoreIssueCandidate(signal) }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => right.score - left.score);

    if (candidates.length === 0 || candidates[0].score < 10) {
      return null;
    }

    return candidates[0];
  }

  function selectStrengths(signals) {
    return (signals || [])
      .map((signal) => ({ signal, score: scoreStrengthCandidate(signal) }))
      .filter((entry) => Number.isFinite(entry.score))
      .filter((entry) => getSignalOverallConfidence(entry.signal) >= 0.6)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }

  function selectPriorityAction(signals, mainIssueEntry) {
    const candidates = (signals || [])
      .map((signal) => ({ signal, score: scorePriorityActionCandidate(signal) }))
      .filter((entry) => Number.isFinite(entry.score))
      .filter((entry) => getSignalOverallConfidence(entry.signal) >= 0.55)
      .sort((left, right) => right.score - left.score);

    if (candidates.length > 0 && candidates[0].score >= 8) {
      return candidates[0];
    }

    if (
      mainIssueEntry
      && isActionableRemediation(mainIssueEntry.signal.remediation)
      && Number.isFinite(scorePriorityActionCandidate(mainIssueEntry.signal))
    ) {
      return {
        signal: mainIssueEntry.signal,
        score: scorePriorityActionCandidate(mainIssueEntry.signal)
      };
    }

    return null;
  }

  function computeSignalContribution(signal) {
    if (!signal || signal.status !== "active") {
      return 0;
    }

    const confidence = signal.confidence ? signal.confidence.overallConfidence : 0.5;
    const baseWeight = (getSeverityWeight(signal.intrinsicSeverity) * 1.6) + (getPriorityWeight(signal.suggestedPriority) * 1.1);
    const contribution = baseWeight * (0.5 + (confidence / 2));

    if (signal.polarity === "negative") {
      return contribution * -1;
    }

    if (signal.polarity === "positive") {
      return contribution * 0.9;
    }

    return 0;
  }

  function resolveOverallState(signals, mainIssueEntry, strengthsEntries) {
    const activeSignals = (signals || []).filter((signal) => signal.status === "active");
    const contributions = activeSignals
      .map((signal) => ({ signal, value: computeSignalContribution(signal) }))
      .sort((left, right) => Math.abs(right.value) - Math.abs(left.value));
    const totalContribution = contributions.reduce((sum, entry) => sum + entry.value, 0);
    const averageContribution = contributions.length > 0 ? totalContribution / contributions.length : 0;
    const strongNegativeCount = activeSignals.filter((signal) => signal.polarity === "negative" && getSeverityWeight(signal.intrinsicSeverity) >= 2 && getSignalOverallConfidence(signal) >= 0.65).length;
    const strongPositiveCount = activeSignals.filter((signal) => signal.polarity === "positive" && getSignalOverallConfidence(signal) >= 0.65).length;
    const mainIssueSignal = mainIssueEntry ? mainIssueEntry.signal : null;
    let key = "discreta";
    let label = "Discreta";

    if (
      mainIssueSignal
      && mainIssueSignal.intrinsicSeverity === "high"
      && getSignalOverallConfidence(mainIssueSignal) >= 0.75
      && strongNegativeCount >= 2
    ) {
      key = "critica";
      label = "Critica";
    } else if (
      averageContribution <= -1
      || (mainIssueSignal && mainIssueSignal.intrinsicSeverity === "high")
      || strongNegativeCount >= 2
    ) {
      key = "da_migliorare";
      label = "Da Migliorare";
    } else if (averageContribution < 0.15) {
      key = "discreta";
      label = "Discreta";
    } else if (averageContribution < 0.8 || strongPositiveCount <= 2) {
      key = "buona";
      label = "Buona";
    } else {
      key = "molto_buona";
      label = "Molto Buona";
    }

    if (key === "molto_buona" && strongNegativeCount > 0) {
      key = "buona";
      label = "Buona";
    }

    return {
      key,
      label,
      contributionScore: Math.round(averageContribution * 100) / 100,
      contributingSignalIds: contributions.slice(0, 5).map((entry) => entry.signal.id),
      dominantNegativeSignalIds: contributions.filter((entry) => entry.value < 0).slice(0, 3).map((entry) => entry.signal.id),
      dominantPositiveSignalIds: contributions.filter((entry) => entry.value > 0).slice(0, 3).map((entry) => entry.signal.id),
      strengthSignalIds: (strengthsEntries || []).map((entry) => entry.signal.id)
    };
  }

  function aggregateConfidenceFromSignals(signals) {
    const validSignals = (signals || []).filter(Boolean);
    if (validSignals.length === 0) {
      return {
        sourceConfidence: 0,
        interpretationConfidence: 0,
        overallConfidence: 0,
        level: "Bassa"
      };
    }

    const totals = validSignals.reduce((accumulator, signal) => {
      accumulator.sourceConfidence += signal.confidence ? signal.confidence.sourceConfidence : 0;
      accumulator.interpretationConfidence += signal.confidence ? signal.confidence.interpretationConfidence : 0;
      accumulator.overallConfidence += signal.confidence ? signal.confidence.overallConfidence : 0;
      return accumulator;
    }, {
      sourceConfidence: 0,
      interpretationConfidence: 0,
      overallConfidence: 0
    });
    const sourceConfidence = totals.sourceConfidence / validSignals.length;
    const interpretationConfidence = totals.interpretationConfidence / validSignals.length;
    const overallConfidence = totals.overallConfidence / validSignals.length;
    const level = overallConfidence >= 0.85
      ? "Alta"
      : overallConfidence >= 0.65
        ? "Media"
        : "Bassa";

    return {
      sourceConfidence: Math.round(sourceConfidence * 100) / 100,
      interpretationConfidence: Math.round(interpretationConfidence * 100) / 100,
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      level
    };
  }

  function uniqueSignalList(signals) {
    const seen = new Set();
    return (signals || []).filter((signal) => {
      if (!signal || seen.has(signal.id)) {
        return false;
      }

      seen.add(signal.id);
      return true;
    });
  }

  function getAnalysisConfidenceLevel(overallConfidence) {
    return overallConfidence >= 0.85
      ? "Alta"
      : overallConfidence >= 0.65
        ? "Media"
        : "Bassa";
  }

  function clampConfidenceObject(confidence) {
    const sourceConfidence = Math.max(0, Math.min(1, confidence.sourceConfidence || 0));
    const interpretationConfidence = Math.max(0, Math.min(1, confidence.interpretationConfidence || 0));
    const overallConfidence = Math.max(0, Math.min(1, confidence.overallConfidence || 0));

    return {
      sourceConfidence: Math.round(sourceConfidence * 100) / 100,
      interpretationConfidence: Math.round(interpretationConfidence * 100) / 100,
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      level: getAnalysisConfidenceLevel(overallConfidence)
    };
  }

  function lowerPriority(value) {
    if (value === "Alta") {
      return "Media";
    }

    if (value === "Media") {
      return "Bassa";
    }

    return "Bassa";
  }

  function getSignalEvidenceWeight(signal) {
    if (!signal) {
      return 0;
    }

    const confidence = getSignalOverallConfidence(signal);
    const severityWeight = Math.max(1, getSeverityWeight(signal.intrinsicSeverity));
    const priorityWeight = Math.max(1, getPriorityWeight(signal.suggestedPriority));
    const statusWeight = signal.status === "active" ? 1 : 0.45;
    let weight = ((severityWeight * 2) + priorityWeight + (confidence * 3)) * statusWeight;

    if (hasDecisionHint(signal, "context_signal_only")) {
      weight *= 0.8;
    }

    if (hasDecisionHint(signal, "requires_prudence")) {
      weight *= 0.9;
    }

    return weight;
  }

  function getHighestSeverity(signals) {
    return (signals || []).reduce((currentValue, signal) => {
      return getSeverityWeight(signal.intrinsicSeverity) > getSeverityWeight(currentValue)
        ? signal.intrinsicSeverity
        : currentValue;
    }, "low");
  }

  function getHighestPriority(signals) {
    return (signals || []).reduce((currentValue, signal) => {
      return getPriorityWeight(signal.suggestedPriority) > getPriorityWeight(currentValue)
        ? signal.suggestedPriority
        : currentValue;
    }, "Bassa");
  }

  function getDominantPolarity(signals) {
    const uniqueSignals = uniqueSignalList(signals);
    const activeSignals = uniqueSignals.filter((signal) => signal.status === "active");
    const referenceSignals = activeSignals.length > 0 ? activeSignals : uniqueSignals;
    const scores = referenceSignals.reduce((accumulator, signal) => {
      const polarity = signal && signal.polarity ? signal.polarity : "neutral";
      accumulator[polarity] = (accumulator[polarity] || 0) + getSignalEvidenceWeight(signal);
      return accumulator;
    }, {
      positive: 0,
      negative: 0,
      neutral: 0
    });
    const hasStrongNegativeSignal = referenceSignals.some((signal) => {
      return signal.polarity === "negative"
        && signal.status === "active"
        && getSeverityWeight(signal.intrinsicSeverity) >= 2
        && getSignalOverallConfidence(signal) >= 0.65;
    });

    if (
      hasStrongNegativeSignal
      && scores.negative >= (scores.positive * 0.9)
      && scores.negative >= 4
    ) {
      return "negative";
    }

    if (
      scores.negative >= (Math.max(scores.positive, scores.neutral) * 1.1)
      && scores.negative >= 4
    ) {
      return "negative";
    }

    if (
      !hasStrongNegativeSignal
      && scores.positive >= (Math.max(scores.negative, scores.neutral) * 1.15)
      && scores.positive >= 3
    ) {
      return "positive";
    }

    return "neutral";
  }

  function getContributingRootCauseSignals(signals, dominantPolarity) {
    const uniqueSignals = uniqueSignalList(signals);
    const activeSignals = uniqueSignals.filter((signal) => signal.status === "active");
    const polaritySignals = activeSignals.filter((signal) => signal.polarity === dominantPolarity);

    if (dominantPolarity === "negative" || dominantPolarity === "positive") {
      return polaritySignals.length > 0 ? polaritySignals : activeSignals;
    }

    const neutralSignals = activeSignals.filter((signal) => signal.polarity === "neutral");
    if (neutralSignals.length > 0) {
      return neutralSignals;
    }

    return activeSignals;
  }

  function getConflictingRootCauseSignals(signals, dominantPolarity) {
    const uniqueSignals = uniqueSignalList(signals);
    const activeSignals = uniqueSignals.filter((signal) => signal.status === "active");

    if (dominantPolarity === "negative") {
      return activeSignals.filter((signal) => signal.polarity === "positive" && getSignalOverallConfidence(signal) >= 0.55);
    }

    if (dominantPolarity === "positive") {
      return activeSignals.filter((signal) => signal.polarity === "negative" && getSignalOverallConfidence(signal) >= 0.55);
    }

    const hasMixedPolarities = activeSignals.some((signal) => signal.polarity === "negative")
      && activeSignals.some((signal) => signal.polarity === "positive");

    return hasMixedPolarities
      ? activeSignals.filter((signal) => signal.polarity === "negative" || signal.polarity === "positive")
      : [];
  }

  function getSupportingRootCauseSignals(signals, contributingSignals, conflictingSignals) {
    const contributingIds = new Set((contributingSignals || []).map((signal) => signal.id));
    const conflictingIds = new Set((conflictingSignals || []).map((signal) => signal.id));

    return uniqueSignalList(signals).filter((signal) => {
      return !contributingIds.has(signal.id) && !conflictingIds.has(signal.id);
    });
  }

  function selectBestRemediation(signals) {
    const actionableSignals = (signals || []).filter((signal) => isActionableRemediation(signal.remediation));
    if (actionableSignals.length === 0) {
      return {
        status: "not_applicable",
        userControl: "none"
      };
    }

    return actionableSignals
      .slice()
      .sort((left, right) => {
        const rightScore = (getRemediationWeight(right.remediation) * 2) + getUserControlWeight(right.remediation);
        const leftScore = (getRemediationWeight(left.remediation) * 2) + getUserControlWeight(left.remediation);
        return rightScore - leftScore;
      })[0]
      .remediation;
  }

  function selectBestBenefitEstimate(signals) {
    const estimatedSignals = (signals || []).filter((signal) => {
      return signal.benefitEstimate
        && signal.benefitEstimate.status === "estimated"
        && signal.polarity === "negative";
    });
    if (estimatedSignals.length === 0) {
      return {
        status: "not_applicable",
        level: null,
        basis: "plausible"
      };
    }

    return estimatedSignals
      .slice()
      .sort((left, right) => getBenefitWeight(right.benefitEstimate) - getBenefitWeight(left.benefitEstimate))[0]
      .benefitEstimate;
  }

  function aggregateRootCauseConfidence(contributingSignals, supportingSignals, conflictingSignals) {
    const baseSignals = contributingSignals && contributingSignals.length > 0
      ? contributingSignals
      : supportingSignals && supportingSignals.length > 0
        ? supportingSignals
        : [];
    const baseConfidence = aggregateConfidenceFromSignals(baseSignals);
    const concordanceBonus = Math.min(0.05, Math.max(0, baseSignals.length - 1) * 0.02);
    const conflictPenalty = Math.min(0.2, (conflictingSignals || []).length * 0.07);

    return clampConfidenceObject({
      sourceConfidence: baseConfidence.sourceConfidence,
      interpretationConfidence: baseConfidence.interpretationConfidence + (concordanceBonus / 2) - (conflictPenalty / 2),
      overallConfidence: baseConfidence.overallConfidence + concordanceBonus - conflictPenalty
    });
  }

  function getRootCauseObservedSeverity(dominantPolarity, contributingSignals, conflictingSignals) {
    const signals = contributingSignals || [];

    if (dominantPolarity === "negative") {
      const hasHighNegative = signals.some((signal) => {
        return signal.polarity === "negative"
          && getSeverityWeight(signal.intrinsicSeverity) >= 3
          && getSignalOverallConfidence(signal) >= 0.65;
      });
      if (hasHighNegative) {
        return "high";
      }

      const hasMeaningfulNegative = signals.some((signal) => {
        return signal.polarity === "negative"
          && getSeverityWeight(signal.intrinsicSeverity) >= 2
          && getSignalOverallConfidence(signal) >= 0.6;
      });
      if (hasMeaningfulNegative || signals.length >= 2) {
        return "medium";
      }

      return "low";
    }

    if (dominantPolarity === "positive") {
      return "low";
    }

    const hasConflictingStrongNegative = (conflictingSignals || []).some((signal) => {
      return signal.polarity === "negative"
        && getSeverityWeight(signal.intrinsicSeverity) >= 2
        && getSignalOverallConfidence(signal) >= 0.65;
    });
    if (hasConflictingStrongNegative) {
      return "medium";
    }

    return getHighestSeverity(signals) === "high" ? "medium" : "low";
  }

  function getRootCauseObservedPriority(dominantPolarity, contributingSignals, rootCauseConfidence) {
    if (dominantPolarity !== "negative") {
      if (dominantPolarity === "neutral" && getHighestSeverity(contributingSignals) !== "low") {
        return "Media";
      }

      return "Bassa";
    }

    const negativeSignals = (contributingSignals || []).filter((signal) => signal.polarity === "negative");
    const actionableSignals = negativeSignals.filter((signal) => isActionableRemediation(signal.remediation));
    let priority = getHighestPriority(actionableSignals.length > 0 ? actionableSignals : negativeSignals);

    if (rootCauseConfidence.overallConfidence < 0.6) {
      priority = lowerPriority(priority);
    }

    return priority;
  }

  function scoreRootCauseRepresentativeSignal(signal, dominantPolarity) {
    if (!signal) {
      return -Infinity;
    }

    let score = getSeverityWeight(signal.intrinsicSeverity) * 3
      + getPriorityWeight(signal.suggestedPriority) * 2
      + getSignalOverallConfidence(signal) * 3;

    if (signal.polarity === dominantPolarity) {
      score += 2.5;
    } else if (signal.polarity === "negative") {
      score += 2;
    } else if (signal.polarity === "positive") {
      score += 1;
    }

    if (signal.status !== "active") {
      score -= 1.5;
    }

    if (hasDecisionHint(signal, "context_signal_only")) {
      score -= 1;
    }

    return score;
  }

  function selectRepresentativeSignal(signals, dominantPolarity) {
    const candidates = uniqueSignalList(signals)
      .map((signal) => ({ signal, score: scoreRootCauseRepresentativeSignal(signal, dominantPolarity) }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => right.score - left.score);

    return candidates.length > 0 ? candidates[0].signal : null;
  }

  function buildRootCauseSignalReference(signal) {
    if (!signal) {
      return null;
    }

    return {
      signalId: signal.id,
      title: signal.title,
      source: signal.source,
      category: signal.category,
      normalizedValue: signal.normalizedValue,
      polarity: signal.polarity,
      intrinsicSeverity: signal.intrinsicSeverity,
      suggestedPriority: signal.suggestedPriority,
      status: signal.status,
      confidence: signal.confidence,
      remediation: signal.remediation,
      benefitEstimate: signal.benefitEstimate,
      scoreImpactEstimate: signal.scoreImpactEstimate,
      reasonCodes: signal.decisionSupport ? signal.decisionSupport.reasonCodes : [],
      decisionHints: signal.decisionSupport ? signal.decisionSupport.decisionHints : [],
      suggestedAction: signal.suggestedAction
    };
  }

  function buildRootCauseObservedState(signals) {
    const uniqueSignals = uniqueSignalList(signals);
    const activeSignals = uniqueSignals.filter((signal) => signal.status === "active");
    const referenceSignals = activeSignals.length > 0 ? activeSignals : uniqueSignals;
    const dominantPolarity = getDominantPolarity(referenceSignals);
    const contributingSignals = getContributingRootCauseSignals(referenceSignals, dominantPolarity);
    const conflictingSignals = getConflictingRootCauseSignals(referenceSignals, dominantPolarity);
    const supportingSignals = getSupportingRootCauseSignals(referenceSignals, contributingSignals, conflictingSignals);
    const confidence = aggregateRootCauseConfidence(contributingSignals, supportingSignals, conflictingSignals);
    const strongestIntrinsicSeverity = getRootCauseObservedSeverity(
      dominantPolarity,
      contributingSignals,
      conflictingSignals
    );
    const highestSuggestedPriority = getRootCauseObservedPriority(
      dominantPolarity,
      contributingSignals,
      confidence
    );
    const negativeContributingSignals = contributingSignals.filter((signal) => signal.polarity === "negative");
    const representativeSignal = selectRepresentativeSignal(
      contributingSignals.length > 0 ? contributingSignals : referenceSignals,
      dominantPolarity
    );

    return {
      dominantPolarity,
      strongestIntrinsicSeverity,
      highestSuggestedPriority,
      confidence,
      remediation: dominantPolarity === "negative"
        ? selectBestRemediation(negativeContributingSignals)
        : { status: "not_applicable", userControl: "none" },
      benefitEstimate: dominantPolarity === "negative"
        ? selectBestBenefitEstimate(negativeContributingSignals)
        : { status: "not_applicable", level: null, basis: "plausible" },
      representativeSignalId: representativeSignal ? representativeSignal.id : null,
      contributingSignalIds: contributingSignals.map((signal) => signal.id),
      supportingSignalIds: supportingSignals.map((signal) => signal.id),
      conflictingSignalIds: conflictingSignals.map((signal) => signal.id),
      activeSignalCount: activeSignals.length,
      totalSignalCount: uniqueSignals.length
    };
  }

  function buildExcludedRootCauseSignal(signal, reason) {
    return {
      signalId: signal.id,
      source: signal.source,
      category: signal.category,
      title: signal.title,
      reason
    };
  }

  function resolveRootCauseMatch(signal) {
    if (!signal || !signal.id) {
      return {
        included: false,
        reason: "invalid_signal"
      };
    }

    if (Object.prototype.hasOwnProperty.call(ROOT_CAUSE_SIGNAL_MAPPING, signal.id)) {
      return {
        included: true,
        rootCauseId: ROOT_CAUSE_SIGNAL_MAPPING[signal.id]
      };
    }

    const exclusionRule = ROOT_CAUSE_EXCLUSION_RULES.find((rule) => {
      return rule.matchType === "exact"
        ? signal.id === rule.value
        : signal.id.indexOf(rule.value) === 0;
    });

    if (exclusionRule) {
      return {
        included: false,
        reason: exclusionRule.reason
      };
    }

    return {
      included: false,
      reason: "unmapped_signal"
    };
  }

  function buildRootCauseGroup(rootCauseDefinition, signals) {
    const uniqueSignals = uniqueSignalList(signals);
    const observedState = buildRootCauseObservedState(uniqueSignals);

    return {
      rootCauseId: rootCauseDefinition.rootCauseId,
      domain: rootCauseDefinition.domain,
      kind: rootCauseDefinition.kind,
      activationMode: rootCauseDefinition.activationMode,
      title: rootCauseDefinition.title,
      description: rootCauseDefinition.description,
      signalIds: uniqueSignals.map((signal) => signal.id),
      sources: uniqueStrings(uniqueSignals.map((signal) => signal.source)),
      categories: uniqueStrings(uniqueSignals.map((signal) => signal.category)),
      signals: uniqueSignals.map((signal) => buildRootCauseSignalReference(signal)),
      observedState,
      reasonCodes: uniqueStrings(
        uniqueSignals.reduce((accumulator, signal) => {
          return accumulator.concat(signal.decisionSupport ? signal.decisionSupport.reasonCodes : []);
        }, [])
      ),
      decisionHints: uniqueStrings(
        uniqueSignals.reduce((accumulator, signal) => {
          return accumulator.concat(signal.decisionSupport ? signal.decisionSupport.decisionHints : []);
        }, [])
      )
    };
  }

  function buildRootCauseGroups(dataset) {
    const normalizedDataset = dataset && Array.isArray(dataset.signals)
      ? dataset
      : { signals: [] };
    const validation = normalizedDataset.validation || validateNormalizedDataset(normalizedDataset);
    const output = {
      catalogVersion: ROOT_CAUSE_CATALOG_VERSION,
      generatedAt: new Date().toISOString(),
      basedOnContractVersion: normalizedDataset.contractVersion || CONTRACT_VERSION,
      catalog: cloneRootCauseCatalogEntries(),
      signalToRootCauseMap: {},
      createdRootCauses: [],
      excludedSignals: [],
      validation: {
        valid: validation.valid,
        signalCount: Array.isArray(normalizedDataset.signals) ? normalizedDataset.signals.length : 0,
        groupedSignalCount: 0,
        excludedSignalCount: 0,
        createdRootCauseCount: 0,
        errors: validation.errors || []
      }
    };

    if (!validation.valid) {
      return output;
    }

    const groupedSignals = {};
    const signals = Array.isArray(normalizedDataset.signals) ? normalizedDataset.signals : [];

    signals.forEach((signal) => {
      const match = resolveRootCauseMatch(signal);

      if (!match.included) {
        output.excludedSignals.push(buildExcludedRootCauseSignal(signal, match.reason));
        return;
      }

      output.signalToRootCauseMap[signal.id] = match.rootCauseId;
      if (!groupedSignals[match.rootCauseId]) {
        groupedSignals[match.rootCauseId] = [];
      }

      groupedSignals[match.rootCauseId].push(signal);
    });

    output.createdRootCauses = Object.keys(groupedSignals)
      .map((rootCauseId) => buildRootCauseGroup(ROOT_CAUSE_CATALOG[rootCauseId], groupedSignals[rootCauseId]))
      .sort((left, right) => right.signalIds.length - left.signalIds.length || left.rootCauseId.localeCompare(right.rootCauseId));
    output.validation.groupedSignalCount = Object.keys(output.signalToRootCauseMap).length;
    output.validation.excludedSignalCount = output.excludedSignals.length;
    output.validation.createdRootCauseCount = output.createdRootCauses.length;

    return output;
  }

  function buildSignalLookup(signals) {
    return (signals || []).reduce((accumulator, signal) => {
      if (signal && signal.id) {
        accumulator[signal.id] = signal;
      }

      return accumulator;
    }, {});
  }

  function getRootCauseSignals(rootCause, signalLookup) {
    return (rootCause && Array.isArray(rootCause.signalIds) ? rootCause.signalIds : [])
      .map((signalId) => signalLookup[signalId])
      .filter(Boolean);
  }

  function getRootCauseRepresentativeSignal(rootCause, signalLookup) {
    if (!rootCause || !rootCause.observedState) {
      return null;
    }

    const representativeSignal = signalLookup[rootCause.observedState.representativeSignalId];
    if (representativeSignal) {
      return representativeSignal;
    }

    return selectRepresentativeSignal(
      getRootCauseSignals(rootCause, signalLookup),
      rootCause.observedState.dominantPolarity
    );
  }

  function buildRootCauseAnalysisSignalReference(rootCause, signal, score) {
    const signalReference = buildAnalysisSignalReference(signal, score);
    if (!signalReference) {
      return null;
    }

    return {
      ...signalReference,
      rootCauseId: rootCause.rootCauseId,
      rootCauseDomain: rootCause.domain,
      rootCausePolarity: rootCause.observedState ? rootCause.observedState.dominantPolarity : null,
      rootCauseConfidence: rootCause.observedState ? rootCause.observedState.confidence : null
    };
  }

  function isRelevantRootCauseIssueCandidate(rootCause) {
    if (!rootCause || rootCause.kind !== "primary" || !rootCause.observedState) {
      return false;
    }

    return rootCause.observedState.dominantPolarity === "negative"
      && rootCause.observedState.confidence
      && rootCause.observedState.confidence.overallConfidence >= 0.55;
  }

  function scoreRootCauseIssueCandidate(rootCause) {
    if (!isRelevantRootCauseIssueCandidate(rootCause)) {
      return -Infinity;
    }

    const observedState = rootCause.observedState;
    let score = getSeverityWeight(observedState.strongestIntrinsicSeverity) * 4
      + getPriorityWeight(observedState.highestSuggestedPriority) * 2
      + observedState.confidence.overallConfidence * 4
      + getRemediationWeight(observedState.remediation)
      + getUserControlWeight(observedState.remediation) * 0.5
      + getBenefitWeight(observedState.benefitEstimate) * 1.5;

    if (observedState.contributingSignalIds && observedState.contributingSignalIds.length > 1) {
      score += Math.min(1.2, (observedState.contributingSignalIds.length - 1) * 0.4);
    }

    if (observedState.conflictingSignalIds && observedState.conflictingSignalIds.length > 0) {
      score -= Math.min(1.5, observedState.conflictingSignalIds.length * 0.5);
    }

    return score;
  }

  function selectRootCauseMainIssue(rootCauses, signalLookup) {
    const candidates = (rootCauses || [])
      .map((rootCause) => ({ rootCause, score: scoreRootCauseIssueCandidate(rootCause) }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => right.score - left.score);

    if (candidates.length === 0 || candidates[0].score < 10) {
      return null;
    }

    const rootCause = candidates[0].rootCause;
    const signal = getRootCauseRepresentativeSignal(rootCause, signalLookup);
    if (!signal) {
      return null;
    }

    return {
      rootCause,
      signal,
      score: candidates[0].score
    };
  }

  function scoreRootCauseStrengthCandidate(rootCause) {
    if (!rootCause || rootCause.kind !== "primary" || !rootCause.observedState) {
      return -Infinity;
    }

    if (rootCause.observedState.dominantPolarity !== "positive") {
      return -Infinity;
    }

    if (rootCause.observedState.confidence.overallConfidence < 0.6) {
      return -Infinity;
    }

    if (
      Array.isArray(rootCause.observedState.conflictingSignalIds)
      && rootCause.observedState.conflictingSignalIds.length > 0
    ) {
      return -Infinity;
    }

    return (rootCause.observedState.confidence.overallConfidence * 4)
      + (rootCause.observedState.supportingSignalIds ? rootCause.observedState.supportingSignalIds.length * 0.2 : 0)
      + 1;
  }

  function selectRootCauseStrengths(rootCauses, signalLookup) {
    return (rootCauses || [])
      .map((rootCause) => ({ rootCause, score: scoreRootCauseStrengthCandidate(rootCause) }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => right.score - left.score)
      .map((entry) => {
        const signal = getRootCauseRepresentativeSignal(entry.rootCause, signalLookup);
        return signal
          ? {
              rootCause: entry.rootCause,
              signal,
              score: entry.score
            }
          : null;
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  function scoreRootCauseActionSignal(rootCause, signal) {
    if (!rootCause || !signal || !isActionableRemediation(signal.remediation) || signal.status !== "active") {
      return -Infinity;
    }

    const confidence = getSignalOverallConfidence(signal);
    const likelyGain = signal.scoreImpactEstimate && signal.scoreImpactEstimate.status === "estimated"
      ? signal.scoreImpactEstimate.likelyGain
      : 0;
    let score = getSeverityWeight(signal.intrinsicSeverity) * 2
      + getPriorityWeight(signal.suggestedPriority) * 1.5
      + getRemediationWeight(signal.remediation) * 2
      + getUserControlWeight(signal.remediation)
      + getBenefitWeight(signal.benefitEstimate) * 2
      + confidence * 3
      + (likelyGain * 0.2);

    if (signal.polarity === rootCause.observedState.dominantPolarity) {
      score += 1.5;
    }

    if (signal.id === rootCause.observedState.representativeSignalId) {
      score += 0.5;
    }

    if (hasDecisionHint(signal, "candidate_for_priority_action")) {
      score += 1.5;
    }

    if (hasDecisionHint(signal, "requires_external_tool")) {
      score -= 0.5;
    }

    if (hasDecisionHint(signal, "requires_prudence")) {
      score -= 1;
    }

    return score;
  }

  function selectRootCausePriorityAction(mainIssueEntry, signalLookup) {
    if (!mainIssueEntry || !mainIssueEntry.rootCause) {
      return null;
    }

    const rootCause = mainIssueEntry.rootCause;
    const candidates = getRootCauseSignals(rootCause, signalLookup)
      .map((signal) => ({ signal, score: scoreRootCauseActionSignal(rootCause, signal) }))
      .filter((entry) => Number.isFinite(entry.score))
      .filter((entry) => getSignalOverallConfidence(entry.signal) >= 0.55)
      .sort((left, right) => right.score - left.score);

    if (candidates.length === 0) {
      return null;
    }

    return {
      rootCause,
      signal: candidates[0].signal,
      score: candidates[0].score
    };
  }

  function computeRootCauseContribution(rootCause) {
    if (!rootCause || !rootCause.observedState) {
      return 0;
    }

    const observedState = rootCause.observedState;
    const confidence = observedState.confidence ? observedState.confidence.overallConfidence : 0.5;
    const baseWeight = (getSeverityWeight(observedState.strongestIntrinsicSeverity) * 1.8)
      + (getPriorityWeight(observedState.highestSuggestedPriority) * 1.2);
    const contribution = baseWeight * (0.45 + (confidence / 1.8));

    if (observedState.dominantPolarity === "negative") {
      return contribution * -1;
    }

    if (observedState.dominantPolarity === "positive") {
      return contribution * 0.85;
    }

    return getSeverityWeight(observedState.strongestIntrinsicSeverity) >= 2
      ? contribution * -0.35
      : 0;
  }

  function resolveRootCauseOverallState(rootCauses, mainIssueEntry, strengthsEntries) {
    const primaryRootCauses = (rootCauses || []).filter((rootCause) => rootCause.kind === "primary");
    const contributions = primaryRootCauses
      .map((rootCause) => ({ rootCause, value: computeRootCauseContribution(rootCause) }))
      .sort((left, right) => Math.abs(right.value) - Math.abs(left.value));
    const negativeRootCauses = primaryRootCauses.filter((rootCause) => {
      return rootCause.observedState
        && rootCause.observedState.dominantPolarity === "negative"
        && rootCause.observedState.confidence.overallConfidence >= 0.55;
    });
    const highNegativeRootCauses = negativeRootCauses.filter((rootCause) => {
      return rootCause.observedState.strongestIntrinsicSeverity === "high"
        && rootCause.observedState.confidence.overallConfidence >= 0.65;
    });
    const mediumNegativeRootCauses = negativeRootCauses.filter((rootCause) => {
      return rootCause.observedState.strongestIntrinsicSeverity === "medium"
        && rootCause.observedState.confidence.overallConfidence >= 0.6;
    });
    const lowNegativeRootCauses = negativeRootCauses.filter((rootCause) => {
      return rootCause.observedState.strongestIntrinsicSeverity === "low"
        && rootCause.observedState.confidence.overallConfidence >= 0.55;
    });
    const positiveRootCauses = primaryRootCauses.filter((rootCause) => {
      return rootCause.observedState
        && rootCause.observedState.dominantPolarity === "positive"
        && rootCause.observedState.confidence.overallConfidence >= 0.6;
    });
    const strongPositiveRootCauses = positiveRootCauses.filter((rootCause) => rootCause.observedState.confidence.overallConfidence >= 0.7);
    const neutralConcernRootCauses = primaryRootCauses.filter((rootCause) => {
      return rootCause.observedState
        && rootCause.observedState.dominantPolarity === "neutral"
        && getSeverityWeight(rootCause.observedState.strongestIntrinsicSeverity) >= 2
        && rootCause.observedState.confidence.overallConfidence >= 0.55;
    });
    const negativeDomains = new Set(negativeRootCauses.map((rootCause) => rootCause.domain)).size;
    const positiveDomains = new Set(positiveRootCauses.map((rootCause) => rootCause.domain)).size;
    let key = "discreta";
    let label = "Discreta";

    if (
      highNegativeRootCauses.length >= 2
      || (highNegativeRootCauses.length >= 1 && mediumNegativeRootCauses.length >= 1 && negativeDomains >= 2)
    ) {
      key = "critica";
      label = "Critica";
    } else if (
      highNegativeRootCauses.length >= 1
      || mediumNegativeRootCauses.length >= 2
      || (mediumNegativeRootCauses.length >= 1 && strongPositiveRootCauses.length === 0)
    ) {
      key = "da_migliorare";
      label = "Da Migliorare";
    } else if (
      mediumNegativeRootCauses.length >= 1
      || lowNegativeRootCauses.length >= 2
      || neutralConcernRootCauses.length >= 2
      || (negativeRootCauses.length >= 1 && positiveRootCauses.length === 0)
    ) {
      key = "discreta";
      label = "Discreta";
    } else if (
      negativeRootCauses.length === 0
      && neutralConcernRootCauses.length === 0
      && strongPositiveRootCauses.length >= 2
      && positiveDomains >= 2
    ) {
      key = "molto_buona";
      label = "Molto Buona";
    } else {
      key = "buona";
      label = "Buona";
    }

    return {
      key,
      label,
      contributionScore: contributions.length > 0
        ? Math.round((contributions.reduce((sum, entry) => sum + entry.value, 0) / contributions.length) * 100) / 100
        : 0,
      contributingSignalIds: contributions
        .map((entry) => entry.rootCause.observedState.representativeSignalId)
        .filter(Boolean)
        .slice(0, 5),
      contributingRootCauseIds: contributions.map((entry) => entry.rootCause.rootCauseId).slice(0, 5),
      dominantNegativeSignalIds: contributions
        .filter((entry) => entry.value < 0)
        .map((entry) => entry.rootCause.observedState.representativeSignalId)
        .filter(Boolean)
        .slice(0, 3),
      dominantNegativeRootCauseIds: contributions
        .filter((entry) => entry.value < 0)
        .map((entry) => entry.rootCause.rootCauseId)
        .slice(0, 3),
      dominantPositiveSignalIds: contributions
        .filter((entry) => entry.value > 0)
        .map((entry) => entry.rootCause.observedState.representativeSignalId)
        .filter(Boolean)
        .slice(0, 3),
      dominantPositiveRootCauseIds: contributions
        .filter((entry) => entry.value > 0)
        .map((entry) => entry.rootCause.rootCauseId)
        .slice(0, 3),
      strengthSignalIds: (strengthsEntries || []).map((entry) => entry.signal.id),
      strengthRootCauseIds: (strengthsEntries || []).map((entry) => entry.rootCause.rootCauseId)
    };
  }

  function buildAnalysisReasoning(overallState, mainIssueEntry, strengthsEntries, priorityActionEntry) {
    return {
      overallState: {
        contributingSignalIds: overallState.contributingSignalIds,
        contributingRootCauseIds: overallState.contributingRootCauseIds,
        dominantNegativeSignalIds: overallState.dominantNegativeSignalIds,
        dominantNegativeRootCauseIds: overallState.dominantNegativeRootCauseIds,
        dominantPositiveSignalIds: overallState.dominantPositiveSignalIds,
        dominantPositiveRootCauseIds: overallState.dominantPositiveRootCauseIds,
        strengthSignalIds: overallState.strengthSignalIds,
        strengthRootCauseIds: overallState.strengthRootCauseIds
      },
      mainIssue: mainIssueEntry
        ? {
            selectedRootCause: {
              rootCauseId: mainIssueEntry.rootCause.rootCauseId,
              domain: mainIssueEntry.rootCause.domain,
              observedState: mainIssueEntry.rootCause.observedState
            },
            selectedSignal: buildRootCauseAnalysisSignalReference(mainIssueEntry.rootCause, mainIssueEntry.signal, mainIssueEntry.score),
            why: {
              rationale: mainIssueEntry.signal.rationale,
              reasonCodes: mainIssueEntry.signal.decisionSupport.reasonCodes,
              decisionHints: mainIssueEntry.signal.decisionSupport.decisionHints
            }
          }
        : null,
      strengths: (strengthsEntries || []).map((entry) => ({
        selectedRootCause: {
          rootCauseId: entry.rootCause.rootCauseId,
          domain: entry.rootCause.domain,
          observedState: entry.rootCause.observedState
        },
        selectedSignal: buildRootCauseAnalysisSignalReference(entry.rootCause, entry.signal, entry.score),
        why: {
          rationale: entry.signal.rationale,
          reasonCodes: entry.signal.decisionSupport.reasonCodes,
          decisionHints: entry.signal.decisionSupport.decisionHints
        }
      })),
      priorityAction: priorityActionEntry
        ? {
            selectedRootCause: {
              rootCauseId: priorityActionEntry.rootCause.rootCauseId,
              domain: priorityActionEntry.rootCause.domain,
              observedState: priorityActionEntry.rootCause.observedState
            },
            selectedSignal: buildRootCauseAnalysisSignalReference(priorityActionEntry.rootCause, priorityActionEntry.signal, priorityActionEntry.score),
            why: {
              rationale: priorityActionEntry.signal.rationale,
              reasonCodes: priorityActionEntry.signal.decisionSupport.reasonCodes,
              decisionHints: priorityActionEntry.signal.decisionSupport.decisionHints
            }
          }
        : null
    };
  }

  function analyzeNormalizedDataset(dataset) {
    const normalizedDataset = dataset && Array.isArray(dataset.signals)
      ? dataset
      : { signals: [] };
    const validation = normalizedDataset.validation || validateNormalizedDataset(normalizedDataset);
    const signals = Array.isArray(normalizedDataset.signals) ? normalizedDataset.signals : [];
    const signalLookup = buildSignalLookup(signals);
    const rootCauseState = buildRootCauseGroups(normalizedDataset);
    const rootCauses = rootCauseState && Array.isArray(rootCauseState.createdRootCauses)
      ? rootCauseState.createdRootCauses
      : [];
    const mainIssueEntry = selectRootCauseMainIssue(rootCauses, signalLookup);
    const strengthsEntries = selectRootCauseStrengths(rootCauses, signalLookup);
    const priorityActionEntry = selectRootCausePriorityAction(mainIssueEntry, signalLookup);
    const overallState = resolveRootCauseOverallState(rootCauses, mainIssueEntry, strengthsEntries);
    const confidenceSignals = uniqueSignalList([
      mainIssueEntry ? mainIssueEntry.signal : null,
      priorityActionEntry ? priorityActionEntry.signal : null
    ].concat(strengthsEntries.map((entry) => entry.signal)));
    const overallConfidence = aggregateConfidenceFromSignals(confidenceSignals.length > 0 ? confidenceSignals : signals.slice(0, 5));
    const reasoning = buildAnalysisReasoning(overallState, mainIssueEntry, strengthsEntries, priorityActionEntry);

    if (!validation.valid) {
      return {
        overallState: {
          key: "discreta",
          label: "Discreta",
          contributionScore: 0,
          contributingSignalIds: []
        },
        mainIssue: null,
        strengths: [],
        priorityAction: null,
        overallConfidence: {
          sourceConfidence: 0,
          interpretationConfidence: 0,
          overallConfidence: 0,
          level: "Bassa"
        },
        reasoning: {
          overallState: {
            contributingSignalIds: [],
            contributingRootCauseIds: [],
            dominantNegativeSignalIds: [],
            dominantNegativeRootCauseIds: [],
            dominantPositiveSignalIds: [],
            dominantPositiveRootCauseIds: [],
            strengthSignalIds: [],
            strengthRootCauseIds: []
          },
          mainIssue: null,
          strengths: [],
          priorityAction: null
        }
      };
    }

    return {
      overallState: {
        key: overallState.key,
        label: overallState.label,
        contributionScore: overallState.contributionScore,
        contributingSignalIds: overallState.contributingSignalIds
      },
      mainIssue: mainIssueEntry
        ? buildRootCauseAnalysisSignalReference(mainIssueEntry.rootCause, mainIssueEntry.signal, mainIssueEntry.score)
        : null,
      strengths: strengthsEntries.map((entry) => buildRootCauseAnalysisSignalReference(entry.rootCause, entry.signal, entry.score)),
      priorityAction: priorityActionEntry
        ? buildRootCauseAnalysisSignalReference(priorityActionEntry.rootCause, priorityActionEntry.signal, priorityActionEntry.score)
        : null,
      overallConfidence,
      reasoning
    };
  }

  function validateSignal(signal) {
    const errors = [];

    if (!signal || typeof signal !== "object") {
      return ["Signal non valido: valore non oggetto."];
    }

    if (!signal.id) {
      errors.push("Campo obbligatorio mancante: id.");
    }

    if (!signal.source) {
      errors.push("Campo obbligatorio mancante: source.");
    }

    if (!ALLOWED_POLARITIES.has(signal.polarity)) {
      errors.push(`Polarity non valida per ${signal.id || "signal"}: ${signal.polarity}.`);
    }

    if (!ALLOWED_SEVERITIES.has(signal.intrinsicSeverity)) {
      errors.push(`IntrinsicSeverity non valida per ${signal.id || "signal"}: ${signal.intrinsicSeverity}.`);
    }

    if (!ALLOWED_PRIORITIES.has(signal.suggestedPriority)) {
      errors.push(`SuggestedPriority non valida per ${signal.id || "signal"}: ${signal.suggestedPriority}.`);
    }

    if (!signal.confidence || typeof signal.confidence !== "object") {
      errors.push(`Confidence mancante o non valida per ${signal.id || "signal"}.`);
    } else {
      if (typeof signal.confidence.sourceConfidence !== "number") {
        errors.push(`sourceConfidence non valida per ${signal.id || "signal"}.`);
      }
      if (typeof signal.confidence.interpretationConfidence !== "number") {
        errors.push(`interpretationConfidence non valida per ${signal.id || "signal"}.`);
      }
      if (typeof signal.confidence.overallConfidence !== "number") {
        errors.push(`overallConfidence non valida per ${signal.id || "signal"}.`);
      }
    }

    if (!signal.remediation || !ALLOWED_REMEDIATION_STATUSES.has(signal.remediation.status)) {
      errors.push(`Remediation.status non valido per ${signal.id || "signal"}.`);
    }

    if (!signal.remediation || !ALLOWED_USER_CONTROL.has(signal.remediation.userControl)) {
      errors.push(`Remediation.userControl non valido per ${signal.id || "signal"}.`);
    }

    if (!signal.benefitEstimate || !ALLOWED_ESTIMATE_STATUS.has(signal.benefitEstimate.status)) {
      errors.push(`BenefitEstimate.status non valido per ${signal.id || "signal"}.`);
    }

    if (!signal.scoreImpactEstimate || !ALLOWED_ESTIMATE_STATUS.has(signal.scoreImpactEstimate.status)) {
      errors.push(`ScoreImpactEstimate.status non valido per ${signal.id || "signal"}.`);
    }

    if (!signal.decisionSupport || !Array.isArray(signal.decisionSupport.reasonCodes) || !Array.isArray(signal.decisionSupport.decisionHints)) {
      errors.push(`DecisionSupport non valido per ${signal.id || "signal"}.`);
    }

    return errors;
  }

  function validateNormalizedDataset(dataset) {
    const signalErrors = [];
    const signals = dataset && Array.isArray(dataset.signals) ? dataset.signals : [];

    signals.forEach((signal) => {
      const currentErrors = validateSignal(signal);
      currentErrors.forEach((errorMessage) => {
        signalErrors.push(errorMessage);
      });
    });

    return {
      valid: signalErrors.length === 0,
      contractName: dataset && dataset.contractName ? dataset.contractName : CONTRACT_NAME,
      contractVersion: dataset && dataset.contractVersion ? dataset.contractVersion : CONTRACT_VERSION,
      signalCount: signals.length,
      errors: signalErrors
    };
  }

  function normalizeSignals(inputContext) {
    const context = buildContext(inputContext);
    const signals = []
      .concat(adaptBrowserSignals(context.browserEnvironment))
      .concat(adaptNetworkSignals(context.networkEnvironment))
      .concat(adaptDnsSignals(context.dnsEnvironment))
      .concat(adaptDnsLeakSignals(context.dnsLeakEnvironment))
      .concat(adaptDnsSecuritySignals(context.dnsSecurityEnvironment))
      .concat(adaptVpnSignals(context.vpnEnvironment))
      .concat(adaptWebRtcSignals(context.webrtcEnvironment))
      .concat(adaptPrivacyScoreSignals(context.privacyScore));
    const dataset = {
      contractName: CONTRACT_NAME,
      contractVersion: CONTRACT_VERSION,
      generatedAt: new Date().toISOString(),
      metadata: buildAdapterMetadata(signals),
      context,
      signals
    };

    dataset.validation = validateNormalizedDataset(dataset);

    return dataset;
  }

  globalObject.PrivacyIntelligenceEngine = {
    CONTRACT_NAME,
    CONTRACT_VERSION,
    ROOT_CAUSE_CATALOG_VERSION,
    ROOT_CAUSE_CATALOG,
    ROOT_CAUSE_SIGNAL_MAPPING,
    normalizeSignals,
    buildRootCauseGroups,
    analyzeNormalizedDataset,
    validateNormalizedDataset,
    adaptBrowserSignals,
    adaptNetworkSignals,
    adaptDnsSignals,
    adaptDnsLeakSignals,
    adaptDnsSecuritySignals,
    adaptVpnSignals,
    adaptWebRtcSignals,
    adaptPrivacyScoreSignals
  };
})(window);
