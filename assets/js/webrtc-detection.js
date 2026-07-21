(function attachWebRtcDetection(globalObject) {
  const CANDIDATE_GATHERING_TIMEOUT_MS = 2500;
  const STUN_SERVERS = [
    "stun:stun.cloudflare.com:3478",
    "stun:stun.l.google.com:19302"
  ];

  function buildBaseWebRtcEnvironment() {
    return {
      state: "Protetto",
      stateKey: "protected",
      functionalState: "Protetto",
      functionalStateKey: "protected",
      riskLevel: "Basso",
      priority: "Bassa",
      simpleExplanation: "Il browser non ha mostrato indirizzi WebRTC direttamente esposti durante questa analisi.",
      privacyImpact: "L'impatto immediato sulla privacy appare ridotto, ma future verifiche potranno aggiungere correlazioni con VPN e DNS Leak Detection.",
      suggestedAction: "Mantieni questa configurazione stabile e ricontrolla il risultato quando verranno aggiunte analisi VPN e DNS leak.",
      reliability: "Media",
      confidence: 0.78,
      candidateSummary: "Nessun candidato WebRTC esposto",
      technicalFindings: {
        candidateCount: 0,
        candidateTypes: {
          host: 0,
          srflx: 0,
          relay: 0,
          unknown: 0
        },
        publicAddresses: [],
        privateAddresses: [],
        mdnsHostnames: [],
        relayAddresses: [],
        serverReflexiveAddresses: [],
        unknownAddresses: [],
        hasHostCandidate: false,
        hasServerReflexiveCandidate: false,
        hasRelayCandidate: false,
        hasMdnsHostname: false,
        hasPrivateAddress: false,
        hasPublicAddress: false
      },
      sources: {
        webrtcApi: false,
        candidateGathering: false
      },
      futureSignals: [
        "VPN Protection Analysis",
        "DNS Leak Detection"
      ]
    };
  }

  function isPrivateIpv4(address) {
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(address)) {
      return false;
    }

    const octets = address.split(".").map((part) => parseInt(part, 10));
    if (octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
      return false;
    }

    return (
      octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    );
  }

  function isIpv6Address(value) {
    return /^[0-9a-f:]+$/i.test(String(value || "")) && String(value || "").includes(":");
  }

  function isPrivateIpv6(address) {
    const normalized = String(address || "").toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  function isPublicIpAddress(address) {
    if (!address) {
      return false;
    }

    if (/\.local$/i.test(address)) {
      return false;
    }

    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(address)) {
      return !isPrivateIpv4(address);
    }

    if (isIpv6Address(address)) {
      return !isPrivateIpv6(address);
    }

    return false;
  }

  function isPrivateIpAddress(address) {
    if (!address) {
      return false;
    }

    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(address)) {
      return isPrivateIpv4(address);
    }

    if (isIpv6Address(address)) {
      return isPrivateIpv6(address);
    }

    return false;
  }

  function extractCandidateAddress(candidateLine) {
    const parts = String(candidateLine || "").trim().split(/\s+/);
    if (parts.length >= 5) {
      return parts[4];
    }

    return "";
  }

  function classifyCandidate(candidateLine) {
    const normalized = String(candidateLine || "").trim();
    const typeMatch = normalized.match(/\btyp\s+([a-z0-9]+)/i);
    const candidateType = typeMatch ? typeMatch[1].toLowerCase() : "unknown";
    const address = extractCandidateAddress(normalized);
    const mdnsHostname = /\.local$/i.test(address);

    return {
      rawCandidate: normalized,
      type: candidateType,
      address,
      mdnsHostname,
      hasPrivateAddress: isPrivateIpAddress(address),
      hasPublicAddress: isPublicIpAddress(address)
    };
  }

  function dedupeCandidates(candidateLines) {
    const uniqueCandidates = [];
    const seen = new Set();

    candidateLines.forEach((candidateLine) => {
      const normalized = String(candidateLine || "").trim();
      if (!normalized || seen.has(normalized)) {
        return;
      }

      seen.add(normalized);
      uniqueCandidates.push(classifyCandidate(normalized));
      // #region debug-point C:classified-candidate
      fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"webrtc-exposure-check",runId:"pre",hypothesisId:"C",location:"assets/js/webrtc-detection.js:144",msg:"[DEBUG] WebRTC candidate classified",data:uniqueCandidates[uniqueCandidates.length-1],ts:Date.now()})}).catch(()=>{});
      // #endregion
    });

    return uniqueCandidates;
  }

  function uniqueStrings(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
  }

  function buildTechnicalFindings(candidates) {
    const publicAddresses = [];
    const privateAddresses = [];
    const mdnsHostnames = [];
    const relayAddresses = [];
    const serverReflexiveAddresses = [];
    const unknownAddresses = [];
    const candidateTypes = {
      host: 0,
      srflx: 0,
      relay: 0,
      unknown: 0
    };

    candidates.forEach((candidate) => {
      if (candidateTypes[candidate.type] >= 0) {
        candidateTypes[candidate.type] += 1;
      } else {
        candidateTypes.unknown += 1;
      }

      if (candidate.mdnsHostname) {
        mdnsHostnames.push(candidate.address);
      }

      if (candidate.hasPrivateAddress) {
        privateAddresses.push(candidate.address);
      }

      if (candidate.hasPublicAddress) {
        publicAddresses.push(candidate.address);
      }

      if (candidate.type === "relay") {
        relayAddresses.push(candidate.address || "relay");
      }

      if (candidate.type === "srflx") {
        serverReflexiveAddresses.push(candidate.address || "srflx");
      }

      if (
        !candidate.address &&
        candidate.type === "unknown"
      ) {
        unknownAddresses.push(candidate.rawCandidate);
      }
    });

    return {
      candidateCount: candidates.length,
      candidateTypes,
      publicAddresses: uniqueStrings(publicAddresses),
      privateAddresses: uniqueStrings(privateAddresses),
      mdnsHostnames: uniqueStrings(mdnsHostnames),
      relayAddresses: uniqueStrings(relayAddresses),
      serverReflexiveAddresses: uniqueStrings(serverReflexiveAddresses),
      unknownAddresses: uniqueStrings(unknownAddresses),
      hasHostCandidate: candidates.some((candidate) => candidate.type === "host"),
      hasServerReflexiveCandidate: candidates.some((candidate) => candidate.type === "srflx"),
      hasRelayCandidate: candidates.some((candidate) => candidate.type === "relay"),
      hasMdnsHostname: candidates.some((candidate) => candidate.mdnsHostname),
      hasPrivateAddress: candidates.some((candidate) => candidate.hasPrivateAddress),
      hasPublicAddress: candidates.some((candidate) => candidate.hasPublicAddress)
    };
  }

  function buildExposureAlias(technicalFindings) {
    return {
      candidateCount: technicalFindings.candidateCount,
      hasHostCandidate: technicalFindings.hasHostCandidate,
      hasServerReflexiveCandidate: technicalFindings.hasServerReflexiveCandidate,
      hasRelayCandidate: technicalFindings.hasRelayCandidate,
      hasMdnsHostname: technicalFindings.hasMdnsHostname,
      hasPrivateAddress: technicalFindings.hasPrivateAddress,
      hasPublicAddress: technicalFindings.hasPublicAddress
    };
  }

  function summarizeTechnicalFindings(technicalFindings, stateKey) {
    if (!technicalFindings.candidateCount) {
      return "Nessun candidato WebRTC utile emerso durante la finestra di raccolta.";
    }

    if (stateKey === "public_ip_exposed") {
      return `Candidati raccolti: ${technicalFindings.candidateCount}. IP pubblici osservati: ${technicalFindings.publicAddresses.join(", ") || "non disponibile"}.`;
    }

    if (stateKey === "local_ip_visible") {
      return `Candidati raccolti: ${technicalFindings.candidateCount}. Sono visibili indirizzi locali: ${technicalFindings.privateAddresses.join(", ") || "non disponibile"}.`;
    }

    if (stateKey === "mdns_active") {
      return `Candidati raccolti: ${technicalFindings.candidateCount}. Sono emersi hostname mDNS mascherati: ${technicalFindings.mdnsHostnames.join(", ") || "non disponibile"}.`;
    }

    if (stateKey === "relay_detected") {
      return `Candidati raccolti: ${technicalFindings.candidateCount}. Sono emersi candidati relay senza IP pubblici direttamente leggibili.`;
    }

    return `Candidati raccolti: ${technicalFindings.candidateCount}. Configurazione WebRTC da verificare con maggiore dettaglio.`;
  }

  function buildFunctionalResult(baseResult, technicalFindings, definition) {
    return Object.assign({}, baseResult, {
      state: definition.state,
      stateKey: definition.stateKey,
      functionalState: definition.state,
      functionalStateKey: definition.stateKey,
      riskLevel: definition.riskLevel,
      priority: definition.priority,
      simpleExplanation: definition.simpleExplanation,
      privacyImpact: definition.privacyImpact,
      suggestedAction: definition.suggestedAction,
      reliability: definition.reliability,
      confidence: definition.confidence,
      candidateSummary: summarizeTechnicalFindings(technicalFindings, definition.stateKey),
      technicalFindings,
      exposure: buildExposureAlias(technicalFindings)
    });
  }

  function evaluateCandidates(candidates) {
    const fallback = buildBaseWebRtcEnvironment();
    const technicalFindings = buildTechnicalFindings(candidates);

    if (technicalFindings.hasPublicAddress || technicalFindings.hasServerReflexiveCandidate) {
      return buildFunctionalResult(fallback, technicalFindings, {
        state: "IP pubblico esposto",
        stateKey: "public_ip_exposed",
        riskLevel: "Alto",
        priority: "Alta",
        reliability: "Alta",
        confidence: 0.9,
        simpleExplanation: "Il browser ha mostrato almeno un candidato WebRTC con indirizzo pubblico o reflexive leggibile da una pagina web.",
        privacyImpact: "Questo e il caso piu rilevante per la privacy, perche un sito puo correlare meglio sessione, rete e dispositivo anche quando ti aspetti protezioni aggiuntive.",
        suggestedAction: "Controlla le impostazioni WebRTC del browser e, quando disponibile, confronta questo risultato con VPN Protection Analysis e DNS Leak Detection."
      });
    }

    if (technicalFindings.hasPrivateAddress) {
      return buildFunctionalResult(fallback, technicalFindings, {
        state: "Solo IP locale visibile",
        stateKey: "local_ip_visible",
        riskLevel: "Medio",
        priority: "Media",
        reliability: "Alta",
        confidence: 0.84,
        simpleExplanation: "Il browser non ha mostrato un IP pubblico, ma ha reso leggibili indirizzi locali o privati della rete interna.",
        privacyImpact: "L'impatto e intermedio: un sito puo comunque capire qualcosa in piu sulla tua rete locale o sulla struttura del dispositivo.",
        suggestedAction: "Verifica se il browser puo ridurre l'esposizione dei candidati host locali oppure se un profilo privacy piu rigido e compatibile con il tuo uso."
      });
    }

    if (technicalFindings.hasRelayCandidate && !technicalFindings.hasMdnsHostname) {
      return buildFunctionalResult(fallback, technicalFindings, {
        state: "Relay rilevato",
        stateKey: "relay_detected",
        riskLevel: "Basso",
        priority: "Bassa",
        reliability: "Media",
        confidence: 0.8,
        simpleExplanation: "Il browser ha mostrato solo candidati relay, senza IP pubblici o locali direttamente leggibili.",
        privacyImpact: "Questo e un segnale generalmente piu prudente, perche il traffico appare mediato da relay invece di esporre subito indirizzi di rete piu sensibili.",
        suggestedAction: "Mantieni questa configurazione e ricontrolla il risultato se cambi browser, estensioni o impostazioni di rete."
      });
    }

    if (technicalFindings.hasMdnsHostname) {
      return buildFunctionalResult(fallback, technicalFindings, {
        state: "mDNS attivo",
        stateKey: "mdns_active",
        riskLevel: "Basso",
        priority: "Bassa",
        reliability: "Alta",
        confidence: 0.82,
        simpleExplanation: "Il browser sta mascherando i candidati host locali con nomi mDNS e non ha mostrato IP pubblici direttamente leggibili.",
        privacyImpact: "Questo riduce l'esposizione immediata degli indirizzi locali e rappresenta in genere un comportamento piu prudente lato browser.",
        suggestedAction: "Non serve intervenire subito. Mantieni attiva questa protezione e verifica solo se in futuro emergeranno anche IP pubblici o locali reali."
      });
    }

    if (!technicalFindings.candidateCount) {
      return buildFunctionalResult(fallback, technicalFindings, {
        state: "Protetto",
        stateKey: "protected",
        riskLevel: "Basso",
        priority: "Bassa",
        reliability: "Media",
        confidence: 0.74,
        simpleExplanation: "Durante questa analisi non sono emersi candidati WebRTC leggibili che mostrino dettagli di rete utili.",
        privacyImpact: "La superficie di esposizione WebRTC appare limitata in questa sessione, anche se future verifiche potranno aggiungere controlli piu avanzati.",
        suggestedAction: "Mantieni questa configurazione stabile e ricontrolla il risultato dopo aggiornamenti del browser o cambi di rete."
      });
    }

    return buildFunctionalResult(fallback, technicalFindings, {
      state: "Configurazione da verificare",
      stateKey: "verify_configuration",
      riskLevel: "Medio",
      priority: "Media",
      reliability: "Media",
      confidence: 0.6,
      simpleExplanation: "Sono emersi candidati WebRTC, ma il pattern raccolto non rientra in uno scenario abbastanza chiaro per una lettura immediata.",
      privacyImpact: "Il risultato non indica automaticamente una forte esposizione, ma nemmeno una protezione chiara. Conviene considerarlo come configurazione da approfondire.",
      suggestedAction: "Ripeti il controllo in modo isolato e, se necessario, usa una diagnostica sviluppatore per capire meglio quali candidati vengono esposti."
    });
  }

  async function collectIceCandidates(RTCPeerConnectionConstructor) {
    return new Promise((resolve) => {
      const candidateLines = [];
      let resolved = false;
      const peerConnection = new RTCPeerConnectionConstructor({
        iceServers: [
          {
            urls: STUN_SERVERS
          }
        ]
      });

      function finish() {
        if (resolved) {
          return;
        }

        resolved = true;
        globalObject.clearTimeout(timeoutId);
        try {
          peerConnection.onicecandidate = null;
          peerConnection.onicegatheringstatechange = null;
          peerConnection.close();
        } catch (error) {
          // Ignore cleanup errors.
        }
        resolve(dedupeCandidates(candidateLines));
      }

      const timeoutId = globalObject.setTimeout(finish, CANDIDATE_GATHERING_TIMEOUT_MS);

      peerConnection.onicecandidate = (event) => {
        if (event && event.candidate && event.candidate.candidate) {
          candidateLines.push(event.candidate.candidate);
          // #region debug-point A:onicecandidate-raw
          fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"webrtc-exposure-check",runId:"pre",hypothesisId:"A",location:"assets/js/webrtc-detection.js:277",msg:"[DEBUG] WebRTC raw ICE candidate from onicecandidate",data:{candidate:event.candidate.candidate,candidateType:event.candidate.type||"unknown",protocol:event.candidate.protocol||"unknown",address:event.candidate.address||""},ts:Date.now()})}).catch(()=>{});
          // #endregion
          return;
        }

        if (event && event.candidate === null) {
          finish();
        }
      };

      peerConnection.onicegatheringstatechange = () => {
        if (peerConnection.iceGatheringState === "complete") {
          finish();
        }
      };

      peerConnection.createDataChannel("pca-webrtc-check");

      peerConnection.createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          const localDescription = peerConnection.localDescription;
          if (localDescription && localDescription.sdp) {
            localDescription.sdp.split(/\r?\n/).forEach((line) => {
              if (line.startsWith("a=candidate:")) {
                candidateLines.push(line.slice(2));
                // #region debug-point B:sdp-raw
                fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"webrtc-exposure-check",runId:"pre",hypothesisId:"B",location:"assets/js/webrtc-detection.js:301",msg:"[DEBUG] WebRTC raw ICE candidate from local SDP",data:{candidate:line.slice(2)},ts:Date.now()})}).catch(()=>{});
                // #endregion
              }
            });
          }
        })
        .catch(finish);
    });
  }

  async function detectWebRtcEnvironment() {
    const fallback = buildBaseWebRtcEnvironment();
    const RTCPeerConnectionConstructor =
      globalObject.RTCPeerConnection ||
      globalObject.webkitRTCPeerConnection ||
      globalObject.mozRTCPeerConnection;

    if (!RTCPeerConnectionConstructor) {
      return Object.assign({}, fallback, {
        state: "Configurazione da verificare",
        stateKey: "verify_configuration",
        functionalState: "Configurazione da verificare",
        functionalStateKey: "verify_configuration",
        riskLevel: "Medio",
        priority: "Media",
        simpleExplanation: "Il browser non espone l'API WebRTC necessaria a questa analisi oppure la funzione risulta disattivata.",
        privacyImpact: "L'assenza dell'API riduce l'esposizione immediata, ma non permette una verifica completa del comportamento futuro in presenza di VPN o DNS leak.",
        suggestedAction: "Verifica se WebRTC e disattivato intenzionalmente oppure se il browser sta limitando questa analisi in modo compatibile con la tua configurazione.",
        candidateSummary: "API WebRTC non disponibile",
        confidence: 0.58
      });
    }

    try {
      const candidates = await collectIceCandidates(RTCPeerConnectionConstructor);
      const evaluated = evaluateCandidates(candidates);
      // #region debug-point D:evaluation-summary
      fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"webrtc-exposure-check",runId:"pre",hypothesisId:"D",location:"assets/js/webrtc-detection.js:331",msg:"[DEBUG] WebRTC evaluation summary",data:{candidateCount:candidates.length,candidates,exposure:evaluated.exposure,state:evaluated.state,riskLevel:evaluated.riskLevel,candidateSummary:evaluated.candidateSummary},ts:Date.now()})}).catch(()=>{});
      // #endregion
      return Object.assign({}, evaluated, {
        sources: {
          webrtcApi: true,
          candidateGathering: true
        },
        candidates
      });
    } catch (error) {
      // #region debug-point E:evaluation-error
      fetch("http://127.0.0.1:7777/event",{method:"POST",body:JSON.stringify({sessionId:"webrtc-exposure-check",runId:"pre",hypothesisId:"E",location:"assets/js/webrtc-detection.js:344",msg:"[DEBUG] WebRTC evaluation error",data:{message:error&&error.message?error.message:"unknown error"},ts:Date.now()})}).catch(()=>{});
      // #endregion
      return Object.assign({}, fallback, {
        state: "Configurazione da verificare",
        stateKey: "verify_configuration",
        functionalState: "Configurazione da verificare",
        functionalStateKey: "verify_configuration",
        riskLevel: "Medio",
        priority: "Media",
        sources: {
          webrtcApi: true,
          candidateGathering: false
        },
        reliability: "Bassa",
        confidence: 0.42,
        simpleExplanation: "La raccolta dei candidati WebRTC non si e conclusa correttamente in questa sessione.",
        privacyImpact: "Il risultato e da considerare prudenziale: la rilevazione non e stata abbastanza affidabile per confermare esposizione o protezione completa.",
        suggestedAction: "Ripeti il controllo in una nuova sessione o dopo un refresh pulito per verificare se il comportamento resta coerente.",
        candidateSummary: error && error.message ? error.message : "Raccolta candidati non riuscita"
      });
    }
  }

  globalObject.PrivacyWebRtcDetection = {
    detectWebRtcEnvironment
  };
})(window);
