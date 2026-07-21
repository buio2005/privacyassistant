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
        riskLevel: "Medio",
        priority: "Media",
        reliability: "Alta",
        confidence: 0.9,
        simpleExplanation: "Il browser ha mostrato almeno un candidato WebRTC con indirizzo pubblico o reflexive leggibile da una pagina web.",
        privacyImpact: "Se non usi una VPN, questo e lo stesso IP pubblico che ogni sito vede gia dalla tua connessione: l'impatto aggiuntivo e limitato. Diventa un problema serio se usi una VPN o un proxy, perche WebRTC puo rivelare il tuo IP reale bypassando la protezione.",
        suggestedAction: "Se usi una VPN, valuta di limitare o disattivare WebRTC seguendo la guida per il tuo browser. Senza VPN, di norma non e un rischio aggiuntivo."
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

    const disabledResult = Object.assign({}, fallback, {
      state: "WebRTC disattivato",
      stateKey: "protected",
      functionalState: "WebRTC disattivato",
      functionalStateKey: "protected",
      riskLevel: "Basso",
      priority: "Bassa",
      reliability: "Alta",
      confidence: 0.9,
      simpleExplanation: "WebRTC risulta disattivato nel browser: nessun indirizzo puo essere esposto tramite questa tecnologia.",
      privacyImpact: "Con WebRTC disattivato l'esposizione dell'IP tramite WebRTC e nulla. Ricorda che cosi restano bloccate anche le chiamate e videochiamate dentro il browser.",
      suggestedAction: "Nessuna azione necessaria. Se ti servono le chiamate nel browser, potrai riattivare WebRTC dalle impostazioni.",
      candidateSummary: "WebRTC disattivato",
      sources: {
        webrtcApi: false,
        candidateGathering: false
      }
    });

    if (!RTCPeerConnectionConstructor) {
      return disabledResult;
    }

    // Con media.peerconnection.enabled=false (Firefox) il costruttore esiste ma
    // lancia un'eccezione alla costruzione: va letto come "disattivato", non come errore.
    try {
      const probeConnection = new RTCPeerConnectionConstructor();
      if (probeConnection && typeof probeConnection.close === "function") {
        probeConnection.close();
      }
    } catch (constructionError) {
      return disabledResult;
    }

    try {
      const candidates = await collectIceCandidates(RTCPeerConnectionConstructor);
      const evaluated = evaluateCandidates(candidates);
      return Object.assign({}, evaluated, {
        sources: {
          webrtcApi: true,
          candidateGathering: true
        },
        candidates
      });
    } catch (error) {
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
