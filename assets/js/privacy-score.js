(function attachPrivacyScoreEngine(globalObject) {
  function translate(key, fallback, variables) {
    const i18n = globalObject.PCAI18n;
    if (i18n && typeof i18n.t === "function") {
      return i18n.t(key, fallback, variables);
    }

    return String(fallback).replace(/\{(\w+)\}/g, (_, variableName) => {
      return Object.prototype.hasOwnProperty.call(variables || {}, variableName)
        ? String(variables[variableName])
        : "";
    });
  }

  const FUTURE_SIGNALS = [
    "DNSSEC",
    "DNS Leak Detection",
    "DoH Detection",
    "VPN Protection Analysis"
  ];

  const BROWSER_PRIVACY_POINTS = {
    Base: 10,
    Buono: 14,
    Avanzato: 17,
    "Molto Avanzato": 19,
    Specializzato: 20
  };

  const FAMILY_POINTS = {
    "Chromium Family": 3,
    "Firefox Family": 6,
    "Tor Family": 8,
    "Non disponibile": 4
  };

  const OS_POINTS = {
    Linux: 7,
    macOS: 6,
    iOS: 6,
    Android: 5,
    "Chrome OS": 5,
    Windows: 4,
    "Non disponibile": 3
  };

  const DNS_PROVIDER_POINTS = {
    NextDNS: 18,
    "ControlD": 17,
    Quad9: 16,
    "AdGuard DNS": 15,
    Cloudflare: 13,
    OpenDNS: 10,
    "Google DNS": 8,
    "Provider DNS non determinabile": 9
  };

  function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function getLevel(score) {
    if (score <= 30) {
      return translate("privacy.level.needsImprovement", "Da migliorare");
    }
    if (score <= 60) {
      return translate("privacy.level.fair", "Discreto");
    }
    if (score <= 80) {
      return translate("privacy.level.good", "Buono");
    }
    return translate("privacy.level.excellent", "Ottimo");
  }

  function getToneByRatio(awardedPoints, maxPoints) {
    const ratio = maxPoints > 0 ? awardedPoints / maxPoints : 0;
    if (ratio >= 0.75) {
      return "success";
    }
    if (ratio >= 0.45) {
      return "info";
    }
    return "warning";
  }

  function getVersionMajor(version) {
    const normalized = String(version || "").trim();
    const match = normalized.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  function scoreBrowserVersion(browserEnvironment) {
    const major = getVersionMajor(browserEnvironment.version);
    const family = browserEnvironment.family;

    if (major === null) {
      return 3;
    }

    if (family === "Chromium Family") {
      if (major >= 120) {
        return 8;
      }
      if (major >= 110) {
        return 7;
      }
      if (major >= 100) {
        return 5;
      }
      return 2;
    }

    if (family === "Firefox Family" || family === "Tor Family") {
      if (major >= 115) {
        return 8;
      }
      if (major >= 102) {
        return 7;
      }
      if (major >= 90) {
        return 5;
      }
      return 2;
    }

    return 4;
  }

  function scoreArchitecture(architecture) {
    if (architecture === "Non disponibile") {
      return 3;
    }
    if (/arm64/i.test(architecture)) {
      return 3;
    }
    if (/x86_64|64-bit|x64|amd64/i.test(architecture)) {
      return 2;
    }
    if (/x86|32-bit/i.test(architecture)) {
      return 1;
    }
    return 2;
  }

  function scoreDoNotTrack(doNotTrack) {
    if (doNotTrack === "Attivo") {
      return 8;
    }
    if (doNotTrack === "Disattivo") {
      return 2;
    }
    return 4;
  }

  function scoreIpExposure(networkEnvironment) {
    const hasIpv4 = networkEnvironment.ipv4 !== "Non disponibile";
    const hasIpv6 = networkEnvironment.ipv6 !== "Non disponibile";

    if (hasIpv4 && hasIpv6) {
      return 3;
    }
    if (hasIpv6) {
      return 5;
    }
    if (hasIpv4) {
      return 4;
    }
    return 3;
  }

  function scoreBrowserLanguage(language) {
    const normalized = String(language || "").trim();
    if (!normalized || normalized === "Non disponibile") {
      return 2;
    }
    if (/^[a-z]{2}$/i.test(normalized)) {
      return 5;
    }
    if (/^[a-z]{2}-[A-Z]{2}$/i.test(normalized)) {
      return 4;
    }
    return 2;
  }

  function scoreDnsProvider(dnsEnvironment) {
    return DNS_PROVIDER_POINTS[dnsEnvironment.provider] || 9;
  }

  function scoreWebRtcExposure(webrtcEnvironment) {
    if (!webrtcEnvironment || !webrtcEnvironment.state) {
      return 5;
    }

    const stateKey = webrtcEnvironment.stateKey || "verify_configuration";

    if (stateKey === "protected") {
      return 12;
    }

    if (stateKey === "mdns_active") {
      return 10;
    }

    if (stateKey === "relay_detected") {
      return 9;
    }

    if (stateKey === "local_ip_visible") {
      return 6;
    }

    if (stateKey === "verify_configuration") {
      return 5;
    }

    if (stateKey === "public_ip_exposed") {
      return 1;
    }

    return 5;
  }

  function scoreTimezone(timezone) {
    if (timezone === "UTC") {
      return 6;
    }
    if (!timezone || timezone === "Non disponibile") {
      return 3;
    }
    return 5;
  }

  function scoreResolution(screenResolution) {
    const normalized = String(screenResolution || "").trim();
    if (!normalized || normalized === "Non disponibile") {
      return 3;
    }

    const commonResolutions = new Set([
      "1280 x 720",
      "1280 x 800",
      "1366 x 768",
      "1440 x 900",
      "1536 x 864",
      "1600 x 900",
      "1920 x 1080",
      "2560 x 1440"
    ]);

    if (commonResolutions.has(normalized)) {
      return 6;
    }

    const match = normalized.match(/^(\d+)\s*x\s*(\d+)$/i);
    if (!match) {
      return 3;
    }

    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    const pixelCount = width * height;

    if (pixelCount <= 921600) {
      return 5;
    }
    if (pixelCount <= 2073600) {
      return 4;
    }
    return 3;
  }

  function createFactor(key, label, awardedPoints, maxPoints, detail) {
    return {
      key,
      label,
      awardedPoints,
      maxPoints,
      detail,
      tone: getToneByRatio(awardedPoints, maxPoints)
    };
  }

  function detectPrivacyScore(browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment) {
    const resolvedDnsEnvironment = dnsEnvironment || {
      provider: "Provider DNS non determinabile",
      privacyLevel: "Non disponibile",
      reliability: "Bassa"
    };
    const resolvedWebRtcEnvironment = webrtcEnvironment || {
      state: "Protetto",
      riskLevel: "Basso",
      reliability: "Media",
      candidateSummary: "Nessun candidato WebRTC esposto"
    };
    const factors = [
      createFactor(
        "browserPrivacyLevel",
        translate("privacy.factor.browserPrivacyLevel", "Browser Privacy Level"),
        BROWSER_PRIVACY_POINTS[browserEnvironment.privacyLevel] || 12,
        20,
        translate("privacy.factor.browserPrivacyLevel.detail", `Livello assegnato al browser rilevato: ${browserEnvironment.privacyLevel}.`, {
          level: browserEnvironment.privacyLevel
        })
      ),
      createFactor(
        "browserFamily",
        translate("privacy.factor.browserFamily", "Famiglia browser"),
        FAMILY_POINTS[browserEnvironment.family] || 5,
        8,
        translate("privacy.factor.browserFamily.detail", `Famiglia tecnica rilevata: ${browserEnvironment.family}.`, {
          family: browserEnvironment.family
        })
      ),
      createFactor(
        "browserVersion",
        translate("privacy.factor.browserVersion", "Versione browser"),
        scoreBrowserVersion(browserEnvironment),
        8,
        translate("privacy.factor.browserVersion.detail", `Versione osservata: ${browserEnvironment.version}.`, {
          version: browserEnvironment.version
        })
      ),
      createFactor(
        "operatingSystem",
        translate("privacy.factor.operatingSystem", "Sistema operativo"),
        OS_POINTS[browserEnvironment.os] || 4,
        7,
        translate("privacy.factor.operatingSystem.detail", `Sistema operativo rilevato: ${browserEnvironment.os}.`, {
          os: browserEnvironment.os
        })
      ),
      createFactor(
        "architecture",
        translate("privacy.factor.architecture", "Architettura"),
        scoreArchitecture(browserEnvironment.architecture),
        3,
        translate("privacy.factor.architecture.detail", `Architettura esposta al browser: ${browserEnvironment.architecture}.`, {
          architecture: browserEnvironment.architecture
        })
      ),
      createFactor(
        "doNotTrack",
        "Do Not Track",
        scoreDoNotTrack(networkEnvironment.doNotTrack),
        8,
        translate("privacy.factor.doNotTrack.detail", `Preferenza Do Not Track: ${networkEnvironment.doNotTrack}.`, {
          value: networkEnvironment.doNotTrack
        })
      ),
      createFactor(
        "publicIpExposure",
        translate("privacy.factor.publicIpExposure", "Esposizione IP"),
        scoreIpExposure(networkEnvironment),
        9,
        translate("privacy.factor.publicIpExposure.detail", `IPv4: ${networkEnvironment.ipv4}; IPv6: ${networkEnvironment.ipv6}.`, {
          ipv4: networkEnvironment.ipv4,
          ipv6: networkEnvironment.ipv6
        })
      ),
      createFactor(
        "browserLanguage",
        translate("privacy.factor.browserLanguage", "Lingua browser"),
        scoreBrowserLanguage(networkEnvironment.browserLanguage),
        5,
        translate("privacy.factor.browserLanguage.detail", `Lingua dichiarata dal browser: ${networkEnvironment.browserLanguage}.`, {
          language: networkEnvironment.browserLanguage
        })
      ),
      createFactor(
        "timezone",
        "Timezone",
        scoreTimezone(networkEnvironment.timezone),
        6,
        translate("privacy.factor.timezone.detail", `Fuso orario rilevato: ${networkEnvironment.timezone}.`, {
          timezone: networkEnvironment.timezone
        })
      ),
      createFactor(
        "screenResolution",
        translate("privacy.factor.screenResolution", "Risoluzione schermo"),
        scoreResolution(networkEnvironment.screenResolution),
        8,
        translate("privacy.factor.screenResolution.detail", `Risoluzione disponibile al browser: ${networkEnvironment.screenResolution}.`, {
          resolution: networkEnvironment.screenResolution
        })
      ),
      createFactor(
        "dnsProvider",
        translate("privacy.factor.dnsProvider", "Provider DNS"),
        scoreDnsProvider(resolvedDnsEnvironment),
        18,
        translate(
          "privacy.factor.dnsProvider.detail",
          `Provider DNS rilevato: ${resolvedDnsEnvironment.provider}. Livello privacy stimato: ${resolvedDnsEnvironment.privacyLevel}. Affidabilita: ${resolvedDnsEnvironment.reliability}.`,
          {
            provider: resolvedDnsEnvironment.provider,
            level: resolvedDnsEnvironment.privacyLevel,
            reliability: resolvedDnsEnvironment.reliability
          }
        )
      ),
      createFactor(
        "webrtcExposure",
        translate("privacy.factor.webrtcExposure", "Esposizione WebRTC"),
        scoreWebRtcExposure(resolvedWebRtcEnvironment),
        12,
        translate(
          "privacy.factor.webrtcExposure.detail",
          `Stato WebRTC: ${resolvedWebRtcEnvironment.state}. Livello di rischio: ${resolvedWebRtcEnvironment.riskLevel}. Affidabilita: ${resolvedWebRtcEnvironment.reliability}.`,
          {
            state: resolvedWebRtcEnvironment.state,
            risk: resolvedWebRtcEnvironment.riskLevel,
            reliability: resolvedWebRtcEnvironment.reliability
          }
        )
      )
    ];

    const rawScore = factors.reduce((total, factor) => total + factor.awardedPoints, 0);
    const totalMaxPoints = factors.reduce((total, factor) => total + factor.maxPoints, 0);
    const normalizedScore = totalMaxPoints > 0 ? (rawScore / totalMaxPoints) * 100 : 0;
    const score = clampScore(normalizedScore);
    const level = getLevel(score);

    return {
      score,
      maxScore: 100,
      progress: score,
      level,
      factors,
      futureSignals: FUTURE_SIGNALS
    };
  }

  globalObject.PrivacyScoreEngine = {
    detectPrivacyScore
  };
})(window);
