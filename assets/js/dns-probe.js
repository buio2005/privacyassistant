(function attachDnsProbe(globalObject) {
  const JSONP_TIMEOUT_MS = 4500;
  const FETCH_TIMEOUT_MS = 3500;

  function cleanupJsonp(callbackName, scriptNode) {
    try {
      delete globalObject[callbackName];
    } catch (error) {
      globalObject[callbackName] = undefined;
    }

    if (scriptNode && scriptNode.parentNode) {
      scriptNode.parentNode.removeChild(scriptNode);
    }
  }

  function runResolverSnapshotProbe() {
    return new Promise((resolve) => {
      const uniqueId = `pca-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
      const callbackName = `__pcaDnsCallback_${Math.random().toString(36).slice(2)}`;
      const requestedUrl = `https://${uniqueId}.which.resolve.rs/api.json?callback=${callbackName}`;
      const scriptNode = document.createElement("script");
      let settled = false;

      const finish = (payload) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanupJsonp(callbackName, scriptNode);
        resolve({
          requestedUrl,
          payload
        });
      };

      const timeoutId = globalObject.setTimeout(() => {
        finish({
          success: false,
          output: "",
          source: "",
          message: "Resolver snapshot timeout"
        });
      }, JSONP_TIMEOUT_MS);

      globalObject[callbackName] = (payload) => {
        globalObject.clearTimeout(timeoutId);
        finish(payload || {
          success: false,
          output: "",
          source: "",
          message: "Resolver snapshot empty response"
        });
      };

      scriptNode.async = true;
      scriptNode.src = requestedUrl;
      scriptNode.onerror = () => {
        globalObject.clearTimeout(timeoutId);
        finish({
          success: false,
          output: "",
          source: "",
          message: "Resolver snapshot request failed"
        });
      };

      document.head.appendChild(scriptNode);
    });
  }

  async function runTextProbe(url) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller
      ? globalObject.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      : null;

    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        signal: controller ? controller.signal : undefined
      });

      if (!response.ok) {
        return {
          ok: false,
          requestedUrl: url,
          text: "",
          error: `HTTP ${response.status}`
        };
      }

      return {
        ok: true,
        requestedUrl: url,
        text: await response.text(),
        error: ""
      };
    } catch (error) {
      return {
        ok: false,
        requestedUrl: url,
        text: "",
        error: error && error.message ? error.message : "Request failed"
      };
    } finally {
      if (timeoutId) {
        globalObject.clearTimeout(timeoutId);
      }
    }
  }

  globalObject.PrivacyDnsProbe = {
    runResolverSnapshotProbe,
    runTextProbe
  };
})(window);
