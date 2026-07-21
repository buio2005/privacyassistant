(function attachVpnDetection(globalObject) {
  // ============================================================
  // VPN Presence Observation (v0.8.6) — modulo di detection isolato
  //
  // OSSERVA segnali compatibili con l'uso di una VPN o proxy. NON
  // giudica: non dice se una VPN sia buona o cattiva, consigliata o
  // sconsigliata. Si limita a indicare se, dai segnali raccolti,
  // risulti l'uso di una VPN/proxy. Il risultato e neutro e non deve
  // influenzare punteggio o stato generale.
  //
  // Indizi (tutti inferenziali, confidenza bassa):
  //  - l'IP pubblico appartiene a un'organizzazione di datacenter/
  //    hosting (le VPN escono da datacenter, non da ISP residenziali)
  //  - discrepanza tra la timezone geografica dell'IP e quella del
  //    browser
  //
  // Il modulo non conosce lo score ne la UI.
  // ============================================================

  const DEFAULT_IPINFO_URL = "https://ipwho.is/";
  const FETCH_TIMEOUT_MS = 4000;
  const MAX_CONFIDENCE = 0.6;

  // Domini di provider di hosting/datacenter e VPN noti (egress tipico
  // di una VPN). Confronto trasparente sul campo connection.domain.
  const HOSTING_DOMAINS = new Set([
    "amazonaws.com", "google.com", "googleusercontent.com", "microsoft.com",
    "azure.com", "oracle.com", "digitalocean.com", "vultr.com", "choopa.com",
    "ovh.net", "ovh.com", "hetzner.com", "hetzner.de", "linode.com",
    "contabo.com", "contabo.de", "scaleway.com", "online.net", "leaseweb.com",
    "m247.com", "datacamp.co.uk", "datapacket.com", "cogentco.com",
    "colocrossing.com", "worldstream.nl", "hostwinds.com", "packet.net",
    "constant.com", "quadranet.com", "psychz.net", "g-core.net",
    "baseip.com", "as-baseip.com", "servinga.com", "ipxo.com",
    "31173.se", "flokinet.is", "privatelayer.com", "3xk.tech",
    "mullvad.net", "nordvpn.com", "expressvpn.com", "protonvpn.com",
    "privateinternetaccess.com", "surfshark.com", "cyberghostvpn.com",
    "windscribe.com", "ivpn.net", "perfect-privacy.com"
  ]);

  // Parole chiave trasparenti nell'organizzazione/ISP.
  const HOSTING_KEYWORDS = [
    "hosting", "datacenter", "data center", "data-center", "cloud", "vps",
    "colo", "colocation", "server", "dedicated", "leaseweb", "m247",
    "datacamp", "choopa", "vultr", "digitalocean", "hetzner", "linode",
    "contabo", "scaleway", "ovh", "amazon", "google", "microsoft", "azure",
    "oracle", "cogent", "colocrossing", "worldstream", "hostwinds",
    "quadranet", "psychz", "g-core", "vpn"
  ];

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

  function getBrowserTimezone(explicitValue) {
    if (explicitValue) {
      return String(explicitValue);
    }
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (error) {
      return "";
    }
  }

  function timezoneRegion(timezoneId) {
    return String(timezoneId || "").split("/")[0].trim().toLowerCase();
  }

  function looksLikeHosting(connection) {
    const domain = String(connection && connection.domain || "").trim().toLowerCase();
    if (domain && HOSTING_DOMAINS.has(domain)) {
      return { match: true, basis: `dominio egress: ${domain}` };
    }

    const haystack = `${connection && connection.org || ""} ${connection && connection.isp || ""}`.toLowerCase();
    const keyword = HOSTING_KEYWORDS.find((word) => haystack.includes(word));
    if (keyword) {
      return { match: true, basis: `organizzazione: ${(connection && connection.org) || (connection && connection.isp) || keyword}` };
    }

    return { match: false, basis: "" };
  }

  function buildFallbackVpnEnvironment() {
    return {
      vpnState: "not_determinable",
      confidence: 0.2,
      reliability: "Bassa",
      indicators: [],
      observedOrg: "Non disponibile",
      description: "Non e stato possibile raccogliere i segnali di rete necessari in questa sessione, quindi non si puo osservare l'eventuale uso di una VPN o proxy.",
      sources: { ipInfo: false },
      debug: {}
    };
  }

  async function fetchIpInfo(fetchImpl, url) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller
      ? globalObject.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      : null;

    try {
      const response = await fetchImpl(url, {
        mode: "cors",
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      });
      if (!response || !response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      return null;
    } finally {
      if (timeoutId) {
        globalObject.clearTimeout(timeoutId);
      }
    }
  }

  async function analyzeVpnPresence(options) {
    const resolvedOptions = options || {};
    const fetchImpl = getFetchImpl(resolvedOptions.fetchImpl);
    const ipInfoUrl = resolvedOptions.ipInfoUrl || DEFAULT_IPINFO_URL;
    const browserTimezone = getBrowserTimezone(resolvedOptions.browserTimezone);

    if (!fetchImpl) {
      return buildFallbackVpnEnvironment();
    }

    const ipInfo = await fetchIpInfo(fetchImpl, ipInfoUrl);
    if (!ipInfo || ipInfo.success === false || !ipInfo.connection) {
      return buildFallbackVpnEnvironment();
    }

    const connection = ipInfo.connection;
    const observedOrg = connection.org || connection.isp || "Non disponibile";
    const indicators = [];

    const hosting = looksLikeHosting(connection);
    if (hosting.match) {
      indicators.push({ id: "datacenter_egress", basis: hosting.basis });
    }

    // Confronto sull'id completo della timezone (es. Europe/Amsterdam vs
    // Europe/Rome): una relocazione geografica dell'IP rispetto al fuso del
    // browser e un indizio tipico di VPN/proxy, anche dentro lo stesso continente.
    const ipTimezoneId = String((ipInfo.timezone && ipInfo.timezone.id) || "").trim();
    const normalizedIpTimezone = ipTimezoneId.toLowerCase();
    const normalizedBrowserTimezone = String(browserTimezone || "").trim().toLowerCase();
    if (normalizedIpTimezone && normalizedBrowserTimezone && normalizedIpTimezone !== normalizedBrowserTimezone) {
      indicators.push({
        id: "timezone_mismatch",
        basis: `IP in ${ipTimezoneId}, browser in ${browserTimezone}`
      });
    }

    const hasDatacenter = indicators.some((indicator) => indicator.id === "datacenter_egress");
    const hasMismatch = indicators.some((indicator) => indicator.id === "timezone_mismatch");

    let vpnState;
    let confidence;
    if (hasDatacenter && hasMismatch) {
      vpnState = "signals_present";
      confidence = MAX_CONFIDENCE;
    } else if (hasDatacenter) {
      vpnState = "signals_present";
      confidence = 0.5;
    } else if (hasMismatch) {
      vpnState = "signals_present";
      confidence = 0.35;
    } else {
      vpnState = "no_signals";
      confidence = 0.5;
    }

    let description;
    if (vpnState === "signals_present") {
      const bases = indicators.map((indicator) => indicator.basis).join("; ");
      description = `Dai segnali osservati risulta l'uso di una VPN o proxy (${bases}). E una semplice osservazione tecnica, non un giudizio sulla VPN.`;
    } else {
      description = `Non emergono segnali compatibili con l'uso di una VPN o proxy: l'IP pubblico risulta associato a ${observedOrg}.`;
    }

    return {
      vpnState,
      confidence,
      reliability: getReliabilityLabel(confidence),
      indicators,
      observedOrg,
      description,
      sources: { ipInfo: true },
      debug: {
        ip: ipInfo.ip,
        country: ipInfo.country,
        org: observedOrg,
        domain: connection.domain,
        ipTimezone: ipInfo.timezone && ipInfo.timezone.id,
        browserTimezone
      }
    };
  }

  globalObject.PrivacyVpnDetection = {
    analyzeVpnPresence,
    getFallbackVpnEnvironment: buildFallbackVpnEnvironment
  };
})(window);
