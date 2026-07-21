(function attachDnsSecurityDetection(globalObject) {
  // ============================================================
  // DNS Security Detection (v0.8.5) — DNSSEC validation
  //
  // Verifica se il resolver DNS in uso VALIDA DNSSEC. Tecnica:
  // si prova a raggiungere una coppia di domini di test — uno con
  // firma DNSSEC valida (controllo) e uno con firma volutamente
  // rotta. Un resolver che valida rifiuta il dominio rotto
  // (SERVFAIL) e la fetch viene respinta; un resolver che non
  // valida lo risolve e la fetch si risolve (anche con 404, perche
  // in mode:no-cors basta che il server risponda).
  //
  // Regola: se il controllo valido e raggiungibile ma il rotto NO,
  // il resolver valida DNSSEC. La rilevazione e network-dipendente
  // e quindi INFERENZIALE: confidenza prudenziale, mai certezza.
  //
  // Il modulo non conosce lo score ne la UI.
  // ============================================================

  const DEFAULT_TIMEOUT_MS = 4000;
  const MAX_CONFIDENCE = 0.75;

  // Provider (recursivi noti) che validano DNSSEC per impostazione
  // predefinita. Quando il provider e CONFERMATO, questa e una fonte
  // piu affidabile del probe live, che i domini bloccati possono falsare.
  const DNSSEC_VALIDATING_PROVIDERS = new Set([
    "nextdns",
    "cloudflare",
    "quad9",
    "google",
    "adguard",
    "controld",
    "opendns"
  ]);

  const TEST_PAIRS = [
    {
      id: "dnssec_works",
      valid: "https://valid.dnssec.works/",
      broken: "https://fail01.dnssec.works/"
    },
    {
      id: "verteiltesysteme",
      valid: "https://sigok.verteiltesysteme.net/",
      broken: "https://sigfail.verteiltesysteme.net/"
    }
  ];

  const FUTURE_SIGNALS = ["DoH Detection completa", "VPN Protection Analysis"];

  function getReliabilityLabel(confidence) {
    if (confidence >= 0.9) {
      return "Alta";
    }
    if (confidence >= 0.6) {
      return "Media";
    }
    return "Bassa";
  }

  function getFetchImpl(injected) {
    if (typeof injected === "function") {
      return injected;
    }
    if (typeof globalObject.fetch === "function") {
      return globalObject.fetch.bind(globalObject);
    }
    return null;
  }

  // true = il server ha risposto (DNS risolto), false = irraggiungibile
  // (SERVFAIL da validazione DNSSEC, timeout o connessione fallita).
  async function isReachable(fetchImpl, url, timeoutMs) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller
      ? globalObject.setTimeout(() => controller.abort(), timeoutMs)
      : null;

    try {
      await fetchImpl(url, {
        mode: "no-cors",
        cache: "no-store",
        redirect: "manual",
        signal: controller ? controller.signal : undefined
      });
      return true;
    } catch (error) {
      return false;
    } finally {
      if (timeoutId) {
        globalObject.clearTimeout(timeoutId);
      }
    }
  }

  // "validating" | "not_validating" | "inconclusive"
  async function evaluatePair(fetchImpl, pair, timeoutMs) {
    const validReachable = await isReachable(fetchImpl, pair.valid, timeoutMs);
    if (!validReachable) {
      return { id: pair.id, verdict: "inconclusive", validReachable, brokenReachable: null };
    }
    const brokenReachable = await isReachable(fetchImpl, pair.broken, timeoutMs);
    return {
      id: pair.id,
      verdict: brokenReachable ? "not_validating" : "validating",
      validReachable,
      brokenReachable
    };
  }

  function isProviderConfirmed(dnsEnvironment) {
    return Boolean(
      dnsEnvironment
      && (dnsEnvironment.determination === "confirmed"
        || (dnsEnvironment.sources && dnsEnvironment.sources.providerVerification))
    );
  }

  function providerValidatesDnssec(dnsEnvironment) {
    const providerId = String(dnsEnvironment && dnsEnvironment.providerId || "").trim().toLowerCase();
    return DNSSEC_VALIDATING_PROVIDERS.has(providerId);
  }

  function buildProviderValidatedEnvironment(dnsEnvironment) {
    const providerName = (dnsEnvironment && dnsEnvironment.provider) || "il provider verificato";
    return {
      dnssecState: "validating",
      confidence: 0.9,
      reliability: "Alta",
      pairsTested: 0,
      pairsConclusive: 0,
      basis: "provider_capability",
      description: `Il provider DNS verificato (${providerName}) valida DNSSEC per impostazione predefinita: le risposte DNS sono protette dalla manomissione.`,
      sources: { dnssecProbe: false, providerCapability: true },
      futureSignals: FUTURE_SIGNALS,
      debug: { pairs: [] }
    };
  }

  function buildFallbackDnsSecurityEnvironment() {
    return {
      dnssecState: "not_determinable",
      confidence: 0.2,
      reliability: "Bassa",
      pairsTested: 0,
      pairsConclusive: 0,
      description: "Non e stato possibile verificare la validazione DNSSEC in questa sessione (nessun controllo raggiungibile o fetch non disponibile).",
      sources: { dnssecProbe: false },
      futureSignals: FUTURE_SIGNALS,
      debug: { pairs: [] }
    };
  }

  async function analyzeDnsSecurity(options) {
    const resolvedOptions = options || {};
    const dnsEnvironment = resolvedOptions.dnsEnvironment || {};

    // Priorita alla capacita del provider confermato: piu affidabile del
    // probe live, che i domini di test bloccati (es. blocklist) falserebbero.
    if (isProviderConfirmed(dnsEnvironment) && providerValidatesDnssec(dnsEnvironment)) {
      return buildProviderValidatedEnvironment(dnsEnvironment);
    }

    const timeoutMs = Number.isFinite(resolvedOptions.timeoutMs) ? resolvedOptions.timeoutMs : DEFAULT_TIMEOUT_MS;
    const fetchImpl = getFetchImpl(resolvedOptions.fetchImpl);

    if (!fetchImpl) {
      return buildFallbackDnsSecurityEnvironment();
    }

    const pairs = await Promise.all(
      TEST_PAIRS.map((pair) => evaluatePair(fetchImpl, pair, timeoutMs))
    );

    const conclusive = pairs.filter((pair) => pair.verdict !== "inconclusive");
    const validatingCount = conclusive.filter((pair) => pair.verdict === "validating").length;
    const notValidatingCount = conclusive.filter((pair) => pair.verdict === "not_validating").length;

    let dnssecState;
    let confidence;

    if (conclusive.length === 0) {
      dnssecState = "not_determinable";
      confidence = 0.2;
    } else if (validatingCount > 0 && notValidatingCount === 0) {
      dnssecState = "validating";
      confidence = conclusive.length >= 2 ? MAX_CONFIDENCE : 0.55;
    } else if (notValidatingCount > 0 && validatingCount === 0) {
      dnssecState = "not_validating";
      confidence = conclusive.length >= 2 ? MAX_CONFIDENCE : 0.55;
    } else {
      // coppie in disaccordo: non ci sbilanciamo
      dnssecState = "not_determinable";
      confidence = 0.3;
    }

    let description;
    if (dnssecState === "validating") {
      description = "Il resolver DNS rifiuta i domini con firma DNSSEC non valida: la validazione DNSSEC risulta attiva, un buon segnale di integrita delle risposte DNS.";
    } else if (dnssecState === "not_validating") {
      description = "Il resolver DNS risolve anche domini con firma DNSSEC rotta: la validazione DNSSEC non risulta attiva, quindi le risposte DNS non sono protette dalla manomissione.";
    } else {
      description = "La verifica DNSSEC non e conclusiva in questa sessione: i controlli non concordano o non sono raggiungibili.";
    }

    return {
      dnssecState,
      confidence,
      reliability: getReliabilityLabel(confidence),
      pairsTested: pairs.length,
      pairsConclusive: conclusive.length,
      description,
      sources: { dnssecProbe: true },
      futureSignals: FUTURE_SIGNALS,
      debug: { pairs }
    };
  }

  globalObject.PrivacyDnsSecurity = {
    analyzeDnsSecurity,
    getFallbackDnsSecurityEnvironment: buildFallbackDnsSecurityEnvironment
  };
})(window);
