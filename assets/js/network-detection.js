(function attachNetworkDetection(globalObject) {
  const IP_REQUEST_TIMEOUT_MS = 3500;

  function getBrowserLanguage(navigatorObject) {
    return navigatorObject.language || navigatorObject.userLanguage || "Non disponibile";
  }

  function getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Non disponibile";
    } catch (error) {
      return "Non disponibile";
    }
  }

  function getScreenResolution(screenObject) {
    if (!screenObject || !screenObject.width || !screenObject.height) {
      return "Non disponibile";
    }

    return `${screenObject.width} x ${screenObject.height}`;
  }

  function getDoNotTrackValue(globalScope, navigatorObject) {
    const rawValue = navigatorObject.doNotTrack || globalScope.doNotTrack || navigatorObject.msDoNotTrack;

    if (rawValue === "1" || rawValue === 1 || rawValue === "yes") {
      return "Attivo";
    }

    if (rawValue === "0" || rawValue === 0 || rawValue === "no") {
      return "Disattivo";
    }

    return "Non disponibile";
  }

  async function fetchIpAddress(url) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller
      ? globalObject.setTimeout(() => controller.abort(), IP_REQUEST_TIMEOUT_MS)
      : null;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        signal: controller ? controller.signal : undefined
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      return payload.ip || "Non disponibile";
    } catch (error) {
      return "Non disponibile";
    } finally {
      if (timeoutId) {
        globalObject.clearTimeout(timeoutId);
      }
    }
  }

  async function detectPublicIpAddresses() {
    const [ipv4, ipv6] = await Promise.all([
      fetchIpAddress("https://api4.ipify.org?format=json"),
      fetchIpAddress("https://api6.ipify.org?format=json")
    ]);

    return { ipv4, ipv6 };
  }

  async function detectNetworkEnvironment() {
    const navigatorObject = globalObject.navigator || {};
    const ipAddresses = await detectPublicIpAddresses();

    return {
      ipv4: ipAddresses.ipv4,
      ipv6: ipAddresses.ipv6,
      browserLanguage: getBrowserLanguage(navigatorObject),
      timezone: getTimezone(),
      screenResolution: getScreenResolution(globalObject.screen),
      doNotTrack: getDoNotTrackValue(globalObject, navigatorObject),
      sources: {
        ipLookup: true,
        browserLanguage: Boolean(navigatorObject.language || navigatorObject.userLanguage),
        timezone: true,
        screen: Boolean(globalObject.screen),
        doNotTrack: Boolean(
          navigatorObject.doNotTrack ||
          globalObject.doNotTrack ||
          navigatorObject.msDoNotTrack
        )
      }
    };
  }

  globalObject.PrivacyNetworkDetection = {
    detectNetworkEnvironment
  };
})(window);
