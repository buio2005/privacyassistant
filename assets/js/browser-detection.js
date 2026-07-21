(function attachBrowserDetection(globalObject) {
  const PRIVACY_LEVEL_BY_BROWSER = {
    firefox: "Buono",
    librewolf: "Molto Avanzato",
    mullvad: "Molto Avanzato",
    zen: "Avanzato",
    brave: "Avanzato",
    chrome: "Base",
    edge: "Base",
    vivaldi: "Buono",
    floorp: "Avanzato",
    tor: "Specializzato",
    unknown: "Base"
  };

  const FAMILY_BY_BROWSER = {
    firefox: "Firefox Family",
    librewolf: "Firefox Family",
    mullvad: "Firefox Family",
    zen: "Firefox Family",
    floorp: "Firefox Family",
    brave: "Chromium Family",
    chrome: "Chromium Family",
    edge: "Chromium Family",
    vivaldi: "Chromium Family",
    tor: "Tor Family",
    unknown: "Non disponibile"
  };

  function normalizeBrand(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function formatArchitecture(architecture, bitness) {
    if (!architecture && !bitness) {
      return "Non disponibile";
    }

    const parts = [];
    if (architecture) {
      parts.push(architecture);
    }
    if (bitness) {
      parts.push(`${bitness}-bit`);
    }
    return parts.join(" ");
  }

  async function getHighEntropyValues(userAgentData) {
    if (!userAgentData || typeof userAgentData.getHighEntropyValues !== "function") {
      return {};
    }

    try {
      return await userAgentData.getHighEntropyValues([
        "architecture",
        "bitness",
        "fullVersionList",
        "platformVersion"
      ]);
    } catch (error) {
      return {};
    }
  }

  async function detectBraveBrowser(navigatorObject) {
    const braveApi = navigatorObject.brave;
    if (!braveApi || typeof braveApi.isBrave !== "function") {
      return false;
    }

    try {
      return await braveApi.isBrave();
    } catch (error) {
      return false;
    }
  }

  function collectBrandEntries(userAgentData, highEntropyValues) {
    const brandEntries = [];
    const rawEntries = []
      .concat(Array.isArray(userAgentData && userAgentData.brands) ? userAgentData.brands : [])
      .concat(Array.isArray(highEntropyValues.fullVersionList) ? highEntropyValues.fullVersionList : []);

    rawEntries.forEach((entry) => {
      if (!entry || !entry.brand) {
        return;
      }

      brandEntries.push({
        brand: String(entry.brand),
        normalizedBrand: normalizeBrand(entry.brand),
        version: String(entry.version || "")
      });
    });

    return brandEntries;
  }

  function hasBrand(brandEntries, expectedBrands) {
    return expectedBrands.some((expected) => {
      const normalizedExpected = normalizeBrand(expected);
      return brandEntries.some((entry) => {
        return (
          entry.normalizedBrand === normalizedExpected ||
          entry.normalizedBrand.includes(normalizedExpected)
        );
      });
    });
  }

  function getVersionFromBrands(brandEntries, expectedBrands) {
    for (const expected of expectedBrands) {
      const normalizedExpected = normalizeBrand(expected);
      const match = brandEntries.find((entry) => {
        return (
          entry.normalizedBrand === normalizedExpected ||
          entry.normalizedBrand.includes(normalizedExpected)
        );
      });

      if (match && match.version) {
        return match.version;
      }
    }

    return "";
  }

  function getVersionFromUserAgent(userAgent, patterns) {
    for (const pattern of patterns) {
      const match = userAgent.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return "";
  }

  function detectOperatingSystem(navigatorObject, highEntropyValues) {
    const userAgent = navigatorObject.userAgent || "";
    const platform = String(
      (navigatorObject.userAgentData && navigatorObject.userAgentData.platform) ||
      navigatorObject.platform ||
      ""
    ).toLowerCase();

    if (platform.includes("android") || /android/i.test(userAgent)) {
      return "Android";
    }
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return "iOS";
    }
    if (platform.includes("mac") || /mac os x/i.test(userAgent)) {
      return "macOS";
    }
    if (platform.includes("win") || /windows nt/i.test(userAgent)) {
      return "Windows";
    }
    if (platform.includes("cros") || /cros/i.test(userAgent)) {
      return "Chrome OS";
    }
    if (platform.includes("linux") || /linux/i.test(userAgent)) {
      return "Linux";
    }
    if (highEntropyValues.platformVersion && platform.includes("windows")) {
      return "Windows";
    }

    return "Non disponibile";
  }

  function detectArchitecture(navigatorObject, highEntropyValues) {
    if (highEntropyValues.architecture || highEntropyValues.bitness) {
      return formatArchitecture(highEntropyValues.architecture, highEntropyValues.bitness);
    }

    const userAgent = navigatorObject.userAgent || "";
    const architecturePatterns = [
      { pattern: /(arm64|aarch64)/i, label: "arm64" },
      { pattern: /(x86_64|win64|x64|amd64)/i, label: "x86_64" },
      { pattern: /(i686|i386|x86)/i, label: "x86" }
    ];

    for (const entry of architecturePatterns) {
      if (entry.pattern.test(userAgent)) {
        return entry.label;
      }
    }

    return "Non disponibile";
  }

  function detectBrowserName(userAgent, brandEntries, isBrave) {
    const detectionRules = [
      {
        id: "tor",
        name: "Tor Browser",
        brandHints: ["Tor Browser"],
        userAgentPatterns: [/TorBrowser\//i]
      },
      {
        id: "mullvad",
        name: "Mullvad Browser",
        brandHints: ["Mullvad Browser", "MullvadBrowser"],
        userAgentPatterns: [/MullvadBrowser\//i, /Mullvad Browser/i]
      },
      {
        id: "librewolf",
        name: "LibreWolf",
        brandHints: ["LibreWolf"],
        userAgentPatterns: [/LibreWolf\//i]
      },
      {
        id: "floorp",
        name: "Floorp",
        brandHints: ["Floorp"],
        userAgentPatterns: [/Floorp\//i]
      },
      {
        id: "zen",
        name: "Zen Browser",
        brandHints: ["Zen Browser", "Zen"],
        userAgentPatterns: [/Zen\/([\d.]+)/i, /ZenBrowser/i]
      },
      {
        id: "brave",
        name: "Brave",
        brandHints: ["Brave"],
        userAgentPatterns: [],
        customCheck: () => isBrave
      },
      {
        id: "vivaldi",
        name: "Vivaldi",
        brandHints: ["Vivaldi"],
        userAgentPatterns: [/Vivaldi\//i]
      },
      {
        id: "edge",
        name: "Microsoft Edge",
        brandHints: ["Microsoft Edge", "Edge"],
        userAgentPatterns: [/EdgA?\/[\d.]+/i, /EdgiOS\/[\d.]+/i, /Edg\/[\d.]+/i]
      },
      {
        id: "chrome",
        name: "Chrome",
        brandHints: ["Google Chrome", "Chromium", "Chrome"],
        userAgentPatterns: [/Chrome\/[\d.]+/i, /CriOS\/[\d.]+/i]
      },
      {
        id: "firefox",
        name: "Firefox",
        brandHints: ["Firefox"],
        userAgentPatterns: [/Firefox\/[\d.]+/i]
      }
    ];

    for (const rule of detectionRules) {
      const hasMatchingBrand = hasBrand(brandEntries, rule.brandHints);
      const hasMatchingUserAgent = rule.userAgentPatterns.some((pattern) => pattern.test(userAgent));
      const passesCustomCheck = typeof rule.customCheck === "function" ? rule.customCheck() : false;

      if (hasMatchingBrand || hasMatchingUserAgent || passesCustomCheck) {
        return rule;
      }
    }

    return {
      id: "unknown",
      name: "Browser non riconosciuto",
      brandHints: [],
      userAgentPatterns: []
    };
  }

  function detectBrowserVersion(browserRule, userAgent, brandEntries) {
    const versionByBrowser = {
      tor: {
        brandHints: ["Tor Browser"],
        userAgentPatterns: [/TorBrowser\/([\d.]+)/i, /Firefox\/([\d.]+)/i]
      },
      mullvad: {
        brandHints: ["Mullvad Browser", "MullvadBrowser"],
        userAgentPatterns: [/MullvadBrowser\/([\d.]+)/i, /Firefox\/([\d.]+)/i]
      },
      librewolf: {
        brandHints: ["LibreWolf"],
        userAgentPatterns: [/LibreWolf\/([\d.]+)/i, /Firefox\/([\d.]+)/i]
      },
      floorp: {
        brandHints: ["Floorp"],
        userAgentPatterns: [/Floorp\/([\d.]+)/i, /Firefox\/([\d.]+)/i]
      },
      zen: {
        brandHints: ["Zen Browser", "Zen"],
        userAgentPatterns: [/Zen\/([\d.]+)/i, /Firefox\/([\d.]+)/i]
      },
      brave: {
        brandHints: ["Brave"],
        userAgentPatterns: [/Brave\/([\d.]+)/i, /Chrome\/([\d.]+)/i]
      },
      vivaldi: {
        brandHints: ["Vivaldi"],
        userAgentPatterns: [/Vivaldi\/([\d.]+)/i, /Chrome\/([\d.]+)/i]
      },
      edge: {
        brandHints: ["Microsoft Edge", "Edge"],
        userAgentPatterns: [/EdgA?\/([\d.]+)/i, /EdgiOS\/([\d.]+)/i, /Edg\/([\d.]+)/i]
      },
      chrome: {
        brandHints: ["Google Chrome", "Chromium", "Chrome"],
        userAgentPatterns: [/Chrome\/([\d.]+)/i, /CriOS\/([\d.]+)/i]
      },
      firefox: {
        brandHints: ["Firefox"],
        userAgentPatterns: [/Firefox\/([\d.]+)/i]
      }
    };

    const entry = versionByBrowser[browserRule.id];
    if (!entry) {
      return "Non disponibile";
    }

    return (
      getVersionFromBrands(brandEntries, entry.brandHints) ||
      getVersionFromUserAgent(userAgent, entry.userAgentPatterns) ||
      "Non disponibile"
    );
  }

  async function detectBrowserEnvironment() {
    const navigatorObject = globalObject.navigator || {};
    const userAgent = navigatorObject.userAgent || "";
    const userAgentData = navigatorObject.userAgentData || null;
    const highEntropyValues = await getHighEntropyValues(userAgentData);
    const brandEntries = collectBrandEntries(userAgentData, highEntropyValues);
    const isBrave = await detectBraveBrowser(navigatorObject);
    const browserRule = detectBrowserName(userAgent, brandEntries, isBrave);
    const browserVersion = detectBrowserVersion(browserRule, userAgent, brandEntries);
    const operatingSystem = detectOperatingSystem(navigatorObject, highEntropyValues);
    const architecture = detectArchitecture(navigatorObject, highEntropyValues);
    const privacyLevel = PRIVACY_LEVEL_BY_BROWSER[browserRule.id] || PRIVACY_LEVEL_BY_BROWSER.unknown;
    const family = FAMILY_BY_BROWSER[browserRule.id] || FAMILY_BY_BROWSER.unknown;

    return {
      browser: browserRule.name,
      version: browserVersion,
      os: operatingSystem,
      architecture,
      family,
      privacyLevel,
      browserId: browserRule.id,
      sources: {
        userAgent: Boolean(userAgent),
        userAgentData: Boolean(userAgentData),
        highEntropyValues: Object.keys(highEntropyValues).length > 0,
        braveApi: isBrave
      }
    };
  }

  globalObject.PrivacyBrowserDetection = {
    detectBrowserEnvironment
  };
})(window);
