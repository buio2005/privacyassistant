const THEME_KEY = "pca-theme";

function translate(key, fallback, variables) {
  const i18n = window.PCAI18n;
  if (i18n && typeof i18n.t === "function") {
    return i18n.t(key, fallback, variables);
  }

  return String(fallback).replace(/\{(\w+)\}/g, (_, variableName) => {
    return Object.prototype.hasOwnProperty.call(variables || {}, variableName)
      ? String(variables[variableName])
      : "";
  });
}

function isEnglishLanguage() {
  const i18n = window.PCAI18n;
  return Boolean(i18n && typeof i18n.isEnglish === "function" && i18n.isEnglish());
}

function localizeAvailability(value) {
  if (value === "Non disponibile" || value === "Not available") {
    return translate("common.notAvailable", "Non disponibile");
  }

  if (value === "Browser non riconosciuto" || value === "Browser not recognized") {
    return translate("common.browserNotRecognized", "Browser non riconosciuto");
  }

  if (value === "In attesa..." || value === "Waiting...") {
    return translate("common.waiting", "In attesa...");
  }

  if (value === "In calcolo..." || value === "Calculating...") {
    return translate("common.calculating", "In calcolo...");
  }

  return localizeKnownDashboardText(value);
}

function localizeDoNotTrackValue(value) {
  if (value === "Attivo" || value === "Enabled") {
    return isEnglishLanguage() ? "Enabled" : "Attivo";
  }
  if (value === "Disattivo" || value === "Disabled") {
    return isEnglishLanguage() ? "Disabled" : "Disattivo";
  }

  return localizeAvailability(value);
}

function localizeWebRtcState(value) {
  const stateMap = {
    Protetto: isEnglishLanguage() ? "Protected" : "Protetto",
    "Solo IP locale visibile": isEnglishLanguage() ? "Only Local IP Visible" : "Solo IP locale visibile",
    "mDNS attivo": isEnglishLanguage() ? "mDNS Active" : "mDNS attivo",
    "IP pubblico esposto": isEnglishLanguage() ? "Public IP Exposed" : "IP pubblico esposto",
    "Relay rilevato": isEnglishLanguage() ? "Relay Detected" : "Relay rilevato",
    "Configurazione da verificare": isEnglishLanguage() ? "Configuration To Verify" : "Configurazione da verificare",
    Protected: isEnglishLanguage() ? "Protected" : "Protetto",
    "Only Local IP Visible": isEnglishLanguage() ? "Only Local IP Visible" : "Solo IP locale visibile",
    "mDNS Active": isEnglishLanguage() ? "mDNS Active" : "mDNS attivo",
    "Public IP Exposed": isEnglishLanguage() ? "Public IP Exposed" : "IP pubblico esposto",
    "Relay Detected": isEnglishLanguage() ? "Relay Detected" : "Relay rilevato",
    "Configuration To Verify": isEnglishLanguage() ? "Configuration To Verify" : "Configurazione da verificare"
  };

  return stateMap[value] || localizeAvailability(value);
}

function localizeRiskLevel(value) {
  const riskMap = {
    Basso: isEnglishLanguage() ? "Low" : "Basso",
    Medio: isEnglishLanguage() ? "Medium" : "Medio",
    Alto: isEnglishLanguage() ? "High" : "Alto",
    Low: isEnglishLanguage() ? "Low" : "Basso",
    Medium: isEnglishLanguage() ? "Medium" : "Medio",
    High: isEnglishLanguage() ? "High" : "Alto"
  };

  return riskMap[value] || localizeAvailability(value);
}

function localizePriority(value) {
  const priorityMap = {
    Bassa: isEnglishLanguage() ? "Low" : "Bassa",
    Media: isEnglishLanguage() ? "Medium" : "Media",
    Alta: isEnglishLanguage() ? "High" : "Alta",
    Low: isEnglishLanguage() ? "Low" : "Bassa",
    Medium: isEnglishLanguage() ? "Medium" : "Media",
    High: isEnglishLanguage() ? "High" : "Alta"
  };

  return priorityMap[value] || localizeAvailability(value);
}

function localizeRecommendationPriorityLabel(value) {
  const priorityMap = {
    "Priorita Alta": translate("recommendation.priority.high", "Priorita Alta"),
    "Priorita Media": translate("recommendation.priority.medium", "Priorita Media"),
    "Priorita Bassa": translate("recommendation.priority.low", "Priorita Bassa"),
    "High Priority": translate("recommendation.priority.high", "Priorita Alta"),
    "Medium Priority": translate("recommendation.priority.medium", "Priorita Media"),
    "Low Priority": translate("recommendation.priority.low", "Priorita Bassa")
  };

  return priorityMap[value] || localizeKnownDashboardText(value);
}

function localizeRecommendationAudience(value) {
  if (value === "Generico" || value === "General") {
    return translate("recommendations.audience.generic", "Generico");
  }

  return localizeKnownDashboardText(value);
}

function localizePrivacyLevel(value) {
  const levelMap = {
    Base: isEnglishLanguage() ? "Base" : "Base",
    Buono: isEnglishLanguage() ? "Good" : "Buono",
    Avanzato: isEnglishLanguage() ? "Advanced" : "Avanzato",
    "Molto Avanzato": isEnglishLanguage() ? "Very Advanced" : "Molto Avanzato",
    Specializzato: isEnglishLanguage() ? "Specialized" : "Specializzato"
  };

  return levelMap[value] || localizeAvailability(value);
}

function getLocalizedPrivacyLevelDescription(privacyLevel) {
  const descriptionMap = {
    Base: translate("dashboard.sidebar.privacyDescription.base", "Browser generalista con protezioni privacy essenziali o dipendenti soprattutto dalla configurazione manuale."),
    Buono: translate("dashboard.sidebar.privacyDescription.good", "Browser con una base solida di protezione e possibilita concrete di miglioramento tramite impostazioni mirate."),
    Avanzato: translate("dashboard.sidebar.privacyDescription.advanced", "Browser orientato alla privacy con accorgimenti aggiuntivi rispetto ai browser mainstream."),
    "Molto Avanzato": translate("dashboard.sidebar.privacyDescription.veryAdvanced", "Browser pensato per ridurre la superficie di tracciamento con impostazioni piu aggressive."),
    Specializzato: translate("dashboard.sidebar.privacyDescription.specialized", "Browser costruito per scenari privacy particolarmente sensibili, con compromessi dedicati su compatibilita e UX.")
  };

  return descriptionMap[privacyLevel] || descriptionMap.Base;
}

function localizeScoreLevel(level) {
  const levelMap = {
    "Da migliorare": translate("privacy.level.needsImprovement", "Da migliorare"),
    Discreto: translate("privacy.level.fair", "Discreto"),
    Buono: translate("privacy.level.good", "Buono"),
    Ottimo: translate("privacy.level.excellent", "Ottimo"),
    "Needs Improvement": translate("privacy.level.needsImprovement", "Da migliorare"),
    Fair: translate("privacy.level.fair", "Discreto"),
    Good: translate("privacy.level.good", "Buono"),
    Excellent: translate("privacy.level.excellent", "Ottimo")
  };

  return levelMap[level] || level;
}

function localizeJourneyStateLabel(label, key) {
  const stateMap = {
    not_needed: translate("journey.state.notNeeded", "Non necessario"),
    ready_to_start: translate("journey.state.readyToStart", "Pronto a iniziare"),
    in_progress: translate("journey.state.inProgress", "In corso"),
    awaiting_verification: translate("journey.state.awaitingVerification", "In attesa di verifica"),
    stabilized: translate("journey.state.stabilized", "Stabilizzato")
  };

  return stateMap[key] || label || translate("common.notAvailable", "Non disponibile");
}

function localizeJourneyIntent(intent) {
  const intentMap = {
    improvement: translate("journey.intent.improvement", "Miglioramento"),
    correction: translate("journey.intent.correction", "Correzione"),
    maintenance: translate("journey.intent.maintenance", "Mantenimento")
  };

  return intentMap[intent] || translate("common.notAvailable", "Non disponibile");
}

function localizeJourneyKind(kind) {
  const kindMap = {
    blocking: translate("journey.kind.blocking", "Prioritario"),
    optional: translate("journey.kind.optional", "Opzionale"),
    maintenance: translate("journey.kind.maintenance", "Mantenimento")
  };

  return kindMap[kind] || translate("common.notAvailable", "Non disponibile");
}

function localizeJourneyBenefit(level) {
  const levelMap = {
    low: translate("journey.benefit.low", "Basso"),
    medium: translate("journey.benefit.medium", "Medio"),
    high: translate("journey.benefit.high", "Alto")
  };

  return levelMap[level] || translate("common.notAvailable", "Non disponibile");
}

function localizeJourneyVerificationStatus(status) {
  const statusMap = {
    verified: translate("journey.verification.verified", "Verificato"),
    not_applicable: translate("journey.verification.notApplicable", "Non applicabile"),
    not_verifiable: translate("journey.verification.notVerifiable", "Non verificabile"),
    not_available: translate("journey.verification.notAvailable", "Non disponibile")
  };

  return statusMap[status] || translate("common.notAvailable", "Non disponibile");
}

function localizeJourneyCompletionState(status) {
  const stateMap = {
    open: translate("journey.completion.open", "Aperto"),
    observed_complete: translate("journey.completion.observedComplete", "Completato in modo osservabile")
  };

  return stateMap[status] || translate("common.notAvailable", "Non disponibile");
}

function localizeOverallStateLabel(label, stateKey) {
  const labelMap = {
    molto_buona: translate("dashboard.intelligence.state.veryGood", "Molto Buona"),
    buona: translate("dashboard.intelligence.state.good", "Buona"),
    discreta: translate("dashboard.intelligence.state.fair", "Discreta"),
    da_migliorare: translate("dashboard.intelligence.state.needsImprovement", "Da Migliorare"),
    critica: translate("dashboard.intelligence.state.critical", "Critica")
  };
  const fallbackMap = {
    "Molto Buona": "molto_buona",
    Buona: "buona",
    Discreta: "discreta",
    "Da Migliorare": "da_migliorare",
    Critica: "critica"
  };
  const resolvedKey = stateKey || fallbackMap[label];

  return labelMap[resolvedKey] || label || translate("common.notAvailable", "Non disponibile");
}

function localizeConfidenceLevel(level) {
  const levelMap = {
    Bassa: translate("dashboard.intelligence.confidence.low", "Bassa"),
    Media: translate("dashboard.intelligence.confidence.medium", "Media"),
    Alta: translate("dashboard.intelligence.confidence.high", "Alta"),
    Low: translate("dashboard.intelligence.confidence.low", "Bassa"),
    Medium: translate("dashboard.intelligence.confidence.medium", "Media"),
    High: translate("dashboard.intelligence.confidence.high", "Alta")
  };

  return levelMap[level] || localizeAvailability(level);
}

function localizeSeverity(value) {
  const severityMap = {
    low: translate("dashboard.intelligence.severity.low", "Bassa"),
    medium: translate("dashboard.intelligence.severity.medium", "Media"),
    high: translate("dashboard.intelligence.severity.high", "Alta"),
    Low: translate("dashboard.intelligence.severity.low", "Bassa"),
    Medium: translate("dashboard.intelligence.severity.medium", "Media"),
    High: translate("dashboard.intelligence.severity.high", "Alta")
  };

  return severityMap[value] || localizeAvailability(value);
}

function localizeUserControl(value) {
  const controlMap = {
    none: translate("dashboard.intelligence.userControl.none", "Nullo"),
    low: translate("dashboard.intelligence.userControl.low", "Basso"),
    medium: translate("dashboard.intelligence.userControl.medium", "Medio"),
    high: translate("dashboard.intelligence.userControl.high", "Alto")
  };

  return controlMap[value] || translate("dashboard.intelligence.userControl.unknown", "Non definito");
}

function localizeRemediationStatus(value) {
  const remediationMap = {
    direct: translate("dashboard.intelligence.remediation.direct", "Intervento diretto"),
    indirect: translate("dashboard.intelligence.remediation.indirect", "Intervento indiretto"),
    external_tool: translate("dashboard.intelligence.remediation.externalTool", "Richiede strumento esterno"),
    not_remediable: translate("dashboard.intelligence.remediation.notRemediable", "Non correggibile direttamente"),
    not_applicable: translate("dashboard.intelligence.remediation.notApplicable", "Non applicabile")
  };

  return remediationMap[value] || translate("dashboard.intelligence.remediation.unknown", "Non definito");
}

function localizeBenefitLevel(benefitEstimate) {
  if (!benefitEstimate || benefitEstimate.status === "not_applicable") {
    return translate("dashboard.intelligence.benefit.notApplicable", "Non applicabile");
  }

  if (benefitEstimate.status !== "estimated" || !benefitEstimate.level) {
    return translate("dashboard.intelligence.benefit.notEstimated", "Non stimato");
  }

  const benefitMap = {
    low: translate("dashboard.intelligence.benefit.low", "Basso"),
    medium: translate("dashboard.intelligence.benefit.medium", "Medio"),
    high: translate("dashboard.intelligence.benefit.high", "Alto")
  };

  return benefitMap[benefitEstimate.level] || translate("dashboard.intelligence.benefit.notEstimated", "Non stimato");
}

const KNOWN_DASHBOARD_TEXT_TRANSLATIONS = {
  "Provider DNS non determinabile": "DNS provider not determinable",
  "Identificazione tramite catalogo provider": "Identified through provider catalog",
  "Identificazione tramite rete provider catalogata": "Identified through cataloged provider network",
  "Identificazione tramite hostname provider": "Identified through provider hostname",
  "Identificazione tramite firma catalogata": "Identified through cataloged signature",
  "Identificazione verificata dal provider": "Identification verified by the provider",
  "Nessuna corrispondenza": "No match",
  "Firma catalogata": "Cataloged signature",
  "Resolver orientato alla privacy con profili personalizzabili, blocco di tracker e funzioni di controllo molto granulari.": "Privacy-focused resolver with customizable profiles, tracker blocking, and very granular control features.",
  "Resolver molto diffuso e veloce, con una buona base privacy ma meno orientato alla personalizzazione rispetto ai provider specializzati.": "Widely used and fast resolver with a good privacy baseline, but less focused on customization than specialized providers.",
  "Resolver focalizzato su sicurezza e privacy, noto soprattutto per il blocco dei domini malevoli e per un'impostazione prudente.": "Resolver focused on security and privacy, especially known for blocking malicious domains and for a cautious default approach.",
  "Resolver orientato a privacy e filtraggio di ads e tracker, utile per ridurre molte richieste indesiderate gia a livello DNS.": "Privacy-focused resolver with ads and tracker filtering, useful for reducing many unwanted requests already at the DNS level.",
  "Resolver pubblico molto diffuso e affidabile sul piano operativo, ma meno focalizzato sulla minimizzazione dei dati rispetto ai provider privacy-first.": "Very widespread public resolver that is operationally reliable, but less focused on data minimization than privacy-first providers.",
  "Resolver avanzato con forte controllo sulle policy DNS, protezioni granulari e impostazione orientata a privacy e personalizzazione.": "Advanced resolver with strong control over DNS policies, granular protections, and a privacy- and customization-oriented setup.",
  "Resolver storico con funzioni di filtro e sicurezza, utile per controllo e stabilita ma non progettato primariamente come provider privacy-specializzato.": "Longstanding resolver with filtering and security features, useful for control and stability but not designed primarily as a privacy-specialized provider.",
  "Il browser non espone direttamente quale resolver DNS stia usando e in questa sessione non e stato possibile identificarlo con sufficiente affidabilita.": "The browser does not directly expose which DNS resolver it is using, and in this session it was not possible to identify it with sufficient reliability.",
  "Il browser non ha mostrato indirizzi WebRTC direttamente esposti durante questa analisi.": "The browser did not show any directly exposed WebRTC addresses during this analysis.",
  "L'impatto immediato sulla privacy appare ridotto, ma future verifiche potranno aggiungere correlazioni con VPN e DNS Leak Detection.": "The immediate privacy impact appears limited, but future checks may add correlations with VPN analysis and DNS Leak Detection.",
  "Mantieni questa configurazione stabile e ricontrolla il risultato quando verranno aggiunte analisi VPN e DNS leak.": "Keep this configuration stable and check the result again when VPN and DNS leak analyses are added.",
  "Nessun candidato WebRTC esposto": "No exposed WebRTC candidates",
  "Il browser ha mostrato almeno un candidato WebRTC con indirizzo pubblico o reflexive leggibile da una pagina web.": "The browser exposed at least one WebRTC candidate with a public or reflexive address readable from a web page.",
  "Questo e il caso piu rilevante per la privacy, perche un sito puo correlare meglio sessione, rete e dispositivo anche quando ti aspetti protezioni aggiuntive.": "This is the most relevant case for privacy because a site can better correlate session, network, and device even when you expect additional protections.",
  "Controlla le impostazioni WebRTC del browser e, quando disponibile, confronta questo risultato con VPN Protection Analysis e DNS Leak Detection.": "Check the browser WebRTC settings and, when available, compare this result with VPN Protection Analysis and DNS Leak Detection.",
  "Il browser non ha mostrato un IP pubblico, ma ha reso leggibili indirizzi locali o privati della rete interna.": "The browser did not expose a public IP, but it made local or private internal network addresses readable.",
  "L'impatto e intermedio: un sito puo comunque capire qualcosa in piu sulla tua rete locale o sulla struttura del dispositivo.": "The impact is intermediate: a site can still infer more about your local network or device structure.",
  "Verifica se il browser puo ridurre l'esposizione dei candidati host locali oppure se un profilo privacy piu rigido e compatibile con il tuo uso.": "Check whether the browser can reduce the exposure of local host candidates or whether a stricter privacy profile is compatible with your use case.",
  "Il browser ha mostrato solo candidati relay, senza IP pubblici o locali direttamente leggibili.": "The browser exposed only relay candidates, without directly readable public or local IPs.",
  "Questo e un segnale generalmente piu prudente, perche il traffico appare mediato da relay invece di esporre subito indirizzi di rete piu sensibili.": "This is generally a more cautious signal because traffic appears mediated by relays instead of immediately exposing more sensitive network addresses.",
  "Mantieni questa configurazione e ricontrolla il risultato se cambi browser, estensioni o impostazioni di rete.": "Keep this configuration and check the result again if you change browser, extensions, or network settings.",
  "Il browser sta mascherando i candidati host locali con nomi mDNS e non ha mostrato IP pubblici direttamente leggibili.": "The browser is masking local host candidates with mDNS names and did not expose directly readable public IPs.",
  "Questo riduce l'esposizione immediata degli indirizzi locali e rappresenta in genere un comportamento piu prudente lato browser.": "This reduces the immediate exposure of local addresses and generally reflects a more cautious browser behavior.",
  "Non serve intervenire subito. Mantieni attiva questa protezione e verifica solo se in futuro emergeranno anche IP pubblici o locali reali.": "There is no need to act immediately. Keep this protection enabled and only re-check if real public or local IPs emerge in the future.",
  "Durante questa analisi non sono emersi candidati WebRTC leggibili che mostrino dettagli di rete utili.": "During this analysis no readable WebRTC candidates emerged that reveal useful network details.",
  "La superficie di esposizione WebRTC appare limitata in questa sessione, anche se future verifiche potranno aggiungere controlli piu avanzati.": "The WebRTC exposure surface appears limited in this session, although future checks may add more advanced controls.",
  "Mantieni questa configurazione stabile e ricontrolla il risultato dopo aggiornamenti del browser o cambi di rete.": "Keep this configuration stable and check the result again after browser updates or network changes.",
  "Sono emersi candidati WebRTC, ma il pattern raccolto non rientra in uno scenario abbastanza chiaro per una lettura immediata.": "WebRTC candidates emerged, but the collected pattern does not fit a scenario clear enough for an immediate reading.",
  "Il risultato non indica automaticamente una forte esposizione, ma nemmeno una protezione chiara. Conviene considerarlo come configurazione da approfondire.": "The result does not automatically indicate strong exposure, but neither does it indicate clear protection. It is best treated as a configuration to investigate further.",
  "Ripeti il controllo in modo isolato e, se necessario, usa una diagnostica sviluppatore per capire meglio quali candidati vengono esposti.": "Repeat the check in isolation and, if needed, use developer diagnostics to better understand which candidates are being exposed.",
  "Il browser non espone l'API WebRTC necessaria a questa analisi oppure la funzione risulta disattivata.": "The browser does not expose the WebRTC API required for this analysis, or the feature is disabled.",
  "L'assenza dell'API riduce l'esposizione immediata, ma non permette una verifica completa del comportamento futuro in presenza di VPN o DNS leak.": "The absence of the API reduces immediate exposure, but it does not allow a complete verification of future behavior in the presence of VPNs or DNS leaks.",
  "Verifica se WebRTC e disattivato intenzionalmente oppure se il browser sta limitando questa analisi in modo compatibile con la tua configurazione.": "Check whether WebRTC is intentionally disabled or whether the browser is limiting this analysis in a way that matches your configuration.",
  "API WebRTC non disponibile": "WebRTC API not available",
  "La raccolta dei candidati WebRTC non si e conclusa correttamente in questa sessione.": "WebRTC candidate collection did not complete correctly in this session.",
  "Il risultato e da considerare prudenziale: la rilevazione non e stata abbastanza affidabile per confermare esposizione o protezione completa.": "The result should be considered precautionary: the detection was not reliable enough to confirm either exposure or full protection.",
  "Ripeti il controllo in una nuova sessione o dopo un refresh pulito per verificare se il comportamento resta coerente.": "Repeat the check in a new session or after a clean refresh to confirm whether the behavior remains consistent.",
  "Raccolta candidati non riuscita": "Candidate collection failed",
  "Base privacy del browser": "Browser privacy baseline",
  "Il segnale deriva dal profilo privacy attribuito al browser rilevato dal modulo Browser Detection.": "This signal comes from the privacy profile assigned to the detected browser by the Browser Detection module.",
  "Famiglia tecnica del browser": "Browser technical family",
  "Usa questa informazione come contesto: la famiglia browser influisce sulla base di partenza, ma non sostituisce le altre verifiche.": "Use this information as context: the browser family influences the starting point, but it does not replace the other checks.",
  "Il segnale descrive la famiglia tecnica del browser e aiuta a contestualizzare compatibilita, base privacy e margini di miglioramento.": "This signal describes the browser technical family and helps contextualize compatibility, privacy baseline, and room for improvement.",
  "Aggiornamento del browser": "Browser update status",
  "Il segnale usa la versione principale e la famiglia browser per stimare se il browser appare aggiornato rispetto a soglie informative del progetto.": "This signal uses the major version and the browser family to estimate whether the browser appears up to date against the project's informational thresholds.",
  "Preferenza Do Not Track": "Do Not Track preference",
  "Il segnale deriva dalla preferenza DNT esposta dal browser al modulo Network Detection.": "This signal comes from the DNT preference exposed by the browser to the Network Detection module.",
  "Visibilita dello stack IP": "IP stack visibility",
  "Usa questo segnale come contesto di esposizione di rete, senza interpretarlo da solo come problema principale.": "Use this signal as network exposure context, without interpreting it alone as the main issue.",
  "Il segnale descrive quali indirizzi pubblici risultano osservabili nella sessione corrente.": "This signal describes which public addresses are observable in the current session.",
  "Specificita della lingua browser": "Browser language specificity",
  "Il segnale misura se il browser espone una lingua generica o una locale piu specifica.": "This signal measures whether the browser exposes a generic language or a more specific local one.",
  "Specificita del fuso orario": "Timezone specificity",
  "Il segnale descrive quanto il fuso orario dichiarato puo contribuire al profilo ambientale esposto.": "This signal describes how much the declared timezone can contribute to the exposed environmental profile.",
  "Comuniata della risoluzione schermo": "Screen resolution commonness",
  "Usa questo segnale come contesto del profilo ambientale, non come intervento prioritario isolato.": "Use this signal as environmental profile context, not as an isolated priority action.",
  "Il segnale stima se la risoluzione osservata appare comune o piu particolare rispetto ai profili piu diffusi.": "This signal estimates whether the observed resolution appears common or more unusual compared with widely used profiles.",
  "Qualita privacy del provider DNS": "DNS provider privacy quality",
  "Il segnale deriva dal provider DNS rilevato e dalla qualita privacy informativa associata nel catalogo del progetto.": "This signal comes from the detected DNS provider and from the informational privacy quality associated with it in the project catalog.",
  "Affidabilita della rilevazione DNS": "DNS detection reliability",
  "Usa questo segnale per pesare correttamente il valore del risultato DNS dentro la lettura complessiva.": "Use this signal to correctly weight the value of the DNS result within the overall reading.",
  "Il segnale non giudica il provider in se, ma quanto la rilevazione appare affidabile in questa sessione.": "This signal does not judge the provider itself, but rather how reliable the detection appears in this session.",
  "Stato funzionale WebRTC": "WebRTC functional state",
  "Il segnale deriva dallo stato funzionale WebRTC gia interpretato dal modulo dedicato, senza introdurre ulteriori decisioni trasversali.": "This signal comes from the WebRTC functional state already interpreted by the dedicated module, without introducing additional cross-cutting decisions.",
  "Osservazione di indirizzi pubblici WebRTC": "WebRTC public address observation",
  "Il segnale descrive l'evidenza tecnica piu forte raccolta dai candidati WebRTC: la presenza o meno di indirizzi pubblici.": "This signal describes the strongest technical evidence gathered from WebRTC candidates: whether public addresses are present or not.",
  "Mascheramento mDNS WebRTC": "WebRTC mDNS masking",
  "Usa questo segnale per capire se il browser sta mascherando parte delle informazioni locali WebRTC.": "Use this signal to understand whether the browser is masking part of the local WebRTC information.",
  "Il segnale descrive una evidenza tecnica utile per distinguere esposizione reale da mascheramento locale tramite mDNS.": "This signal describes technical evidence useful for distinguishing real exposure from local masking through mDNS.",
  "Fascia del Privacy Score": "Privacy Score band",
  "Usa il punteggio come sintesi del contesto, non come unico criterio di giudizio.": "Use the score as contextual synthesis, not as the only evaluation criterion.",
  "Il segnale normalizza il punteggio complessivo generato dal Privacy Score Engine.": "This signal normalizes the overall score generated by the Privacy Score Engine.",
  "Il segnale deriva da un fattore gia calcolato dal Privacy Score Engine e lo rende confrontabile con gli altri moduli del progetto.": "This signal comes from a factor already calculated by the Privacy Score Engine and makes it comparable with the other project modules.",
  "Se vuoi ridurre il rischio, controlla le impostazioni WebRTC del browser o della configurazione privacy che stai usando.": "If you want to reduce the risk, review the browser WebRTC settings or the privacy configuration you are using.",
  "Usa questa informazione come contesto: la famiglia browser influisce sulla base di partenza, ma non sostituisce le altre verifiche.": "Use this information as context: the browser family affects the starting point, but it does not replace the other checks.",
  "Usa questo segnale come contesto di esposizione di rete, senza interpretarlo da solo come problema principale.": "Use this signal as network exposure context, without interpreting it on its own as the main issue.",
  "Usa questo segnale come contesto del profilo ambientale, non come intervento prioritario isolato.": "Use this signal as environmental profile context, not as an isolated priority action.",
  "Usa questo segnale per pesare correttamente il valore del risultato DNS dentro la lettura complessiva.": "Use this signal to correctly weigh the DNS result within the overall reading.",
  "Usa questo segnale per capire se il browser sta mascherando parte delle informazioni locali WebRTC.": "Use this signal to understand whether the browser is masking part of the local WebRTC information."
};

function localizeKnownDashboardText(value) {
  if (!isEnglishLanguage() || typeof value !== "string") {
    return value;
  }

  if (Object.prototype.hasOwnProperty.call(KNOWN_DASHBOARD_TEXT_TRANSLATIONS, value)) {
    return KNOWN_DASHBOARD_TEXT_TRANSLATIONS[value];
  }

  let match = value.match(/^Candidati raccolti: (\d+)\. Sono visibili indirizzi locali: (.+)\.$/);
  if (match) {
    return `Candidates collected: ${match[1]}. Visible local addresses: ${match[2]}.`;
  }

  match = value.match(/^Candidati raccolti: (\d+)\. Sono emersi hostname mDNS mascherati: (.+)\.$/);
  if (match) {
    return `Candidates collected: ${match[1]}. Masked mDNS hostnames detected: ${match[2]}.`;
  }

  match = value.match(/^Candidati raccolti: (\d+)\. Sono emersi candidati relay senza IP pubblici direttamente leggibili\.$/);
  if (match) {
    return `Candidates collected: ${match[1]}. Relay candidates detected without directly readable public IPs.`;
  }

  match = value.match(/^IP (.+) catalogato$/);
  if (match) {
    return `Cataloged IP for ${match[1]}`;
  }

  match = value.match(/^Rete (.+) osservata$/);
  if (match) {
    return `Observed network: ${match[1]}`;
  }

  match = value.match(/^Firma (.+)$/);
  if (match) {
    return `Signature: ${match[1]}`;
  }

  return value;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatConfidenceValue(confidence) {
  const overallConfidence = confidence && typeof confidence.overallConfidence === "number"
    ? Math.round(confidence.overallConfidence * 100)
    : 0;
  const normalizedOverallConfidence = overallConfidence / 100;
  const derivedLevel = normalizedOverallConfidence >= 0.85
    ? "Alta"
    : normalizedOverallConfidence >= 0.65
      ? "Media"
      : "Bassa";
  const level = localizeConfidenceLevel(derivedLevel);

  return translate("dashboard.intelligence.format.confidence", "{level} ({percent}%)", {
    level,
    percent: overallConfidence
  });
}

function getReadableRootCauseLabel(rootCauseId) {
  const rootCauseDefinition = ROOT_CAUSE_LABEL_MAP[rootCauseId];

  if (!rootCauseDefinition) {
    return translate("dashboard.intelligence.rootCause.generic", "Causa funzionale non classificata");
  }

  return translate(rootCauseDefinition.key, rootCauseDefinition.fallback);
}

function getOverallStateDescription(stateKey) {
  const descriptionMap = {
    molto_buona: translate("dashboard.intelligence.stateDescription.veryGood", "La configurazione appare molto solida e non emergono cause funzionali negative dominanti."),
    buona: translate("dashboard.intelligence.stateDescription.good", "La configurazione e complessivamente positiva, con poche aree che richiedono solo attenzione ordinaria."),
    discreta: translate("dashboard.intelligence.stateDescription.fair", "La configurazione e utilizzabile, ma mostra segnali misti che meritano una lettura prudente."),
    da_migliorare: translate("dashboard.intelligence.stateDescription.needsImprovement", "La configurazione mostra una criticita principale ma non un quadro complessivamente compromesso."),
    critica: translate("dashboard.intelligence.stateDescription.critical", "La configurazione mostra piu criticita indipendenti o un quadro generale che richiede attenzione prioritaria.")
  };

  return descriptionMap[stateKey] || translate("dashboard.intelligence.stateDescription.fair", "La configurazione e utilizzabile, ma mostra segnali misti che meritano una lettura prudente.");
}

function getOverallStateTone(stateKey) {
  if (stateKey === "molto_buona" || stateKey === "buona") {
    return "success";
  }

  if (stateKey === "discreta") {
    return "info";
  }

  if (stateKey === "critica") {
    return "danger";
  }

  return "warning";
}

function buildRootCauseLookup(rootCauseState) {
  const createdRootCauses = rootCauseState && Array.isArray(rootCauseState.createdRootCauses)
    ? rootCauseState.createdRootCauses
    : [];

  return createdRootCauses.reduce((accumulator, item) => {
    if (item && item.rootCauseId) {
      accumulator[item.rootCauseId] = item;
    }
    return accumulator;
  }, {});
}

function formatRootCauseList(rootCauseIds) {
  const uniqueLabels = Array.from(new Set((rootCauseIds || []).map((rootCauseId) => getReadableRootCauseLabel(rootCauseId))));

  if (!uniqueLabels.length) {
    return translate("dashboard.intelligence.common.none", "nessuna causa rilevante");
  }

  return uniqueLabels.join(", ");
}

function formatSignalLabel(signalReference) {
  if (!signalReference) {
    return translate("dashboard.intelligence.common.signalUnavailable", "Segnale non disponibile");
  }

  const title = localizeKnownDashboardText(
    signalReference.title || translate("dashboard.intelligence.common.signalUnavailable", "Segnale non disponibile")
  );
  return signalReference.signalId
    ? `${title} (${signalReference.signalId})`
    : title;
}

function getSignalNarrative(signalReference, fallback) {
  if (!signalReference) {
    return fallback;
  }

  const narrative = signalReference.rationale
    || signalReference.suggestedAction
    || (Array.isArray(signalReference.evidence) && signalReference.evidence.length > 0 ? signalReference.evidence[0] : "")
    || fallback;

  return localizeKnownDashboardText(narrative);
}

function renderMetaGrid(items) {
  return `
    <div class="row g-2 mt-1 intelligence-meta-grid">
      ${items.map((item) => `
        <div class="col-sm-6 col-xl-4">
          <div class="soft-box intelligence-meta-item h-100">
            <span class="summary-label">${escapeHtml(item.label)}</span>
            <strong class="d-block mt-1">${escapeHtml(item.value)}</strong>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function localizePhaseStepLabel(index) {
  return translate("analysis.phase.step", `Fase ${index + 1}/${ANALYSIS_PHASES.length}`, {
    current: index + 1,
    total: ANALYSIS_PHASES.length
  });
}

function getLocalizedPhaseTitle(phaseKey, fallback) {
  const titleKeyMap = {
    browser: "analysis.phase.browser.title",
    connection: "analysis.phase.connection.title",
    dns: "analysis.phase.dns.title",
    privacy: "analysis.phase.privacy.title",
    report: "analysis.phase.report.title"
  };

  return translate(titleKeyMap[phaseKey] || phaseKey, fallback);
}

function getLocalizedPhaseDescription(phaseKey, fallback) {
  const descriptionKeyMap = {
    browser: "analysis.phase.browser.description",
    connection: "analysis.phase.connection.description",
    dns: "analysis.phase.dns.description",
    privacy: "analysis.phase.privacy.description",
    report: "analysis.phase.report.description"
  };

  return translate(descriptionKeyMap[phaseKey] || phaseKey, fallback);
}

const FALLBACK_BROWSER_ENVIRONMENT = {
  browser: "Browser non riconosciuto",
  version: "Non disponibile",
  os: "Non disponibile",
  architecture: "Non disponibile",
  family: "Non disponibile",
  privacyLevel: "Base",
  browserId: "unknown",
  sources: {
    userAgent: true,
    userAgentData: false,
    highEntropyValues: false,
    braveApi: false
  }
};

const PRIVACY_LEVEL_DESCRIPTIONS = {
  Base: "Browser generalista con protezioni privacy essenziali o dipendenti soprattutto dalla configurazione manuale.",
  Buono: "Browser con una base solida di protezione e possibilita concrete di miglioramento tramite impostazioni mirate.",
  Avanzato: "Browser orientato alla privacy con accorgimenti aggiuntivi rispetto ai browser mainstream.",
  "Molto Avanzato": "Browser pensato per ridurre la superficie di tracciamento con impostazioni piu aggressive.",
  Specializzato: "Browser costruito per scenari privacy particolarmente sensibili, con compromessi dedicati su compatibilita e UX."
};

const PRIVACY_LEVEL_TONES = {
  Base: "warning",
  Buono: "info",
  Avanzato: "success",
  "Molto Avanzato": "success",
  Specializzato: "success"
};

const DASHBOARD_STATIC_DATA = {
  nextSteps: [
    "Verifica il browser rilevato e controlla che corrisponda a quello che stai usando.",
    "Controlla i nuovi dati di rete e dispositivo per capire quante informazioni ambientali sono visibili ai siti.",
    "Apri le Raccomandazioni Personalizzate e usa il Centro Ottimizzazione Privacy per partire dalle priorita piu utili."
  ]
};

const ANALYSIS_PHASES = [
  {
    key: "browser",
    title: "Rilevamento Browser",
    description: "Identifico browser, versione, sistema operativo e famiglia browser disponibili."
  },
  {
    key: "connection",
    title: "Analisi Connessione",
    description: "Preparo il flusso di analisi della connessione e le future verifiche di rete."
  },
  {
    key: "dns",
    title: "Analisi DNS",
    description: "Raccolgo un'istantanea del resolver DNS visto dal browser e provo a riconoscere il provider."
  },
  {
    key: "webrtc",
    title: "Analisi WebRTC",
    description: "Verifico se il browser espone candidati WebRTC che possono rivelare dettagli di rete locali o pubblici."
  },
  {
    key: "privacy",
    title: "Controlli Privacy",
    description: "Allineo il profilo browser rilevato con il livello privacy informativo disponibile."
  },
  {
    key: "report",
    title: "Preparazione Report",
    description: "Compongo il report finale e apro la dashboard con i risultati disponibili."
  }
];

const FALLBACK_NETWORK_ENVIRONMENT = {
  ipv4: "Non disponibile",
  ipv6: "Non disponibile",
  browserLanguage: "Non disponibile",
  timezone: "Non disponibile",
  screenResolution: "Non disponibile",
  doNotTrack: "Non disponibile",
  sources: {
    ipLookup: false,
    browserLanguage: false,
    timezone: false,
    screen: false,
    doNotTrack: false
  }
};

const FALLBACK_DNS_ENVIRONMENT = {
  provider: "Provider DNS non determinabile",
  providerId: "unknown",
  privacyLevel: "Non disponibile",
  description: "Il browser non espone direttamente il resolver DNS in uso e in questa sessione non e stato possibile identificarlo con sufficiente affidabilita.",
  reliability: "Bassa",
  confidence: 0.24,
  determination: "not_determinable",
  identificationMethod: "not_determinable",
  identificationMethodLabel: "Provider DNS non determinabile",
  matchedSignatureLabel: "Nessuna corrispondenza",
  matchedSignatureValue: "Non disponibile",
  resolverSnapshot: "Non disponibile",
  resolverSourceIp: "Non disponibile",
  sources: {
    resolverSnapshot: false
  },
  debug: {
    observedResolver: "Non disponibile",
    sourceIpObserved: "Non disponibile",
    identificationMethod: "Provider DNS non determinabile",
    signatureFound: "Nessuna corrispondenza",
    providerCandidate: "Nessuna corrispondenza",
    confidenceLevel: "Bassa"
  },
  futureSignals: [
    "DNSSEC",
    "DNS Leak Detection",
    "DoH Detection"
  ]
};

const FALLBACK_WEBRTC_ENVIRONMENT = {
  state: "Protetto",
  stateKey: "protected",
  functionalState: "Protetto",
  functionalStateKey: "protected",
  riskLevel: "Basso",
  priority: "Bassa",
  simpleExplanation: "Il browser non ha mostrato indirizzi WebRTC direttamente esposti durante questa sessione.",
  privacyImpact: "L'impatto immediato appare ridotto, ma il dato non sostituisce future verifiche dedicate a VPN Protection Analysis e DNS Leak Detection.",
  suggestedAction: "Mantieni questa configurazione stabile e ricontrolla il risultato quando saranno disponibili analisi aggiuntive.",
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

const FALLBACK_PRIVACY_SCORE = {
  score: 50,
  maxScore: 100,
  progress: 50,
  level: "Discreto",
  factors: [],
  futureSignals: [
    "DNSSEC",
    "DNS Leak Detection",
    "DoH Detection",
    "VPN Protection Analysis"
  ]
};

const FALLBACK_RECOMMENDATIONS = {
  recommendations: [
    {
      id: "generic-review",
      priority: "Priorita Media",
      title: "Rivedi la configurazione privacy del browser",
      description: "In assenza di dati completi, il consiglio migliore e partire dalle impostazioni privacy e sicurezza del browser in uso.",
      howTo: "Apri le impostazioni del browser e controlla tracciamento, cookie, permessi sito e raccolta dati.",
      audience: "Generico"
    }
  ],
  futureIntegrations: [
    "DNSSEC",
    "DNS Leak Detection",
    "DoH Detection",
    "VPN Protection Analysis",
    "Guided Fix Assistant"
  ]
};

const FALLBACK_PRIVACY_INTELLIGENCE_SIGNALS = {
  contractName: "privacy-signal-contract",
  contractVersion: "0.8.6",
  generatedAt: "",
  metadata: {
    contractName: "privacy-signal-contract",
    contractVersion: "0.8.6",
    signalCount: 0,
    groupedCounts: {},
    futureSignalAdapters: [
      "VPN Protection Analysis",
      "DNS Leak Detection",
      "DNSSEC",
      "Guided Privacy Assistant"
    ]
  },
  context: {
    browserEnvironment: FALLBACK_BROWSER_ENVIRONMENT,
    networkEnvironment: FALLBACK_NETWORK_ENVIRONMENT,
    dnsEnvironment: FALLBACK_DNS_ENVIRONMENT,
    webrtcEnvironment: FALLBACK_WEBRTC_ENVIRONMENT,
    privacyScore: FALLBACK_PRIVACY_SCORE
  },
  signals: [],
  validation: {
    valid: true,
    contractName: "privacy-signal-contract",
    contractVersion: "0.8.6",
    signalCount: 0,
    errors: []
  }
};

const FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS = {
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
      dominantNegativeSignalIds: [],
      dominantPositiveSignalIds: [],
      strengthSignalIds: []
    },
    mainIssue: null,
    strengths: [],
    priorityAction: null
  }
};

const FALLBACK_PRIVACY_ROOT_CAUSES = {
  catalogVersion: "0.8.2",
  generatedAt: "",
  basedOnContractVersion: "0.8.6",
  catalog: [],
  signalToRootCauseMap: {},
  createdRootCauses: [],
  excludedSignals: [],
  validation: {
    valid: true,
    signalCount: 0,
    groupedSignalCount: 0,
    excludedSignalCount: 0,
    createdRootCauseCount: 0,
    errors: []
  }
};

const FALLBACK_PRIVACY_JOURNEY = {
  version: "0.8.3",
  basedOnAnalysisVersion: "0.8.2",
  createdAt: "",
  status: "degraded",
  entryContext: {
    overallStateKey: "discreta",
    overallStateLabel: "Discreta",
    overallConfidenceLevel: "Bassa",
    mainIssueSignalId: null,
    mainIssueRootCauseId: null,
    priorityActionSignalId: null,
    priorityActionRootCauseId: null,
    strengthRootCauseIds: [],
    negativeRootCauseIds: [],
    positiveRootCauseIds: [],
    neutralRootCauseIds: []
  },
  journeyState: {
    key: "not_needed",
    label: "Non necessario",
    progressIntent: "improvement",
    progressRatio: 0,
    observedCompletedPrimarySteps: 0,
    totalPrimarySteps: 0,
    verificationStatus: "not_applicable",
    maxVisibleSteps: 4
  },
  steps: [],
  optionalSteps: [],
  deferredRecommendations: [],
  nonApplicableSteps: [],
  reasoning: {
    journeyEntryReason: "Journey non disponibile.",
    orderingReason: "Nessun ordinamento disponibile.",
    exclusionReason: "Nessuna esclusione disponibile.",
    verificationReason: "Nessuna verifica disponibile."
  },
  diagnostics: {
    availableRecommendationCount: 0,
    selectedPrimaryStepCount: 0,
    optionalStepCount: 0,
    deferredRecommendationCount: 0,
    nonApplicableStepCount: 0,
    warnings: ["Journey engine non disponibile."]
  }
};

const FALLBACK_PRIVACY_JOURNEY_VALIDATION = {
  valid: false,
  errors: ["Journey engine non disponibile."],
  warnings: [],
  stepCount: 0,
  optionalStepCount: 0,
  deferredRecommendationCount: 0,
  nonApplicableStepCount: 0
};

const PRIVACY_SCORE_LEVEL_DESCRIPTIONS = {
  "Da migliorare": "La configurazione attuale espone diversi elementi che meritano attenzione e miglioramenti prioritari.",
  Discreto: "La configurazione mostra una base sufficiente, ma ci sono ancora margini chiari di miglioramento.",
  Buono: "La configurazione e gia orientata a una buona privacy per un utilizzo quotidiano.",
  Ottimo: "La configurazione attuale mostra segnali molto positivi rispetto ai dati oggi disponibili."
};

const RECOMMENDATION_PRIORITY_TONES = {
  "Priorita Alta": "warning",
  "Priorita Media": "info",
  "Priorita Bassa": "success"
};

const ROOT_CAUSE_LABEL_MAP = {
  browser_foundation_quality: {
    key: "dashboard.intelligence.rootCause.browserFoundation",
    fallback: "Qualita della base browser"
  },
  dns_resolver_quality: {
    key: "dashboard.intelligence.rootCause.dnsResolver",
    fallback: "Protezione DNS"
  },
  webrtc_exposure_control: {
    key: "dashboard.intelligence.rootCause.webrtcExposure",
    fallback: "Controllo dell'esposizione WebRTC"
  },
  network_tracking_preference: {
    key: "dashboard.intelligence.rootCause.trackingPreference",
    fallback: "Preferenza Do Not Track"
  },
  network_profile_specificity: {
    key: "dashboard.intelligence.rootCause.networkProfile",
    fallback: "Specificita del profilo di rete"
  },
  privacy_score_context: {
    key: "dashboard.intelligence.rootCause.privacyScoreContext",
    fallback: "Contesto del Privacy Score"
  }
};

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  const themeLabel = document.querySelector("[data-theme-label]");

  if (themeLabel) {
    themeLabel.textContent = theme === "dark"
      ? translate("theme.lightMode", "Light mode")
      : translate("theme.darkMode", "Dark mode");
  }
}

function initThemeToggle() {
  applyTheme(getPreferredTheme());

  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

function initActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll("[data-nav-link]");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === currentPage;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function createStatusPill(tone) {
  const pill = document.createElement("span");
  const resolvedTone = tone || "info";
  pill.className = `status-pill status-${resolvedTone}`;
  pill.textContent = resolvedTone === "success"
    ? translate("status.success", "Stabile")
    : resolvedTone === "warning"
      ? translate("status.warning", "Attenzione")
      : translate("status.info", "Info");
  return pill;
}

function getResultToneClass(tone) {
  const resolvedTone = tone || "info";
  return `result-tone result-tone-${resolvedTone}`;
}

const CHECK_STATUS_META = {
  success: { key: "success", label: "OK" },
  warning: { key: "warning", label: "Attenzione" },
  danger: { key: "danger", label: "Critico" },
  info: { key: "info", label: "Informativo" },
  neutral: { key: "neutral", label: "Non applicabile" },
  pending: { key: "pending", label: "In verifica" }
};

function getCheckStatusMeta(tone) {
  return CHECK_STATUS_META[tone] || CHECK_STATUS_META.info;
}

function buildCheckStatusMarkup(tone) {
  const meta = getCheckStatusMeta(tone);
  const label = translate(`check.status.${meta.key}`, meta.label);
  return `<span class="check-status check-status-${meta.key}"><span class="check-status-dot"></span>${label}</span>`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function getBrowserEnvironment() {
  const detector = window.PrivacyBrowserDetection;
  if (!detector || typeof detector.detectBrowserEnvironment !== "function") {
    return FALLBACK_BROWSER_ENVIRONMENT;
  }

  try {
    return await detector.detectBrowserEnvironment();
  } catch (error) {
    return FALLBACK_BROWSER_ENVIRONMENT;
  }
}

async function getNetworkEnvironment() {
  const detector = window.PrivacyNetworkDetection;
  if (!detector || typeof detector.detectNetworkEnvironment !== "function") {
    return FALLBACK_NETWORK_ENVIRONMENT;
  }

  try {
    return await detector.detectNetworkEnvironment();
  } catch (error) {
    return FALLBACK_NETWORK_ENVIRONMENT;
  }
}

async function getDnsEnvironment() {
  const detector = window.PrivacyDnsDetection;
  if (!detector || typeof detector.detectDnsEnvironment !== "function") {
    return FALLBACK_DNS_ENVIRONMENT;
  }

  try {
    return await detector.detectDnsEnvironment();
  } catch (error) {
    return FALLBACK_DNS_ENVIRONMENT;
  }
}

async function getWebRtcEnvironment() {
  const detector = window.PrivacyWebRtcDetection;
  if (!detector || typeof detector.detectWebRtcEnvironment !== "function") {
    return FALLBACK_WEBRTC_ENVIRONMENT;
  }

  try {
    return await detector.detectWebRtcEnvironment();
  } catch (error) {
    return FALLBACK_WEBRTC_ENVIRONMENT;
  }
}

async function getDnsLeakEnvironment(dnsEnvironment) {
  const detector = window.PrivacyDnsLeakDetection;
  if (!detector || typeof detector.analyzeDnsLeak !== "function") {
    return {};
  }

  try {
    return await detector.analyzeDnsLeak({ dnsEnvironment });
  } catch (error) {
    return {};
  }
}

async function getDnsSecurityEnvironment(dnsEnvironment) {
  const detector = window.PrivacyDnsSecurity;
  if (!detector || typeof detector.analyzeDnsSecurity !== "function") {
    return {};
  }

  try {
    return await detector.analyzeDnsSecurity({ dnsEnvironment });
  } catch (error) {
    return {};
  }
}

async function getVpnEnvironment() {
  const detector = window.PrivacyVpnDetection;
  if (!detector || typeof detector.analyzeVpnPresence !== "function") {
    return {};
  }

  try {
    return await detector.analyzeVpnPresence({});
  } catch (error) {
    return {};
  }
}

function getPrivacyScore(browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment) {
  const engine = window.PrivacyScoreEngine;
  if (!engine || typeof engine.detectPrivacyScore !== "function") {
    return FALLBACK_PRIVACY_SCORE;
  }

  try {
    return engine.detectPrivacyScore(browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment);
  } catch (error) {
    return FALLBACK_PRIVACY_SCORE;
  }
}

function getRecommendations(browserEnvironment, privacyScore) {
  const engine = window.PrivacyRecommendationEngine;
  if (!engine || typeof engine.detectRecommendations !== "function") {
    return FALLBACK_RECOMMENDATIONS;
  }

  try {
    return engine.detectRecommendations(browserEnvironment, privacyScore);
  } catch (error) {
    return FALLBACK_RECOMMENDATIONS;
  }
}

let privacyJourneyEngineLoadPromise = null;

function loadPrivacyJourneyEngine() {
  if (window.PrivacyJourneyEngine && typeof window.PrivacyJourneyEngine.buildPrivacyJourney === "function") {
    return Promise.resolve(true);
  }

  if (privacyJourneyEngineLoadPromise) {
    return privacyJourneyEngineLoadPromise;
  }

  privacyJourneyEngineLoadPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[data-pca-journey-engine="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "assets/js/privacy-journey-engine.js";
    script.async = true;
    script.dataset.pcaJourneyEngine = "true";
    script.addEventListener("load", () => resolve(true), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
    document.head.appendChild(script);
  });

  return privacyJourneyEngineLoadPromise;
}

function getPrivacyIntelligenceSignals(context) {
  const engine = window.PrivacyIntelligenceEngine;
  if (!engine || typeof engine.normalizeSignals !== "function") {
    return FALLBACK_PRIVACY_INTELLIGENCE_SIGNALS;
  }

  try {
    return engine.normalizeSignals(context);
  } catch (error) {
    return FALLBACK_PRIVACY_INTELLIGENCE_SIGNALS;
  }
}

function storePrivacyIntelligenceSignals(signalState, contextName) {
  window.PCAPrivacyIntelligenceSignals = signalState;
  window.PCAPrivacyIntelligenceSignalsContext = contextName || "generic";
  window.PCAPrivacyIntelligenceSignalsValidation = signalState && signalState.validation
    ? signalState.validation
    : FALLBACK_PRIVACY_INTELLIGENCE_SIGNALS.validation;
}

function getPrivacyRootCausesFromStoredSignals() {
  const engine = window.PrivacyIntelligenceEngine;
  const storedSignals = window.PCAPrivacyIntelligenceSignals;
  if (!engine || typeof engine.buildRootCauseGroups !== "function" || !storedSignals) {
    return FALLBACK_PRIVACY_ROOT_CAUSES;
  }

  try {
    return engine.buildRootCauseGroups(storedSignals);
  } catch (error) {
    return FALLBACK_PRIVACY_ROOT_CAUSES;
  }
}

function storePrivacyRootCauses(rootCauseState, contextName) {
  window.PCAPrivacyRootCauses = rootCauseState || FALLBACK_PRIVACY_ROOT_CAUSES;
  window.PCAPrivacyRootCausesContext = contextName || "generic";
  window.PCAPrivacyRootCausesValidation = rootCauseState && rootCauseState.validation
    ? rootCauseState.validation
    : FALLBACK_PRIVACY_ROOT_CAUSES.validation;
}

function getPrivacyIntelligenceAnalysisFromStoredSignals() {
  const engine = window.PrivacyIntelligenceEngine;
  const storedSignals = window.PCAPrivacyIntelligenceSignals;
  if (!engine || typeof engine.analyzeNormalizedDataset !== "function" || !storedSignals) {
    return FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  }

  try {
    return engine.analyzeNormalizedDataset(storedSignals);
  } catch (error) {
    return FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  }
}

function storePrivacyIntelligenceAnalysis(analysisState, contextName) {
  window.PCAPrivacyIntelligenceAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  window.PCAPrivacyIntelligenceAnalysisContext = contextName || "generic";
}

async function getPrivacyJourneyState(analysisState, rootCauseState, recommendationsState) {
  const moduleReady = await loadPrivacyJourneyEngine();
  const engine = window.PrivacyJourneyEngine;
  if (!moduleReady || !engine || typeof engine.buildPrivacyJourney !== "function" || typeof engine.validatePrivacyJourney !== "function") {
    return {
      journey: FALLBACK_PRIVACY_JOURNEY,
      validation: FALLBACK_PRIVACY_JOURNEY_VALIDATION
    };
  }

  try {
    const journey = engine.buildPrivacyJourney({
      analysis: analysisState,
      rootCauses: rootCauseState,
      recommendations: recommendationsState
    });
    const validation = engine.validatePrivacyJourney(journey);

    return {
      journey: validation.valid ? journey : FALLBACK_PRIVACY_JOURNEY,
      validation
    };
  } catch (error) {
    return {
      journey: FALLBACK_PRIVACY_JOURNEY,
      validation: {
        valid: false,
        errors: [error && error.message ? error.message : "Journey engine execution failed."],
        warnings: [],
        stepCount: 0,
        optionalStepCount: 0,
        deferredRecommendationCount: 0,
        nonApplicableStepCount: 0
      }
    };
  }
}

function storePrivacyJourney(journeyState, validationState, contextName) {
  window.PCAPrivacyJourney = journeyState || FALLBACK_PRIVACY_JOURNEY;
  window.PCAPrivacyJourneyValidation = validationState || FALLBACK_PRIVACY_JOURNEY_VALIDATION;
  window.PCAPrivacyJourneyContext = contextName || "generic";
}

function getWebRtcTone(webrtcEnvironment) {
  const stateKey = webrtcEnvironment && webrtcEnvironment.stateKey ? webrtcEnvironment.stateKey : "protected";

  if (stateKey === "public_ip_exposed" || stateKey === "verify_configuration") {
    return "warning";
  }

  if (stateKey === "local_ip_visible") {
    return "info";
  }

  return "success";
}

function getDnsLeakSummary(dnsLeakEnvironment) {
  const state = dnsLeakEnvironment && dnsLeakEnvironment.leakState ? dnsLeakEnvironment.leakState : "not_determinable";
  const map = {
    protected: { value: translate("dashboard.summary.dnsLeak.protected", "Protetto"), tone: "success" },
    single_resolver: { value: translate("dashboard.summary.dnsLeak.consistent", "Consistente"), tone: "info" },
    multiple_resolvers: { value: translate("dashboard.summary.dnsLeak.check", "Da verificare"), tone: "warning" },
    not_determinable: { value: translate("dashboard.summary.dnsLeak.unknown", "Non determinabile"), tone: "info" }
  };
  return map[state] || map.not_determinable;
}

function getDnsSecuritySummary(dnsSecurityEnvironment) {
  const state = dnsSecurityEnvironment && dnsSecurityEnvironment.dnssecState ? dnsSecurityEnvironment.dnssecState : "not_determinable";
  const map = {
    validating: { value: translate("dashboard.summary.dnssec.validating", "Validato"), tone: "success" },
    not_validating: { value: translate("dashboard.summary.dnssec.not", "Non validato"), tone: "warning" },
    not_determinable: { value: translate("dashboard.summary.dnssec.unknown", "Non determinabile"), tone: "info" }
  };
  return map[state] || map.not_determinable;
}

function getVpnSummary(vpnEnvironment) {
  const state = vpnEnvironment && vpnEnvironment.vpnState ? vpnEnvironment.vpnState : "not_determinable";
  const map = {
    signals_present: { value: translate("dashboard.summary.vpn.present", "Segnali rilevati"), tone: "info" },
    no_signals: { value: translate("dashboard.summary.vpn.none", "Nessun segnale"), tone: "info" },
    not_determinable: { value: translate("dashboard.summary.vpn.unknown", "Non determinabile"), tone: "info" }
  };
  return map[state] || map.not_determinable;
}

function buildSummaryData(browserEnvironment, dnsEnvironment, webrtcEnvironment, dnsLeakEnvironment, dnsSecurityEnvironment, vpnEnvironment) {
  const dnsLeak = getDnsLeakSummary(dnsLeakEnvironment);
  const dnssec = getDnsSecuritySummary(dnsSecurityEnvironment);
  const vpn = getVpnSummary(vpnEnvironment);
  return [
    { label: translate("dashboard.summary.browser", "Browser rilevato"), value: localizeAvailability(browserEnvironment.browser), tone: "info" },
    { label: translate("dashboard.summary.version", "Versione browser"), value: localizeAvailability(browserEnvironment.version), tone: "info" },
    { label: translate("dashboard.summary.os", "Sistema operativo"), value: localizeAvailability(browserEnvironment.os), tone: "info" },
    { label: translate("dashboard.summary.family", "Famiglia browser"), value: localizeAvailability(browserEnvironment.family), tone: "success" },
    { label: translate("dashboard.summary.dnsProvider", "Provider DNS"), value: localizeAvailability(dnsEnvironment.provider), tone: dnsEnvironment.determination === "confirmed" ? "success" : "info" },
    { label: translate("dashboard.summary.webrtcState", "Stato WebRTC"), value: localizeWebRtcState(webrtcEnvironment.state), tone: getWebRtcTone(webrtcEnvironment) },
    { label: translate("dashboard.summary.dnsLeak", "Stato DNS Leak"), value: dnsLeak.value, tone: dnsLeak.tone },
    { label: translate("dashboard.summary.dnssec", "DNSSEC"), value: dnssec.value, tone: dnssec.tone },
    { label: translate("dashboard.summary.vpn", "VPN / Proxy"), value: vpn.value, tone: vpn.tone }
  ];
}

function buildFindingData(browserEnvironment, dnsEnvironment, webrtcEnvironment) {
  return [
    {
      title: translate("dashboard.findings.privacyLevelTitle", "Browser Privacy Level"),
      description: getLocalizedPrivacyLevelDescription(browserEnvironment.privacyLevel),
      tone: PRIVACY_LEVEL_TONES[browserEnvironment.privacyLevel]
    },
    {
      title: translate("dashboard.findings.architectureTitle", "Architettura rilevata"),
      description: translate("dashboard.findings.architectureDescription", `Valore disponibile lato browser: ${browserEnvironment.architecture}.`, {
        architecture: localizeAvailability(browserEnvironment.architecture)
      }),
      tone: browserEnvironment.architecture === "Non disponibile" ? "warning" : "info"
    },
    {
      title: translate("dashboard.findings.dnsProviderTitle", "Provider DNS"),
      description: `${localizeAvailability(dnsEnvironment.provider)}. ${localizeKnownDashboardText(dnsEnvironment.description)}`,
      tone: dnsEnvironment.determination === "confirmed" ? "success" : dnsEnvironment.determination === "estimated" ? "info" : "warning"
    },
    {
      title: translate("dashboard.findings.webrtcTitle", "Stato WebRTC"),
      description: `${localizeWebRtcState(webrtcEnvironment.state)}. ${localizeKnownDashboardText(webrtcEnvironment.simpleExplanation)}`,
      tone: getWebRtcTone(webrtcEnvironment)
    },
    {
      title: translate("dashboard.findings.coverageTitle", "Copertura attuale"),
      description: translate("dashboard.findings.coverageDescription", "Browser Detection, Network Detection, DNS Provider Detection, WebRTC Analysis, Privacy Score, Recommendation Engine e DNS Leak Detection sono attivi. Restano fuori scope DNSSEC, DoH Detection completo e VPN Analysis."),
      tone: "success"
    }
  ];
}

function buildScoreBreakdownData(privacyScore) {
  return privacyScore.factors.map((factor) => {
    return {
      title: `${factor.label}: +${factor.awardedPoints}/${factor.maxPoints}`,
      description: localizeKnownDashboardText(factor.detail),
      tone: factor.tone
    };
  });
}

function buildFutureIntegrationsData(recommendationsState) {
  return recommendationsState.futureIntegrations.map((item) => {
    return {
      title: item.title,
      description: item.description,
      tone: "info"
    };
  });
}

function buildReportData(browserEnvironment, dnsEnvironment, webrtcEnvironment) {
  const sourceDetails = [];
  if (browserEnvironment.sources.userAgent) {
    sourceDetails.push("userAgent");
  }
  if (browserEnvironment.sources.userAgentData) {
    sourceDetails.push("userAgentData");
  }
  if (browserEnvironment.sources.highEntropyValues) {
    sourceDetails.push("high entropy values");
  }
  if (browserEnvironment.sources.braveApi) {
    sourceDetails.push("Brave API");
  }

  return [
    {
      title: translate("dashboard.report.browser", "Browser"),
      description: `${localizeAvailability(browserEnvironment.browser)} (${localizeAvailability(browserEnvironment.family)})`,
      tone: "info"
    },
    {
      title: translate("dashboard.report.version", "Versione"),
      description: translate("dashboard.report.versionDescription", `Versione rilevata: ${browserEnvironment.version}.`, {
        version: localizeAvailability(browserEnvironment.version)
      }),
      tone: "info"
    },
    {
      title: translate("dashboard.report.system", "Sistema"),
      description: translate("dashboard.report.systemDescription", `${browserEnvironment.os} - Architettura: ${browserEnvironment.architecture}.`, {
        os: localizeAvailability(browserEnvironment.os),
        architecture: localizeAvailability(browserEnvironment.architecture)
      }),
      tone: browserEnvironment.architecture === "Non disponibile" ? "warning" : "info"
    },
    {
      title: translate("dashboard.report.level", "Livello privacy"),
      description: translate("dashboard.report.levelDescription", `${browserEnvironment.privacyLevel}. ${PRIVACY_LEVEL_DESCRIPTIONS[browserEnvironment.privacyLevel]}`, {
        level: localizePrivacyLevel(browserEnvironment.privacyLevel),
        description: getLocalizedPrivacyLevelDescription(browserEnvironment.privacyLevel)
      }),
      tone: PRIVACY_LEVEL_TONES[browserEnvironment.privacyLevel]
    },
    {
      title: translate("dashboard.report.sources", "Sorgenti usate"),
      description: sourceDetails.length > 0 ? sourceDetails.join(", ") : translate("dashboard.report.sourceFallback", "Solo fallback minimo disponibile."),
      tone: "success"
    },
    {
      title: translate("dashboard.report.dnsProvider", "Provider DNS"),
      description: `${localizeAvailability(dnsEnvironment.provider)} - ${localizeKnownDashboardText(dnsEnvironment.identificationMethodLabel || localizeAvailability(dnsEnvironment.privacyLevel))} - ${localizeKnownDashboardText(dnsEnvironment.reliability)}`,
      tone: dnsEnvironment.determination === "confirmed" ? "success" : dnsEnvironment.determination === "estimated" ? "info" : "warning"
    },
    {
      title: translate("dashboard.report.webrtc", "WebRTC"),
      description: `${localizeWebRtcState(webrtcEnvironment.state)} - ${localizeRiskLevel(webrtcEnvironment.riskLevel)} - ${localizeKnownDashboardText(webrtcEnvironment.candidateSummary)}`,
      tone: getWebRtcTone(webrtcEnvironment)
    }
  ];
}

function buildDnsReportData(dnsEnvironment) {
  return [
    {
      title: translate("dashboard.dns.provider", "Provider DNS rilevato"),
      description: localizeAvailability(dnsEnvironment.provider),
      tone: dnsEnvironment.determination === "confirmed" ? "success" : dnsEnvironment.determination === "estimated" ? "info" : "warning"
    },
    {
      title: translate("dashboard.dns.privacyLevel", "Livello privacy stimato"),
      description: localizeAvailability(dnsEnvironment.privacyLevel),
      tone: dnsEnvironment.privacyLevel === "Base" ? "warning" : dnsEnvironment.privacyLevel === "Non disponibile" ? "warning" : "success"
    },
    {
      title: translate("dashboard.dns.description", "Descrizione del provider"),
      description: `${dnsEnvironment.identificationMethodLabel === "Provider DNS non determinabile" ? "" : `${localizeKnownDashboardText(dnsEnvironment.identificationMethodLabel)}. `}${localizeKnownDashboardText(dnsEnvironment.description)}`.trim(),
      tone: "info"
    },
    {
      title: translate("dashboard.dns.reliability", "Affidabilita della rilevazione"),
      description: `${localizeKnownDashboardText(dnsEnvironment.reliability)} (${Math.round(dnsEnvironment.confidence * 100)}%)`,
      tone: dnsEnvironment.reliability === "Alta" ? "success" : dnsEnvironment.reliability === "Media" ? "info" : "warning"
    }
  ];
}

function buildDnsInfoData() {
  return [
    {
      title: translate("dashboard.dnsInfo.whatIsDns", "Cos'e un DNS"),
      description: translate("dashboard.dnsInfo.whatIsDnsDescription", "Il DNS e il sistema che traduce i nomi dei siti, come example.com, negli indirizzi numerici usati davvero dalla rete."),
      tone: "info"
    },
    {
      title: translate("dashboard.dnsInfo.whyImportant", "Perche e importante"),
      description: translate("dashboard.dnsInfo.whyImportantDescription", "Ogni navigazione parte quasi sempre da una richiesta DNS: se il resolver e lento, poco affidabile o invasivo, puo incidere su esperienza, sicurezza e controllo."),
      tone: "info"
    },
    {
      title: translate("dashboard.dnsInfo.privacyImpact", "Impatto sulla privacy"),
      description: translate("dashboard.dnsInfo.privacyImpactDescription", "Il provider DNS puo vedere quali domini stai cercando di raggiungere. Per questo scegliere un resolver piu prudente puo ridurre esposizione, tracciamento e richieste indesiderate."),
      tone: "warning"
    }
  ];
}

function buildWebRtcReportData(webrtcEnvironment) {
  const technicalFindings = webrtcEnvironment.technicalFindings || FALLBACK_WEBRTC_ENVIRONMENT.technicalFindings;

  return [
    {
      title: translate("dashboard.webrtc.state", "Stato WebRTC"),
      description: localizeWebRtcState(webrtcEnvironment.state),
      tone: getWebRtcTone(webrtcEnvironment)
    },
    {
      title: translate("dashboard.webrtc.riskLevel", "Livello di rischio"),
      description: localizeRiskLevel(webrtcEnvironment.riskLevel),
      tone: webrtcEnvironment.riskLevel === "Alto" ? "warning" : webrtcEnvironment.riskLevel === "Medio" ? "info" : "success"
    },
    {
      title: translate("dashboard.webrtc.priority", "Priorita"),
      description: localizePriority(webrtcEnvironment.priority),
      tone: webrtcEnvironment.priority === "Alta" ? "warning" : webrtcEnvironment.priority === "Media" ? "info" : "success"
    },
    {
      title: translate("dashboard.webrtc.whatFound", "Cosa e stato trovato"),
      description: localizeKnownDashboardText(webrtcEnvironment.candidateSummary),
      tone: "info"
    },
    {
      title: translate("dashboard.webrtc.simpleExplanation", "Spiegazione semplice"),
      description: localizeKnownDashboardText(webrtcEnvironment.simpleExplanation),
      tone: "info"
    },
    {
      title: translate("dashboard.webrtc.privacyImpact", "Impatto sulla privacy"),
      description: localizeKnownDashboardText(webrtcEnvironment.privacyImpact),
      tone: getWebRtcTone(webrtcEnvironment)
    },
    {
      title: translate("dashboard.webrtc.suggestedAction", "Come migliorare"),
      description: localizeKnownDashboardText(webrtcEnvironment.suggestedAction),
      tone: technicalFindings.hasPublicAddress || technicalFindings.hasPrivateAddress ? "warning" : "success"
    }
  ];
}

function buildWebRtcInfoData() {
  return [
    {
      title: translate("dashboard.webrtcInfo.whatIsWebRtc", "Cos'e WebRTC"),
      description: translate("dashboard.webrtcInfo.whatIsWebRtcDescription", "WebRTC e una tecnologia del browser pensata per chiamate audio, video e scambi diretti di dati in tempo reale tra dispositivi."),
      tone: "info"
    },
    {
      title: translate("dashboard.webrtcInfo.whyItMatters", "Perche conta"),
      description: translate("dashboard.webrtcInfo.whyItMattersDescription", "Per far funzionare connessioni dirette, WebRTC puo raccogliere candidati di rete che descrivono indirizzi locali, pubblici o di relay disponibili per il browser."),
      tone: "info"
    },
    {
      title: translate("dashboard.webrtcInfo.privacyImpact", "Impatto sulla privacy"),
      description: translate("dashboard.webrtcInfo.privacyImpactDescription", "Se il browser espone troppi dettagli WebRTC, un sito puo ottenere informazioni aggiuntive sulla rete o sul dispositivo. Per questo il risultato andra in futuro confrontato anche con VPN Protection Analysis e DNS Leak Detection."),
      tone: "warning"
    }
  ];
}

function stringifyDebugValue(value) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "Non disponibile";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function isDnsDebugEnabled() {
  const params = new URLSearchParams(window.location.search);
  return params.get("dnsDebug") === "1" || window.localStorage.getItem("pca-dns-debug") === "1";
}

function buildDnsDebugData(dnsEnvironment) {
  const debug = dnsEnvironment.debug || {};

  return [
    {
      title: translate("dashboard.dnsDebug.resolverObserved", "Resolver osservato"),
      description: `${localizeAvailability(debug.observedResolver || dnsEnvironment.resolverSnapshot || "Non disponibile")} | ${isEnglishLanguage() ? "Source IP" : "Source IP"}: ${localizeAvailability(debug.sourceIpObserved || dnsEnvironment.resolverSourceIp || "Non disponibile")}`,
      tone: "info"
    },
    {
      title: translate("dashboard.dnsDebug.method", "Metodo di identificazione"),
      description: localizeKnownDashboardText(debug.identificationMethod || dnsEnvironment.identificationMethodLabel || "Non disponibile"),
      tone: "info"
    },
    {
      title: translate("dashboard.dnsDebug.signature", "Firma trovata"),
      description: localizeKnownDashboardText(debug.signatureFound || `${dnsEnvironment.matchedSignatureLabel}: ${dnsEnvironment.matchedSignatureValue}`),
      tone: "info"
    },
    {
      title: translate("dashboard.dnsDebug.reliability", "Livello di affidabilita"),
      description: `${localizeKnownDashboardText(debug.confidenceLevel || dnsEnvironment.reliability)} (${Math.round((dnsEnvironment.confidence || 0) * 100)}%)`,
      tone: dnsEnvironment.reliability === "Alta" ? "success" : dnsEnvironment.reliability === "Media" ? "info" : "warning"
    }
  ];
}

function buildNetworkReportData(networkEnvironment) {
  return [
    {
      title: translate("dashboard.network.ipv4", "IPv4 pubblico"),
      description: localizeAvailability(networkEnvironment.ipv4),
      tone: networkEnvironment.ipv4 === "Non disponibile" ? "warning" : "info"
    },
    {
      title: translate("dashboard.network.ipv6", "IPv6 pubblico"),
      description: localizeAvailability(networkEnvironment.ipv6),
      tone: networkEnvironment.ipv6 === "Non disponibile" ? "warning" : "info"
    },
    {
      title: translate("dashboard.network.language", "Lingua browser"),
      description: localizeAvailability(networkEnvironment.browserLanguage),
      tone: "info"
    },
    {
      title: translate("dashboard.network.timezone", "Timezone"),
      description: localizeAvailability(networkEnvironment.timezone),
      tone: "info"
    },
    {
      title: translate("dashboard.network.resolution", "Risoluzione schermo"),
      description: localizeAvailability(networkEnvironment.screenResolution),
      tone: "info"
    },
    {
      title: translate("dashboard.network.dnt", "Do Not Track"),
      description: localizeDoNotTrackValue(networkEnvironment.doNotTrack),
      tone: networkEnvironment.doNotTrack === "Attivo" ? "success" : networkEnvironment.doNotTrack === "Disattivo" ? "warning" : "info"
    }
  ];
}

function buildInterpretationData(browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment) {
  return [
    {
      title: translate("dashboard.interpretation.browserTitle", "Browser rilevato"),
      description: translate("dashboard.interpretation.browserDescription", `Indica quale browser stai usando in questo momento: ${browserEnvironment.browser}.`, {
        browser: localizeAvailability(browserEnvironment.browser)
      }),
      tone: "info"
    },
    {
      title: translate("dashboard.interpretation.versionTitle", "Versione browser"),
      description: translate("dashboard.interpretation.versionDescription", `Mostra la versione dichiarata dal browser. Serve a capire se il software e aggiornato: ${browserEnvironment.version}.`, {
        version: localizeAvailability(browserEnvironment.version)
      }),
      tone: "info"
    },
    {
      title: translate("dashboard.interpretation.osTitle", "Sistema operativo"),
      description: translate("dashboard.interpretation.osDescription", `Aiuta a contestualizzare l'ambiente del dispositivo da cui stai navigando: ${browserEnvironment.os}.`, {
        os: localizeAvailability(browserEnvironment.os)
      }),
      tone: "info"
    },
    {
      title: translate("dashboard.interpretation.familyTitle", "Famiglia browser"),
      description: translate("dashboard.interpretation.familyDescription", `Raggruppa il browser in una famiglia tecnica utile per fornire istruzioni compatibili: ${browserEnvironment.family}.`, {
        family: localizeAvailability(browserEnvironment.family)
      }),
      tone: "info"
    },
    {
      title: translate("dashboard.interpretation.architectureTitle", "Architettura"),
      description: translate("dashboard.interpretation.architectureDescription", `Quando disponibile, indica il tipo di piattaforma del dispositivo o del browser: ${browserEnvironment.architecture}.`, {
        architecture: localizeAvailability(browserEnvironment.architecture)
      }),
      tone: browserEnvironment.architecture === "Non disponibile" ? "warning" : "info"
    },
    {
      title: translate("dashboard.interpretation.ipv4Title", "IPv4 pubblico"),
      description: translate("dashboard.interpretation.ipv4Description", `E l'indirizzo internet pubblico piu comune visto dai servizi online: ${networkEnvironment.ipv4}.`, {
        ipv4: localizeAvailability(networkEnvironment.ipv4)
      }),
      tone: networkEnvironment.ipv4 === "Non disponibile" ? "warning" : "info"
    },
    {
      title: translate("dashboard.interpretation.ipv6Title", "IPv6 pubblico"),
      description: translate("dashboard.interpretation.ipv6Description", `E l'eventuale indirizzo pubblico di nuova generazione disponibile sulla tua connessione: ${networkEnvironment.ipv6}.`, {
        ipv6: localizeAvailability(networkEnvironment.ipv6)
      }),
      tone: networkEnvironment.ipv6 === "Non disponibile" ? "warning" : "info"
    },
    {
      title: translate("dashboard.interpretation.languageTitle", "Lingua browser"),
      description: translate("dashboard.interpretation.languageDescription", `Indica la lingua preferita comunicata dal browser ai siti: ${networkEnvironment.browserLanguage}.`, {
        language: localizeAvailability(networkEnvironment.browserLanguage)
      }),
      tone: "info"
    },
    {
      title: translate("dashboard.interpretation.timezoneTitle", "Timezone"),
      description: translate("dashboard.interpretation.timezoneDescription", `Mostra il fuso orario rilevato dal browser, utile per capire quante informazioni ambientali vengono condivise: ${networkEnvironment.timezone}.`, {
        timezone: localizeAvailability(networkEnvironment.timezone)
      }),
      tone: "info"
    },
    {
      title: translate("dashboard.interpretation.resolutionTitle", "Risoluzione schermo"),
      description: translate("dashboard.interpretation.resolutionDescription", `Descrive la dimensione dello schermo disponibile al browser: ${networkEnvironment.screenResolution}.`, {
        resolution: localizeAvailability(networkEnvironment.screenResolution)
      }),
      tone: "info"
    },
    {
      title: translate("dashboard.interpretation.dntTitle", "Do Not Track"),
      description: translate("dashboard.interpretation.dntDescription", `Indica se il browser chiede ai siti di limitare il tracciamento: ${networkEnvironment.doNotTrack}.`, {
        value: localizeDoNotTrackValue(networkEnvironment.doNotTrack)
      }),
      tone: networkEnvironment.doNotTrack === "Attivo" ? "success" : networkEnvironment.doNotTrack === "Disattivo" ? "warning" : "info"
    },
    {
      title: translate("dashboard.interpretation.dnsTitle", "Provider DNS"),
      description: translate("dashboard.interpretation.dnsDescription", `Mostra il resolver DNS che il browser sembra usare in questa sessione: ${dnsEnvironment.provider}.`, {
        provider: localizeAvailability(dnsEnvironment.provider)
      }),
      tone: dnsEnvironment.determination === "confirmed" ? "success" : dnsEnvironment.determination === "estimated" ? "info" : "warning"
    },
    {
      title: translate("dashboard.interpretation.webrtcTitle", "Stato WebRTC"),
      description: translate("dashboard.interpretation.webrtcDescription", `Riassume il tipo di esposizione WebRTC osservata in questa sessione, ad esempio mDNS, IP locale, relay o IP pubblico: ${webrtcEnvironment.state}.`, {
        state: localizeWebRtcState(webrtcEnvironment.state)
      }),
      tone: getWebRtcTone(webrtcEnvironment)
    }
  ];
}

function renderSummary(summaryData) {
  const summaryRoot = document.getElementById("summaryCards");
  if (!summaryRoot) {
    return;
  }

  summaryRoot.innerHTML = "";
  summaryData.forEach((item) => {
    const column = document.createElement("div");
    column.className = "col-sm-6 col-xl-3";
    column.innerHTML = `
      <div class="summary-card ${getResultToneClass(item.tone)}">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <span class="summary-label">${item.label}</span>
            <strong class="summary-value mt-2">${item.value}</strong>
          </div>
        </div>
      </div>
    `;
    summaryRoot.appendChild(column);
  });
}

function renderFindings(findingsData) {
  const findingsRoot = document.getElementById("findingCards");
  if (!findingsRoot) {
    return;
  }

  findingsRoot.innerHTML = "";
  findingsData.forEach((item) => {
    const column = document.createElement("div");
    column.className = "col-md-6 col-xl-4";
    column.innerHTML = `
      <div class="finding-card ${getResultToneClass(item.tone)}">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
          <h3 class="h6 mb-0">${item.title}</h3>
          ${buildCheckStatusMarkup(item.tone)}
        </div>
        <p>${item.description}</p>
      </div>
    `;
    findingsRoot.appendChild(column);
  });
}

function renderNextSteps() {
  const stepsRoot = document.getElementById("nextSteps");
  if (!stepsRoot) {
    return;
  }

  stepsRoot.innerHTML = "";
  DASHBOARD_STATIC_DATA.nextSteps.forEach((item) => {
    const step = document.createElement("div");
    step.className = "timeline-item";
    const index = DASHBOARD_STATIC_DATA.nextSteps.indexOf(item);
    step.innerHTML = `<p class="mb-0">${translate(`dashboard.nextSteps.${index}`, item)}</p>`;
    stepsRoot.appendChild(step);
  });
}

function renderReport(reportData) {
  const reportRoot = document.getElementById("reportList");
  if (!reportRoot) {
    return;
  }

  reportRoot.innerHTML = "";
  reportData.forEach((item) => {
    const reportItem = document.createElement("div");
    reportItem.className = `report-item ${getResultToneClass(item.tone)}`;
    reportItem.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <p class="mt-2">${item.description}</p>
      </div>
    `;
    reportRoot.appendChild(reportItem);
  });
}

function renderSimpleReportList(rootId, reportData) {
  const root = document.getElementById(rootId);
  if (!root) {
    return;
  }

  root.innerHTML = "";
  reportData.forEach((item) => {
    const reportItem = document.createElement("div");
    reportItem.className = `report-item ${getResultToneClass(item.tone)}`;
    reportItem.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <p class="mt-2">${item.description}</p>
      </div>
    `;
    root.appendChild(reportItem);
  });
}

function buildPrivacyIntelligenceHeroModel(analysisState) {
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const overallState = resolvedAnalysis.overallState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS.overallState;
  const dominantRootCauseId = resolvedAnalysis.reasoning
    && resolvedAnalysis.reasoning.mainIssue
    && resolvedAnalysis.reasoning.mainIssue.selectedRootCause
    ? resolvedAnalysis.reasoning.mainIssue.selectedRootCause.rootCauseId
    : resolvedAnalysis.mainIssue && resolvedAnalysis.mainIssue.rootCauseId
      ? resolvedAnalysis.mainIssue.rootCauseId
      : null;

  return {
    eyebrow: translate("dashboard.intelligence.hero.eyebrow", "Privacy Intelligence 0.8.2"),
    badge: translate("dashboard.intelligence.hero.badge", "Root Cause Driven"),
    title: translate("dashboard.intelligence.hero.title", "Stato generale della configurazione"),
    stateLabel: translate("dashboard.intelligence.hero.stateLabel", "Stato generale"),
    stateValue: localizeOverallStateLabel(overallState.label, overallState.key),
    description: getOverallStateDescription(overallState.key),
    dominantProblemLabel: translate("dashboard.intelligence.hero.dominantProblem", "Problema dominante"),
    dominantProblemValue: dominantRootCauseId
      ? getReadableRootCauseLabel(dominantRootCauseId)
      : translate("dashboard.intelligence.hero.noDominantProblem", "Nessun problema dominante rilevato"),
    confidenceLabel: translate("dashboard.intelligence.hero.confidence", "Confidenza dell'analisi"),
    confidenceValue: formatConfidenceValue(resolvedAnalysis.overallConfidence),
    tone: getOverallStateTone(overallState.key)
  };
}

function renderPrivacyIntelligenceHero(model) {
  const root = document.getElementById("privacyIntelligenceHero");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="intelligence-hero-compact">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
        <span class="eyebrow">${escapeHtml(model.eyebrow)}</span>
          <h2 class="h4 mt-2 mb-1">${escapeHtml(model.title)}</h2>
          <p class="text-secondary mb-0">${escapeHtml(model.description)}</p>
        </div>
        <span class="status-pill status-${escapeHtml(model.tone)}">${escapeHtml(model.badge)}</span>
      </div>
      <div class="intelligence-summary-strip mt-3">
        <div class="intelligence-summary-pill intelligence-summary-pill-state">
          <span class="summary-label">${escapeHtml(model.stateLabel)}</span>
          <strong class="privacy-score-level mt-1">${escapeHtml(model.stateValue)}</strong>
        </div>
        <div class="intelligence-summary-pill intelligence-summary-pill-problem">
          <span class="summary-label">${escapeHtml(model.dominantProblemLabel)}</span>
          <strong class="d-block mt-1">${escapeHtml(model.dominantProblemValue)}</strong>
        </div>
        <div class="intelligence-summary-pill intelligence-summary-pill-confidence">
          <span class="summary-label">${escapeHtml(model.confidenceLabel)}</span>
          <strong class="d-block mt-1">${escapeHtml(model.confidenceValue)}</strong>
        </div>
      </div>
    </div>
  `;
}

function buildPrivacyIntelligenceMainIssueModel(analysisState) {
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const mainIssue = resolvedAnalysis.mainIssue;
  const reasoning = resolvedAnalysis.reasoning ? resolvedAnalysis.reasoning.mainIssue : null;

  if (!mainIssue) {
    return {
      empty: true,
      eyebrow: translate("dashboard.intelligence.mainIssue.eyebrow", "Problema principale"),
      title: translate("dashboard.intelligence.mainIssue.title", "Criticita dominante da comprendere"),
      subtitle: translate("dashboard.intelligence.mainIssue.subtitle", "Il motore non rileva al momento una Root Cause negativa abbastanza forte da diventare problema principale."),
      emptyTitle: translate("dashboard.intelligence.mainIssue.emptyTitle", "Nessun problema principale rilevato"),
      emptyDescription: translate("dashboard.intelligence.mainIssue.emptyDescription", "In questa lettura non emerge una causa negativa dominante che richieda un focus prioritario.")
    };
  }

  const rootCauseId = reasoning && reasoning.selectedRootCause
    ? reasoning.selectedRootCause.rootCauseId
    : mainIssue.rootCauseId;
  const rootCauseLabel = getReadableRootCauseLabel(rootCauseId);
  const rationale = getSignalNarrative(
    mainIssue,
    translate("dashboard.intelligence.mainIssue.fallbackNarrative", "Il motore ha selezionato questo segnale come rappresentazione della criticita dominante osservata.")
  );

  return {
    empty: false,
    eyebrow: translate("dashboard.intelligence.mainIssue.eyebrow", "Problema principale"),
    title: translate("dashboard.intelligence.mainIssue.title", "Criticita dominante da comprendere"),
    subtitle: translate("dashboard.intelligence.mainIssue.subtitle", "La card evidenzia il segnale piu rappresentativo della Root Cause dominante."),
    primaryTitle: localizeKnownDashboardText(mainIssue.title || rootCauseLabel),
    primaryDescription: rationale,
    metaItems: [
      {
        label: translate("dashboard.intelligence.labels.functionalCause", "Causa funzionale"),
        value: rootCauseLabel,
        description: translate("dashboard.intelligence.mainIssue.functionalCauseDescription", "Root Cause dominante osservata dal motore.")
      },
      {
        label: translate("dashboard.intelligence.labels.observedSeverity", "Gravita osservata"),
        value: localizeSeverity(mainIssue.intrinsicSeverity),
        description: translate("dashboard.intelligence.mainIssue.severityDescription", "Livello di severita stimato per il segnale rappresentativo.")
      },
      {
        label: translate("dashboard.intelligence.labels.priority", "Priorita"),
        value: localizePriority(mainIssue.suggestedPriority),
        description: translate("dashboard.intelligence.mainIssue.priorityDescription", "Urgenza suggerita dal motore per questa criticita.")
      },
      {
        label: translate("dashboard.intelligence.labels.confidence", "Confidenza"),
        value: formatConfidenceValue(mainIssue.confidence),
        description: translate("dashboard.intelligence.mainIssue.confidenceDescription", "Affidabilita del segnale utilizzato per descrivere il problema principale.")
      },
      {
        label: translate("dashboard.intelligence.labels.selectedSignal", "Segnale rappresentativo"),
        value: formatSignalLabel(mainIssue),
        description: translate("dashboard.intelligence.mainIssue.signalDescription", "Segnale scelto per rendere leggibile la Root Cause dominante.")
      }
    ],
    reasonTitle: translate("dashboard.intelligence.mainIssue.why", "Perche e stato selezionato"),
    reasonDescription: translate(
      "dashboard.intelligence.mainIssue.whyDescription",
      "Il motore ha collegato il problema alla causa {rootCause} usando il segnale {signal}. {rationale}",
      {
        rootCause: rootCauseLabel,
        signal: formatSignalLabel(mainIssue),
        rationale
      }
    )
  };
}

function buildPrivacyIntelligencePriorityActionModel(analysisState) {
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const priorityAction = resolvedAnalysis.priorityAction;
  const reasoning = resolvedAnalysis.reasoning ? resolvedAnalysis.reasoning.priorityAction : null;

  if (!priorityAction) {
    return {
      empty: true,
      eyebrow: translate("dashboard.intelligence.priorityAction.eyebrow", "Azione prioritaria"),
      title: translate("dashboard.intelligence.priorityAction.title", "Primo intervento consigliato"),
      subtitle: translate("dashboard.intelligence.priorityAction.subtitle", "Questa sezione mostra la prima azione concreta quando il motore rileva una criticita correggibile."),
      emptyTitle: translate("dashboard.intelligence.priorityAction.emptyTitle", "Nessuna azione prioritaria necessaria"),
      emptyDescription: translate("dashboard.intelligence.priorityAction.emptyDescription", "In questa lettura non emerge un intervento iniziale sufficientemente utile e concreto da mostrare come priorita.")
    };
  }

  const rootCauseId = reasoning && reasoning.selectedRootCause
    ? reasoning.selectedRootCause.rootCauseId
    : priorityAction.rootCauseId;
  const rootCauseLabel = getReadableRootCauseLabel(rootCauseId);
  const actionTitle = localizeKnownDashboardText(priorityAction.suggestedAction || priorityAction.title || rootCauseLabel);
  const rationale = getSignalNarrative(
    priorityAction,
    translate("dashboard.intelligence.priorityAction.fallbackNarrative", "Il motore ha scelto l'azione piu utile disponibile sulla causa dominante.")
  );

  return {
    empty: false,
    eyebrow: translate("dashboard.intelligence.priorityAction.eyebrow", "Azione prioritaria"),
    title: translate("dashboard.intelligence.priorityAction.title", "Primo intervento consigliato"),
    subtitle: translate("dashboard.intelligence.priorityAction.subtitle", "L'azione viene scelta sulla Root Cause dominante, non in base al solo segnale peggiore."),
    primaryTitle: actionTitle,
    primaryDescription: rationale,
    metaItems: [
      {
        label: translate("dashboard.intelligence.labels.functionalCause", "Causa funzionale"),
        value: rootCauseLabel,
        description: translate("dashboard.intelligence.priorityAction.functionalCauseDescription", "Questa azione interviene sulla stessa Root Cause dominante del problema principale.")
      },
      {
        label: translate("dashboard.intelligence.labels.expectedBenefit", "Beneficio atteso"),
        value: localizeBenefitLevel(priorityAction.benefitEstimate),
        description: translate("dashboard.intelligence.priorityAction.benefitDescription", "Stima del beneficio potenziale se l'azione viene applicata correttamente.")
      },
      {
        label: translate("dashboard.intelligence.labels.remediation", "Tipo di intervento"),
        value: localizeRemediationStatus(priorityAction.remediation && priorityAction.remediation.status),
        description: translate("dashboard.intelligence.priorityAction.remediationDescription", "Modalita con cui il problema puo essere corretto o mitigato.")
      },
      {
        label: translate("dashboard.intelligence.labels.userControl", "Controllo utente"),
        value: localizeUserControl(priorityAction.remediation && priorityAction.remediation.userControl),
        description: translate("dashboard.intelligence.priorityAction.userControlDescription", "Quanto l'utente puo intervenire direttamente senza dipendere da fattori esterni.")
      },
      {
        label: translate("dashboard.intelligence.labels.confidence", "Confidenza"),
        value: formatConfidenceValue(priorityAction.confidence),
        description: translate("dashboard.intelligence.priorityAction.confidenceDescription", "Affidabilita dell'azione selezionata dal motore.")
      },
      {
        label: translate("dashboard.intelligence.labels.selectedSignal", "Segnale guida"),
        value: formatSignalLabel(priorityAction),
        description: translate("dashboard.intelligence.priorityAction.signalDescription", "Segnale usato per rendere concreta l'azione sulla causa dominante.")
      }
    ],
    reasonTitle: translate("dashboard.intelligence.priorityAction.why", "Perche e stata scelta"),
    reasonDescription: translate(
      "dashboard.intelligence.priorityAction.whyDescription",
      "L'azione e stata selezionata per intervenire sulla causa {rootCause} usando il segnale {signal}. {rationale}",
      {
        rootCause: rootCauseLabel,
        signal: formatSignalLabel(priorityAction),
        rationale
      }
    )
  };
}

function renderPrivacyIntelligenceDetailCard(rootId, model, tone) {
  const root = document.getElementById(rootId);
  if (!root) {
    return;
  }

  if (model.empty) {
    root.innerHTML = `
      <div class="intelligence-card-compact">
        <span class="eyebrow">${escapeHtml(model.eyebrow)}</span>
        <h2 class="h5 mt-2 mb-1">${escapeHtml(model.title)}</h2>
        <p class="text-secondary mb-0">${escapeHtml(model.subtitle)}</p>
      </div>
      <div class="soft-box mt-3 intelligence-empty-box">
        <strong>${escapeHtml(model.emptyTitle)}</strong>
        <p class="text-secondary mt-2 mb-0">${escapeHtml(model.emptyDescription)}</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="intelligence-card-compact">
      <span class="eyebrow">${escapeHtml(model.eyebrow)}</span>
      <h2 class="h5 mt-2 mb-1">${escapeHtml(model.title)}</h2>
      <p class="text-secondary mb-0">${escapeHtml(model.subtitle)}</p>
    </div>
    <div class="report-list mt-3">
      <div class="report-item intelligence-lead-card ${getResultToneClass(tone)}">
        <div>
          <strong>${escapeHtml(model.primaryTitle)}</strong>
          <p class="mt-2">${escapeHtml(model.primaryDescription)}</p>
        </div>
      </div>
    </div>
    ${renderMetaGrid(model.metaItems)}
    <div class="soft-box mt-3 intelligence-reason-note">
      <strong>${escapeHtml(model.reasonTitle)}</strong>
      <p class="text-secondary mt-2 mb-0">${escapeHtml(model.reasonDescription)}</p>
    </div>
  `;
}

function buildPrivacyIntelligenceStrengthsModel(analysisState) {
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const strengths = Array.isArray(resolvedAnalysis.strengths) ? resolvedAnalysis.strengths : [];

  return {
    eyebrow: translate("dashboard.intelligence.strengths.eyebrow", "Aspetti gia solidi"),
    title: translate("dashboard.intelligence.strengths.title", "Punti di forza deduplicati"),
    subtitle: translate("dashboard.intelligence.strengths.subtitle", "Ogni punto di forza rappresenta una Root Cause positiva o stabile, senza duplicazioni artificiali."),
    emptyTitle: translate("dashboard.intelligence.strengths.emptyTitle", "Nessun punto di forza stabile da evidenziare"),
    emptyDescription: translate("dashboard.intelligence.strengths.emptyDescription", "In questa lettura non emergono ancora elementi positivi abbastanza stabili da essere mostrati come strengths."),
    items: strengths.map((item) => ({
      title: localizeKnownDashboardText(item.title || getReadableRootCauseLabel(item.rootCauseId)),
      rootCause: getReadableRootCauseLabel(item.rootCauseId),
      confidence: formatConfidenceValue(item.confidence),
      rationale: getSignalNarrative(
        item,
        translate("dashboard.intelligence.strengths.itemFallbackNarrative", "Questo segnale rappresenta un elemento gia favorevole della configurazione attuale.")
      )
    }))
  };
}

function renderPrivacyIntelligenceStrengths(model) {
  const root = document.getElementById("privacyIntelligenceStrengthsCard");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <span class="eyebrow">${escapeHtml(model.eyebrow)}</span>
    <h2 class="h5 mt-2 mb-1">${escapeHtml(model.title)}</h2>
    <p class="text-secondary mb-0">${escapeHtml(model.subtitle)}</p>
    <div class="intelligence-strengths-list mt-3" id="privacyIntelligenceStrengthsList"></div>
  `;

  if (!model.items.length) {
    const listRoot = document.getElementById("privacyIntelligenceStrengthsList");
    if (listRoot) {
      listRoot.innerHTML = `
        <div class="soft-box intelligence-empty-box">
          <strong>${escapeHtml(model.emptyTitle)}</strong>
          <p class="text-secondary mt-2 mb-0">${escapeHtml(model.emptyDescription)}</p>
        </div>
      `;
    }
    return;
  }

  const listRoot = document.getElementById("privacyIntelligenceStrengthsList");
  if (!listRoot) {
    return;
  }

  listRoot.innerHTML = model.items.map((item) => `
    <div class="soft-box intelligence-strength-item">
      <strong>${escapeHtml(item.title)}</strong>
      <div class="intelligence-strength-meta">
        <span>${escapeHtml(translate("dashboard.intelligence.labels.functionalCause", "Causa funzionale"))}: ${escapeHtml(item.rootCause)}</span>
        <span>${escapeHtml(translate("dashboard.intelligence.labels.confidence", "Confidenza"))}: ${escapeHtml(item.confidence)}</span>
      </div>
      <p class="text-secondary small mt-2 mb-0">${escapeHtml(item.rationale)}</p>
    </div>
  `).join("");
}

function buildPrivacyIntelligenceReasoningModel(analysisState) {
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const reasoning = resolvedAnalysis.reasoning || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS.reasoning;
  const mainIssue = resolvedAnalysis.mainIssue;
  const priorityAction = resolvedAnalysis.priorityAction;
  const strengths = Array.isArray(resolvedAnalysis.strengths) ? resolvedAnalysis.strengths : [];

  return {
    eyebrow: translate("dashboard.intelligence.reasoning.eyebrow", "Spiegabilita"),
    title: translate("dashboard.intelligence.reasoning.title", "Perche il motore ha deciso cosi"),
    subtitle: translate("dashboard.intelligence.reasoning.subtitle", "La dashboard mostra il quadro complessivo, la causa dominante e i punti di forza senza perdere la tracciabilita delle decisioni."),
    items: [
      {
        title: translate("dashboard.intelligence.reasoning.overallState", "Perche questo stato generale"),
        description: translate(
          "dashboard.intelligence.reasoning.overallStateDescription",
          "Lo stato complessivo considera le Root Causes: {contributing}. Criticita dominanti: {negative}. Punti di forza considerati: {strengths}.",
          {
            contributing: formatRootCauseList(reasoning.overallState ? reasoning.overallState.contributingRootCauseIds : []),
            negative: formatRootCauseList(reasoning.overallState ? reasoning.overallState.dominantNegativeRootCauseIds : []),
            strengths: formatRootCauseList(reasoning.overallState ? reasoning.overallState.strengthRootCauseIds : [])
          }
        ),
        tone: getOverallStateTone(resolvedAnalysis.overallState && resolvedAnalysis.overallState.key)
      },
      {
        title: translate("dashboard.intelligence.reasoning.mainIssue", "Perche questo problema principale"),
        description: mainIssue
          ? translate(
            "dashboard.intelligence.reasoning.mainIssueDescription",
            "Il motore ha selezionato la causa {rootCause} tramite il segnale {signal}.",
            {
              rootCause: getReadableRootCauseLabel(mainIssue.rootCauseId),
              signal: formatSignalLabel(mainIssue)
            }
          )
          : translate("dashboard.intelligence.reasoning.mainIssueEmpty", "Non e stata selezionata una Root Cause negativa dominante."),
        tone: mainIssue ? "warning" : "info"
      },
      {
        title: translate("dashboard.intelligence.reasoning.priorityAction", "Perche questa azione prioritaria"),
        description: priorityAction
          ? translate(
            "dashboard.intelligence.reasoning.priorityActionDescription",
            "L'azione e stata associata alla causa {rootCause} usando il segnale {signal} come riferimento operativo.",
            {
              rootCause: getReadableRootCauseLabel(priorityAction.rootCauseId),
              signal: formatSignalLabel(priorityAction)
            }
          )
          : translate("dashboard.intelligence.reasoning.priorityActionEmpty", "Non e stata selezionata un'azione prioritaria distinta per questa lettura."),
        tone: priorityAction ? "warning" : "info"
      },
      {
        title: translate("dashboard.intelligence.reasoning.strengths", "Perche questi punti di forza"),
        description: strengths.length > 0
          ? translate(
            "dashboard.intelligence.reasoning.strengthsDescription",
            "I strengths vengono deduplicati per Root Cause e includono: {strengths}.",
            {
              strengths: formatRootCauseList(strengths.map((item) => item.rootCauseId))
            }
          )
          : translate("dashboard.intelligence.reasoning.strengthsEmpty", "Non sono stati evidenziati punti di forza stabili nella lettura corrente."),
        tone: strengths.length > 0 ? "success" : "info"
      }
    ]
  };
}

function renderPrivacyIntelligenceReasoning(model) {
  const root = document.getElementById("privacyIntelligenceReasoningCard");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <span class="eyebrow">${escapeHtml(model.eyebrow)}</span>
    <h2 class="h5 mt-2 mb-1">${escapeHtml(model.title)}</h2>
    <p class="text-secondary mb-0">${escapeHtml(model.subtitle)}</p>
    <div class="intelligence-reason-list mt-3" id="privacyIntelligenceReasoningList"></div>
  `;

  const listRoot = document.getElementById("privacyIntelligenceReasoningList");
  if (!listRoot) {
    return;
  }

  listRoot.innerHTML = model.items.map((item) => `
    <div class="intelligence-reason-item intelligence-reason-${escapeHtml(item.tone || "info")}">
      <strong>${escapeHtml(item.title)}</strong>
      <p class="mb-0">${escapeHtml(item.description)}</p>
    </div>
  `).join("");
}

function renderPrivacyIntelligenceSection(analysisState, rootCauseState) {
  const section = document.getElementById("privacyIntelligenceSection");
  if (!section) {
    return;
  }

  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  buildRootCauseLookup(rootCauseState);
  renderPrivacyIntelligenceHero(buildPrivacyIntelligenceHeroModel(resolvedAnalysis));
  renderPrivacyIntelligenceDetailCard(
    "privacyIntelligenceMainIssueCard",
    buildPrivacyIntelligenceMainIssueModel(resolvedAnalysis),
    "warning"
  );
  renderPrivacyIntelligenceDetailCard(
    "privacyIntelligencePriorityActionCard",
    buildPrivacyIntelligencePriorityActionModel(resolvedAnalysis),
    "info"
  );
  renderPrivacyIntelligenceStrengths(buildPrivacyIntelligenceStrengthsModel(resolvedAnalysis));
  renderPrivacyIntelligenceReasoning(buildPrivacyIntelligenceReasoningModel(resolvedAnalysis));
}

function renderHomepagePreview(browserEnvironment) {
  const browserNode = document.querySelector("[data-home-browser]");
  const versionNode = document.querySelector("[data-home-version]");
  const osNode = document.querySelector("[data-home-os]");
  const levelNode = document.querySelector("[data-home-level]");
  const badgeNode = document.querySelector("[data-home-badge]");
  const noteNode = document.querySelector("[data-home-note]");

  if (!browserNode || !versionNode || !osNode || !levelNode) {
    return;
  }

  browserNode.textContent = localizeAvailability(browserEnvironment.browser);
  versionNode.textContent = localizeAvailability(browserEnvironment.version);
  osNode.textContent = localizeAvailability(browserEnvironment.os);
  levelNode.textContent = localizePrivacyLevel(browserEnvironment.privacyLevel);

  if (badgeNode) {
    badgeNode.textContent = translate("common.live", "Live");
  }

  if (noteNode) {
    noteNode.textContent = translate("homepage.note", "Analisi completa e istruzioni passo passo, pensate anche per chi non e tecnico.");
  }
}

function renderDashboardSidebar(browserEnvironment, dnsEnvironment, webrtcEnvironment) {
  const privacyValueNode = document.getElementById("privacyLevelValue");
  const privacyDescriptionNode = document.getElementById("privacyLevelDescription");
  const architectureValueNode = document.getElementById("architectureValue");
  const dnsProviderNode = document.getElementById("dnsProviderValue");
  const dnsDescriptionNode = document.getElementById("dnsProviderDescription");
  const webrtcStateNode = document.getElementById("webrtcStateValue");
  const webrtcDescriptionNode = document.getElementById("webrtcStateDescription");

  if (privacyValueNode) {
    privacyValueNode.textContent = localizePrivacyLevel(browserEnvironment.privacyLevel);
  }

  if (privacyDescriptionNode) {
    privacyDescriptionNode.textContent = getLocalizedPrivacyLevelDescription(browserEnvironment.privacyLevel);
  }

  if (architectureValueNode) {
    architectureValueNode.textContent = localizeAvailability(browserEnvironment.architecture);
  }

  if (dnsProviderNode) {
    dnsProviderNode.textContent = localizeAvailability(dnsEnvironment.provider);
  }

  if (dnsDescriptionNode) {
    dnsDescriptionNode.textContent = `${localizeKnownDashboardText(dnsEnvironment.identificationMethodLabel || localizeAvailability(dnsEnvironment.privacyLevel))} - ${localizeKnownDashboardText(dnsEnvironment.reliability)}`;
  }

  if (webrtcStateNode) {
    webrtcStateNode.textContent = localizeWebRtcState(webrtcEnvironment.state);
  }

  if (webrtcDescriptionNode) {
    webrtcDescriptionNode.textContent = `${localizeRiskLevel(webrtcEnvironment.riskLevel)} - ${localizePriority(webrtcEnvironment.priority)} - ${localizeKnownDashboardText(webrtcEnvironment.candidateSummary)}`;
  }
}

function renderPrivacyScore(privacyScore) {
  const valueNode = document.getElementById("privacyScoreValue");
  const levelNode = document.getElementById("privacyScoreLevel");
  const descriptionNode = document.getElementById("privacyScoreDescription");
  const progressBar = document.getElementById("privacyScoreBar");

  if (valueNode) {
    valueNode.textContent = `${privacyScore.score}/100`;
  }

  if (levelNode) {
    levelNode.textContent = localizeScoreLevel(privacyScore.level);
  }

  if (descriptionNode) {
    const descriptionKey = privacyScore.level === "Da migliorare" || privacyScore.level === "Needs Improvement"
      ? "dashboard.privacyScore.needsImprovement"
      : privacyScore.level === "Discreto" || privacyScore.level === "Fair"
        ? "dashboard.privacyScore.fair"
        : privacyScore.level === "Buono" || privacyScore.level === "Good"
          ? "dashboard.privacyScore.good"
          : "dashboard.privacyScore.excellent";
    descriptionNode.textContent = translate(descriptionKey, PRIVACY_SCORE_LEVEL_DESCRIPTIONS[privacyScore.level] || PRIVACY_SCORE_LEVEL_DESCRIPTIONS.Buono);
  }

  if (progressBar) {
    progressBar.style.width = `${privacyScore.progress}%`;
    progressBar.textContent = `${privacyScore.progress}%`;
    progressBar.parentElement.setAttribute("aria-valuenow", String(privacyScore.progress));
  }
}

function buildRecommendationStepsMarkup(item) {
  if (Array.isArray(item.steps) && item.steps.length > 0) {
    const steps = item.steps.map((step) => `<li>${step}</li>`).join("");
    return `<ol class="recommendation-steps mb-0 mt-2">${steps}</ol>`;
  }
  return `<p class="mb-0 mt-2">${item.howTo}</p>`;
}

function renderRecommendationCards(rootId, recommendations, options) {
  const root = document.getElementById(rootId);
  if (!root) {
    return;
  }

  const mode = options && options.mode ? options.mode : "dashboard";
  root.innerHTML = "";
  recommendations.forEach((item) => {
    const card = document.createElement("article");
    const toneClass = getResultToneClass(RECOMMENDATION_PRIORITY_TONES[item.priority] || "info");
    const collapseId = `recommendation-details-${item.id}`;
    const localizedPriority = localizeRecommendationPriorityLabel(item.priority);
    const localizedAudience = localizeRecommendationAudience(item.audience);
    const actionMarkup = mode === "optimization"
      ? `
        <button class="btn btn-outline-primary btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
          ${translate("recommendations.button", "Scopri come fare")}
        </button>
      `
      : `<a class="btn btn-outline-primary btn-sm" href="optimization.html#${item.id}">${translate("recommendations.button", "Scopri come fare")}</a>`;
    const detailMarkup = mode === "optimization"
      ? `
        <div class="collapse mt-3" id="${collapseId}">
          <div class="recommendation-detail-box">
            <strong>${translate("recommendations.howTo", "Come fare")}</strong>
            ${buildRecommendationStepsMarkup(item)}
          </div>
        </div>
      `
      : "";

    card.className = `recommendation-card ${toneClass}`;
    card.id = item.id;
    card.innerHTML = `
      <div class="recommendation-card-head">
        <div>
          <div class="recommendation-priority">${localizedPriority}</div>
          <h3 class="h5 mt-2 mb-2">${item.title}</h3>
        </div>
      </div>
      <p class="recommendation-description">${item.description}</p>
      <div class="recommendation-card-footer">
        <span class="recommendation-audience">${localizedAudience}</span>
        ${actionMarkup}
      </div>
      ${detailMarkup}
    `;

    root.appendChild(card);
  });
}

function getJourneyStateTone(journeyStateKey) {
  if (journeyStateKey === "stabilized") {
    return "success";
  }
  if (journeyStateKey === "in_progress" || journeyStateKey === "awaiting_verification") {
    return "warning";
  }
  return "info";
}

function formatJourneyProgress(ratio) {
  return `${Math.round((Number.isFinite(ratio) ? ratio : 0) * 100)}%`;
}

function buildJourneyRecommendationLookup(recommendations) {
  return (recommendations || []).reduce((lookup, item) => {
    if (item && item.id) {
      lookup[item.id] = item;
    }
    return lookup;
  }, {});
}

function selectPrimaryRecommendationId(journey, recommendationsState) {
  const journeySteps = journey && Array.isArray(journey.steps) ? journey.steps : [];
  const firstStep = journeySteps.length ? journeySteps[0] : null;
  const stepRecommendationId = firstStep && Array.isArray(firstStep.sourceRecommendationIds) && firstStep.sourceRecommendationIds.length
    ? firstStep.sourceRecommendationIds[0]
    : null;
  if (stepRecommendationId) {
    return stepRecommendationId;
  }

  const recommendations = recommendationsState && Array.isArray(recommendationsState.recommendations)
    ? recommendationsState.recommendations
    : [];
  return recommendations.length && recommendations[0] && recommendations[0].id ? recommendations[0].id : null;
}

function renderDashboardActionPanel(analysisState, journey, recommendationsState) {
  const root = document.getElementById("dashboardActionPanel");
  if (!root) {
    return;
  }

  const issueNode = root.querySelector("[data-dashboard-action-issue]");
  const actionNode = root.querySelector("[data-dashboard-action-do]");
  const badgeNode = root.querySelector("[data-dashboard-action-badge]");
  const goNode = document.getElementById("dashboardActionGoOptimization");
  const recheckNode = document.getElementById("dashboardActionRecheck");
  const resolvedJourney = journey || FALLBACK_PRIVACY_JOURNEY;
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const dominantRootCauseId = resolvedJourney.entryContext && resolvedJourney.entryContext.mainIssueRootCauseId
    ? resolvedJourney.entryContext.mainIssueRootCauseId
    : resolvedAnalysis.mainIssue && resolvedAnalysis.mainIssue.rootCauseId
      ? resolvedAnalysis.mainIssue.rootCauseId
      : null;
  const dominantIssue = dominantRootCauseId
    ? getReadableRootCauseLabel(dominantRootCauseId)
    : translate("dashboard.action.noIssue", "Nessun problema dominante rilevato");
  const priorityAction = resolvedAnalysis.priorityAction && (resolvedAnalysis.priorityAction.suggestedAction || resolvedAnalysis.priorityAction.title)
    ? resolvedAnalysis.priorityAction.suggestedAction || resolvedAnalysis.priorityAction.title
    : translate("dashboard.action.noAction", "Nessuna azione immediata distinta");
  const localizedPriorityAction = localizeKnownDashboardText(priorityAction);
  const recommendationId = selectPrimaryRecommendationId(resolvedJourney, recommendationsState);

  if (issueNode) {
    issueNode.textContent = dominantIssue;
  }

  if (actionNode) {
    actionNode.textContent = localizedPriorityAction;
  }

  if (badgeNode) {
    badgeNode.className = "status-pill status-info";
    badgeNode.textContent = translate("dashboard.action.badge", "Consigliato");
  }

  if (goNode) {
    goNode.href = recommendationId ? `optimization.html#${recommendationId}` : "optimization.html#optimizationRecommendationSection";
  }

  if (recheckNode) {
    recheckNode.href = "index.html?start=1&target=dashboard";
  }
}

function renderDashboardHubOverview(analysisState, journey, recommendationsState) {
  const journeyStateNode = document.querySelector("[data-dashboard-journey-state]");
  const journeyProgressNode = document.querySelector("[data-dashboard-journey-progress]");
  const journeyFocusNode = document.querySelector("[data-dashboard-journey-focus]");
  const recommendationCountNode = document.querySelector("[data-dashboard-recommendation-count]");
  const recommendationPriorityNode = document.querySelector("[data-dashboard-recommendation-priority]");
  const priorityActionNode = document.querySelector("[data-dashboard-priority-action]");
  const resolvedJourney = journey || FALLBACK_PRIVACY_JOURNEY;
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const recommendations = recommendationsState && Array.isArray(recommendationsState.recommendations)
    ? recommendationsState.recommendations
    : [];
  const dominantRootCauseId = resolvedJourney.entryContext && resolvedJourney.entryContext.mainIssueRootCauseId
    ? resolvedJourney.entryContext.mainIssueRootCauseId
    : resolvedAnalysis.mainIssue && resolvedAnalysis.mainIssue.rootCauseId
      ? resolvedAnalysis.mainIssue.rootCauseId
      : null;

  if (journeyStateNode) {
    journeyStateNode.textContent = localizeJourneyStateLabel(
      resolvedJourney.journeyState && resolvedJourney.journeyState.label,
      resolvedJourney.journeyState && resolvedJourney.journeyState.key
    );
  }

  if (journeyProgressNode) {
    journeyProgressNode.textContent = formatJourneyProgress(resolvedJourney.journeyState && resolvedJourney.journeyState.progressRatio);
  }

  if (journeyFocusNode) {
    journeyFocusNode.textContent = dominantRootCauseId
      ? translate("dashboard.home.journeyFocus", "Focus iniziale: {rootCause}.", {
        rootCause: getReadableRootCauseLabel(dominantRootCauseId)
      })
      : translate("dashboard.home.journeyFocusNone", "Non emerge una causa dominante: il percorso serve soprattutto a mantenere stabile la configurazione.");
  }

  if (recommendationCountNode) {
    recommendationCountNode.textContent = String(recommendations.length);
  }

  if (recommendationPriorityNode) {
    recommendationPriorityNode.textContent = recommendations.length > 0
      ? localizeRecommendationPriorityLabel(recommendations[0].priority)
      : translate("dashboard.home.noRecommendations", "Nessuna");
  }

  if (priorityActionNode) {
    priorityActionNode.textContent = resolvedAnalysis.priorityAction && resolvedAnalysis.priorityAction.suggestedAction
      ? resolvedAnalysis.priorityAction.suggestedAction
      : resolvedAnalysis.priorityAction && resolvedAnalysis.priorityAction.title
        ? resolvedAnalysis.priorityAction.title
        : translate("dashboard.home.priorityActionNone", "Non emerge una singola azione iniziale prioritaria.");
  }
}

function renderOptimizationJourneySummary(browserEnvironment, privacyScore, journey) {
  renderOptimizationSummary(browserEnvironment, privacyScore);

  const journeyStateNode = document.querySelector("[data-optimization-journey-state]");
  if (journeyStateNode) {
    journeyStateNode.textContent = localizeJourneyStateLabel(
      journey && journey.journeyState ? journey.journeyState.label : null,
      journey && journey.journeyState ? journey.journeyState.key : null
    );
  }
}

function renderOptimizationActionPanel(analysisState, journey, recommendationsState) {
  const root = document.getElementById("optimizationActionPanel");
  if (!root) {
    return;
  }

  const issueNode = root.querySelector("[data-optimization-action-issue]");
  const actionNode = root.querySelector("[data-optimization-action-do]");
  const badgeNode = root.querySelector("[data-optimization-action-badge]");
  const openNode = document.getElementById("optimizationActionOpenHowTo");
  const recheckNode = document.getElementById("optimizationActionRecheck");
  const resolvedJourney = journey || FALLBACK_PRIVACY_JOURNEY;
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const dominantRootCauseId = resolvedJourney.entryContext && resolvedJourney.entryContext.mainIssueRootCauseId
    ? resolvedJourney.entryContext.mainIssueRootCauseId
    : resolvedAnalysis.mainIssue && resolvedAnalysis.mainIssue.rootCauseId
      ? resolvedAnalysis.mainIssue.rootCauseId
      : null;
  const dominantIssue = dominantRootCauseId
    ? getReadableRootCauseLabel(dominantRootCauseId)
    : translate("optimization.action.noIssue", "Nessun problema dominante rilevato");
  const priorityAction = resolvedAnalysis.priorityAction && (resolvedAnalysis.priorityAction.suggestedAction || resolvedAnalysis.priorityAction.title)
    ? resolvedAnalysis.priorityAction.suggestedAction || resolvedAnalysis.priorityAction.title
    : translate("optimization.action.noAction", "Nessuna azione immediata distinta");
  const localizedPriorityAction = localizeKnownDashboardText(priorityAction);
  const recommendationId = selectPrimaryRecommendationId(resolvedJourney, recommendationsState);

  if (issueNode) {
    issueNode.textContent = dominantIssue;
  }

  if (actionNode) {
    actionNode.textContent = localizedPriorityAction;
  }

  if (badgeNode) {
    badgeNode.className = "status-pill status-info";
    badgeNode.textContent = translate("optimization.action.badge", "Operativo");
  }

  if (openNode) {
    openNode.href = recommendationId ? `#${recommendationId}` : "#optimizationRecommendationSection";
  }

  if (recheckNode) {
    recheckNode.href = recommendationId
      ? `index.html?start=1&target=optimization&focus=${encodeURIComponent(recommendationId)}`
      : "index.html?start=1&target=optimization";
  }
}

function focusRecommendationFromHash() {
  const rawHash = typeof window.location.hash === "string" ? window.location.hash.trim() : "";
  if (!rawHash || rawHash.length < 2) {
    return;
  }

  const targetId = rawHash.slice(1);
  const card = document.getElementById(targetId);
  if (!card) {
    return;
  }

  try {
    card.classList.add("is-focus");
    window.setTimeout(() => card.classList.remove("is-focus"), 1600);
  } catch (error) {
  }

  try {
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
  }

  const collapseNode = document.getElementById(`recommendation-details-${targetId}`);
  if (collapseNode && window.bootstrap && window.bootstrap.Collapse) {
    window.bootstrap.Collapse.getOrCreateInstance(collapseNode, { toggle: false }).show();
  }
}

function renderJourneyHero(journey, analysisState) {
  const root = document.getElementById("optimizationJourneyHero");
  if (!root) {
    return;
  }

  const resolvedJourney = journey || FALLBACK_PRIVACY_JOURNEY;
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const stateLabel = localizeJourneyStateLabel(
    resolvedJourney.journeyState && resolvedJourney.journeyState.label,
    resolvedJourney.journeyState && resolvedJourney.journeyState.key
  );
  const stateTone = getJourneyStateTone(resolvedJourney.journeyState && resolvedJourney.journeyState.key);
  const dominantRootCauseId = resolvedJourney.entryContext && resolvedJourney.entryContext.mainIssueRootCauseId
    ? resolvedJourney.entryContext.mainIssueRootCauseId
    : resolvedAnalysis.mainIssue && resolvedAnalysis.mainIssue.rootCauseId
      ? resolvedAnalysis.mainIssue.rootCauseId
      : null;
  const dominantIssue = dominantRootCauseId
    ? getReadableRootCauseLabel(dominantRootCauseId)
    : translate("journey.hero.noDominantIssue", "Nessuna causa dominante da correggere");
  const priorityAction = resolvedAnalysis.priorityAction && (resolvedAnalysis.priorityAction.suggestedAction || resolvedAnalysis.priorityAction.title)
    ? resolvedAnalysis.priorityAction.suggestedAction || resolvedAnalysis.priorityAction.title
    : translate("journey.hero.noPriorityAction", "Nessuna azione immediata distinta");
  const localizedPriorityAction = localizeKnownDashboardText(priorityAction);
  const progressValue = formatJourneyProgress(resolvedJourney.journeyState && resolvedJourney.journeyState.progressRatio);

  root.innerHTML = `
    <div class="journey-hero-panel">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <span class="eyebrow">${escapeHtml(translate("journey.hero.eyebrow", "Journey 0.8.3"))}</span>
          <h2 class="h4 mt-2 mb-1">${escapeHtml(translate("journey.hero.title", "Percorso principale suggerito"))}</h2>
          <p class="text-secondary mb-0">${escapeHtml(resolvedJourney.reasoning && resolvedJourney.reasoning.journeyEntryReason
            ? resolvedJourney.reasoning.journeyEntryReason
            : translate("journey.hero.description", "Il Journey ordina pochi step prioritari e osservabili."))}</p>
        </div>
        <span class="status-pill status-${escapeHtml(stateTone)}">${escapeHtml(stateLabel)}</span>
      </div>
      <div class="journey-progress-box mt-4">
        <div class="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div>
            <span class="summary-label">${escapeHtml(translate("journey.hero.progressLabel", "Avanzamento osservato"))}</span>
            <strong class="d-block mt-1">${escapeHtml(progressValue)}</strong>
          </div>
          <div>
            <span class="summary-label">${escapeHtml(translate("journey.hero.intentLabel", "Intento del percorso"))}</span>
            <strong class="d-block mt-1">${escapeHtml(localizeJourneyIntent(resolvedJourney.journeyState && resolvedJourney.journeyState.progressIntent))}</strong>
          </div>
          <div>
            <span class="summary-label">${escapeHtml(translate("journey.hero.stepsLabel", "Step principali"))}</span>
            <strong class="d-block mt-1">${escapeHtml(`${resolvedJourney.journeyState ? resolvedJourney.journeyState.observedCompletedPrimarySteps : 0}/${resolvedJourney.journeyState ? resolvedJourney.journeyState.totalPrimarySteps : 0}`)}</strong>
          </div>
        </div>
        <div class="progress soft-progress mt-3" role="progressbar" aria-label="${escapeHtml(translate("journey.hero.progressAria", "Avanzamento Journey"))}" aria-valuenow="${Math.round((resolvedJourney.journeyState && resolvedJourney.journeyState.progressRatio ? resolvedJourney.journeyState.progressRatio : 0) * 100)}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar" style="width: ${progressValue}">${escapeHtml(progressValue)}</div>
        </div>
      </div>
      <div class="row g-3 mt-1">
        <div class="col-md-6">
          <div class="soft-box h-100">
            <span class="summary-label">${escapeHtml(translate("journey.hero.dominantIssueLabel", "Problema dominante"))}</span>
            <strong class="d-block mt-1">${escapeHtml(dominantIssue)}</strong>
          </div>
        </div>
        <div class="col-md-6">
          <div class="soft-box h-100">
            <span class="summary-label">${escapeHtml(translate("journey.hero.priorityActionLabel", "Azione prioritaria"))}</span>
            <strong class="d-block mt-1">${escapeHtml(localizedPriorityAction)}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderJourneyStepList(rootId, steps, recommendationsLookup, options) {
  const root = document.getElementById(rootId);
  if (!root) {
    return;
  }

  const resolvedSteps = Array.isArray(steps) ? steps : [];
  const mode = options && options.mode ? options.mode : "primary";
  const emptyTitle = options && options.emptyTitle
    ? options.emptyTitle
    : translate("journey.empty.defaultTitle", "Nessun elemento disponibile");
  const emptyDescription = options && options.emptyDescription
    ? options.emptyDescription
    : translate("journey.empty.defaultDescription", "Questa sezione non contiene ancora elementi da mostrare.");

  if (!resolvedSteps.length) {
    root.innerHTML = `
      <div class="soft-box journey-empty-box">
        <strong>${escapeHtml(emptyTitle)}</strong>
        <p class="text-secondary mt-2 mb-0">${escapeHtml(emptyDescription)}</p>
      </div>
    `;
    return;
  }

  root.innerHTML = resolvedSteps.map((step) => {
    if (mode === "nonApplicable") {
      const nonApplicableTitle = localizeKnownDashboardText(
        step.title || translate("journey.nonApplicable.unknown", "Azione non classificata")
      );
      const nonApplicableReason = localizeKnownDashboardText(
        step.exclusionReason || translate("journey.nonApplicable.defaultReason", "Questa azione non e ancora applicabile nel percorso principale.")
      );
      return `
        <div class="report-item ${getResultToneClass("info")}">
          <div>
            <strong>${escapeHtml(nonApplicableTitle)}</strong>
            <p class="mt-2">${escapeHtml(nonApplicableReason)}</p>
          </div>
        </div>
      `;
    }

    if (mode === "deferred") {
      const linkedRecommendation = recommendationsLookup && step.recommendationRef
        ? recommendationsLookup[step.recommendationRef]
        : null;
      const linkedRootCause = step.rootCauseId ? getReadableRootCauseLabel(step.rootCauseId) : translate("journey.rootCause.unknown", "Causa funzionale non classificata");
      const deferredTitle = localizeKnownDashboardText(
        step.title || translate("journey.deferred.unknown", "Suggerimento differito")
      );
      const deferredReason = localizeKnownDashboardText(
        step.reason || translate("journey.deferred.defaultReason", "Suggerimento utile ma non prioritario nel percorso principale.")
      );

      return `
        <div class="report-item ${getResultToneClass("info")}">
          <div>
            <strong>${escapeHtml(deferredTitle)}</strong>
            <p class="mt-2">${escapeHtml(deferredReason)}</p>
            <p class="text-secondary small mt-2 mb-0">${escapeHtml(translate("journey.deferred.rootCause", "Causa funzionale collegata: {rootCause}.", { rootCause: linkedRootCause }))}</p>
          </div>
          ${linkedRecommendation ? `<a class="btn btn-outline-primary btn-sm align-self-start" href="#${escapeHtml(linkedRecommendation.id)}">${escapeHtml(translate("journey.deferred.openRecommendation", "Apri suggerimento"))}</a>` : ""}
        </div>
      `;
    }

    const recommendationId = step.sourceRecommendationIds && step.sourceRecommendationIds.length > 0
      ? step.sourceRecommendationIds[0]
      : null;
    const completionEvidence = Array.isArray(step.completionEvidence) && step.completionEvidence.length > 0
      ? step.completionEvidence[0]
      : "";
    const notes = Array.isArray(step.notes) && step.notes.length > 0 ? step.notes[0] : "";
    const localizedTitle = localizeKnownDashboardText(
      step.title || translate("journey.step.unknown", "Step non classificato")
    );
    const localizedGoal = localizeKnownDashboardText(
      step.goal || step.whyNow || translate("journey.step.noGoal", "Nessun obiettivo descritto.")
    );
    const localizedWhyNow = localizeKnownDashboardText(
      step.whyNow || translate("journey.step.noWhyNow", "Nessuna motivazione aggiuntiva disponibile.")
    );
    const localizedCompletionEvidence = localizeKnownDashboardText(completionEvidence);
    const localizedNote = localizeKnownDashboardText(notes);

    return `
      <article class="journey-step-card ${getResultToneClass(mode === "optional" ? "success" : "warning")}">
        <div class="journey-step-head">
          <div>
            <div class="journey-step-order">${escapeHtml(translate("journey.step.order", "Step {order}", { order: step.order || 0 }))}</div>
            <h3 class="h5 mt-2 mb-1">${escapeHtml(localizedTitle)}</h3>
          </div>
          <span class="status-pill status-${escapeHtml(mode === "optional" ? "success" : "warning")}">${escapeHtml(localizeJourneyKind(step.kind))}</span>
        </div>
        <p class="text-secondary mb-0">${escapeHtml(localizedGoal)}</p>
        <div class="journey-step-meta">
          <span>${escapeHtml(translate("journey.step.rootCause", "Causa funzionale"))}: ${escapeHtml(step.rootCauseId ? getReadableRootCauseLabel(step.rootCauseId) : translate("journey.rootCause.unknown", "Non classificata"))}</span>
          <span>${escapeHtml(translate("journey.step.expectedBenefit", "Beneficio atteso"))}: ${escapeHtml(localizeJourneyBenefit(step.expectedBenefit))}</span>
          <span>${escapeHtml(translate("journey.step.userControl", "Controllo utente"))}: ${escapeHtml(localizeUserControl(step.userControl))}</span>
          <span>${escapeHtml(translate("journey.step.completion", "Stato osservato"))}: ${escapeHtml(localizeJourneyCompletionState(step.completionState))}</span>
          <span>${escapeHtml(translate("journey.step.verification", "Verifica"))}: ${escapeHtml(localizeJourneyVerificationStatus(step.verificationState))}</span>
        </div>
        <div class="soft-box mt-3">
          <strong>${escapeHtml(translate("journey.step.whyNowLabel", "Perche adesso"))}</strong>
          <p class="text-secondary mt-2 mb-0">${escapeHtml(localizedWhyNow)}</p>
        </div>
        ${localizedCompletionEvidence ? `
          <p class="text-secondary small mt-3 mb-0">${escapeHtml(translate("journey.step.evidenceLabel", "Evidenza di completamento"))}: ${escapeHtml(localizedCompletionEvidence)}</p>
        ` : ""}
        ${localizedNote ? `
          <p class="text-secondary small mt-2 mb-0">${escapeHtml(localizedNote)}</p>
        ` : ""}
        ${recommendationId ? `
          <a class="btn btn-outline-primary btn-sm mt-3" href="#${escapeHtml(recommendationId)}">${escapeHtml(translate("journey.step.openRecommendation", "Apri raccomandazione collegata"))}</a>
        ` : ""}
      </article>
    `;
  }).join("");
}

function renderOptimizationSummary(browserEnvironment, privacyScore) {
  const browserNode = document.querySelector("[data-optimization-browser]");
  const familyNode = document.querySelector("[data-optimization-family]");
  const osNode = document.querySelector("[data-optimization-os]");
  const scoreNode = document.querySelector("[data-optimization-score]");

  if (browserNode) {
    browserNode.textContent = localizeAvailability(browserEnvironment.browser);
  }

  if (familyNode) {
    familyNode.textContent = localizeAvailability(browserEnvironment.family);
  }

  if (osNode) {
    osNode.textContent = localizeAvailability(browserEnvironment.os);
  }

  if (scoreNode) {
    scoreNode.textContent = translate("optimization.scoreFormat", `${privacyScore.score}/100 - ${privacyScore.level}`, {
      score: privacyScore.score,
      level: localizeScoreLevel(privacyScore.level)
    });
  }
}

function getPhaseStatusBadge(status) {
  const badge = document.createElement("span");
  let tone = "info";
  let text = translate("analysis.waiting", "In attesa");

  if (status === "active") {
    tone = "warning";
    text = translate("analysis.inProgress", "In corso");
  }

  if (status === "completed") {
    tone = "success";
    text = translate("analysis.completed", "Completato");
  }

  badge.className = `status-pill status-${tone} analysis-phase-status`;
  badge.textContent = text;
  return badge;
}

function renderAnalysisPhases(activeIndex, completedKeys) {
  const phaseList = document.getElementById("analysisPhaseList");
  if (!phaseList) {
    return;
  }

  phaseList.innerHTML = "";
  ANALYSIS_PHASES.forEach((phase, index) => {
    const card = document.createElement("div");
    const isCompleted = completedKeys.has(phase.key);
    const isActive = index === activeIndex && !isCompleted;
    const status = isCompleted ? "completed" : isActive ? "active" : "pending";
    const progressValue = isCompleted ? 100 : isActive ? 70 : 0;
    const localizedTitle = getLocalizedPhaseTitle(phase.key, phase.title);
    const localizedDescription = getLocalizedPhaseDescription(phase.key, phase.description);

    card.className = `analysis-phase-card ${isCompleted ? "is-completed" : isActive ? "is-active" : "is-pending"}`;
    card.innerHTML = `
      <div class="analysis-phase-head">
        <div>
          <div class="analysis-phase-step">${localizePhaseStepLabel(index)}</div>
          <h3 class="h5 mt-2 mb-0">${localizedTitle}</h3>
        </div>
      </div>
      <p class="analysis-phase-description">${localizedDescription}</p>
      <div class="analysis-phase-progress" aria-hidden="true">
        <div class="analysis-phase-progress-bar" style="width: ${progressValue}%"></div>
      </div>
    `;
    card.querySelector(".analysis-phase-head").appendChild(getPhaseStatusBadge(status));
    phaseList.appendChild(card);
  });
}

function updateAnalysisHeader(title, description, percent) {
  const titleNode = document.querySelector("[data-analysis-current-title]");
  const descriptionNode = document.querySelector("[data-analysis-current-description]");
  const percentNode = document.querySelector("[data-analysis-percent]");
  const progressBar = document.querySelector("[data-analysis-progress-bar]");

  if (titleNode) {
    titleNode.textContent = title;
  }

  if (descriptionNode) {
    descriptionNode.textContent = description;
  }

  if (percentNode) {
    percentNode.textContent = `${percent}%`;
  }

  if (progressBar) {
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
    progressBar.parentElement.setAttribute("aria-valuenow", String(percent));
  }
}

function renderAnalysisPreview(browserEnvironment, dnsEnvironment, webrtcEnvironment) {
  const browserNode = document.querySelector("[data-analysis-browser]");
  const osNode = document.querySelector("[data-analysis-os]");
  const familyNode = document.querySelector("[data-analysis-family]");
  const levelNode = document.querySelector("[data-analysis-level]");
  const dnsNode = document.querySelector("[data-analysis-dns]");
  const webrtcNode = document.querySelector("[data-analysis-webrtc]");

  if (browserNode) {
    browserNode.textContent = localizeAvailability(browserEnvironment.browser);
  }
  if (osNode) {
    osNode.textContent = localizeAvailability(browserEnvironment.os);
  }
  if (familyNode) {
    familyNode.textContent = localizeAvailability(browserEnvironment.family);
  }
  if (levelNode) {
    levelNode.textContent = localizePrivacyLevel(browserEnvironment.privacyLevel);
  }
  if (dnsNode) {
    dnsNode.textContent = localizeAvailability(dnsEnvironment.provider);
  }
  if (webrtcNode) {
    webrtcNode.textContent = localizeWebRtcState(webrtcEnvironment.state);
  }
}

function renderHomepageAnalysisPreview(browserEnvironment) {
  const browserNode = document.querySelector("[data-home-analysis-browser]");
  const osNode = document.querySelector("[data-home-analysis-os]");
  const familyNode = document.querySelector("[data-home-analysis-family]");
  const levelNode = document.querySelector("[data-home-analysis-level]");

  if (browserNode) {
    browserNode.textContent = localizeAvailability(browserEnvironment.browser);
  }

  if (osNode) {
    osNode.textContent = localizeAvailability(browserEnvironment.os);
  }

  if (familyNode) {
    familyNode.textContent = localizeAvailability(browserEnvironment.family);
  }

  if (levelNode) {
    levelNode.textContent = localizePrivacyLevel(browserEnvironment.privacyLevel);
  }
}

function renderHomepageAnalysisPhases(activeIndex, completedKeys) {
  const phaseList = document.getElementById("homeAnalysisPhaseList");
  if (!phaseList) {
    return;
  }

  phaseList.innerHTML = "";
  ANALYSIS_PHASES.forEach((phase, index) => {
    const card = document.createElement("div");
    const isCompleted = completedKeys.has(phase.key);
    const isActive = index === activeIndex && !isCompleted;
    const status = isCompleted ? "completed" : isActive ? "active" : "pending";
    const progressValue = isCompleted ? 100 : isActive ? 70 : 0;
    const localizedTitle = getLocalizedPhaseTitle(phase.key, phase.title);
    const localizedDescription = getLocalizedPhaseDescription(phase.key, phase.description);

    card.className = `analysis-phase-card ${isCompleted ? "is-completed" : isActive ? "is-active" : "is-pending"}`;
    card.innerHTML = `
      <div class="analysis-phase-head">
        <div>
          <div class="analysis-phase-step">${localizePhaseStepLabel(index)}</div>
          <h3 class="h5 mt-2 mb-0">${localizedTitle}</h3>
        </div>
      </div>
      <p class="analysis-phase-description">${localizedDescription}</p>
      <div class="analysis-phase-progress" aria-hidden="true">
        <div class="analysis-phase-progress-bar" style="width: ${progressValue}%"></div>
      </div>
    `;
    card.querySelector(".analysis-phase-head").appendChild(getPhaseStatusBadge(status));
    phaseList.appendChild(card);
  });
}

function updateHomepageAnalysisHeader(title, description, percent) {
  const titleNode = document.querySelector("[data-home-analysis-current-title]");
  const descriptionNode = document.querySelector("[data-home-analysis-current-description]");
  const percentNode = document.querySelector("[data-home-analysis-percent]");
  const progressBar = document.querySelector("[data-home-analysis-progress-bar]");

  if (titleNode) {
    titleNode.textContent = title;
  }

  if (descriptionNode) {
    descriptionNode.textContent = description;
  }

  if (percentNode) {
    percentNode.textContent = `${percent}%`;
  }

  if (progressBar) {
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
    progressBar.parentElement.setAttribute("aria-valuenow", String(percent));
  }
}

let homepageAnalysisRunId = 0;

async function startHomepageAnalysisFlow() {
  const modalRoot = document.getElementById("homeAnalysisModal");
  if (!modalRoot || !window.bootstrap || !window.bootstrap.Modal) {
    window.location.href = "dashboard.html";
    return;
  }

  const modal = window.bootstrap.Modal.getOrCreateInstance(modalRoot, {
    backdrop: "static",
    keyboard: false
  });
  const currentRunId = Date.now();
  const completedKeys = new Set();
  const badgeNode = document.querySelector("[data-home-analysis-badge]");

  homepageAnalysisRunId = currentRunId;
  modal.show();
  renderHomepageAnalysisPhases(-1, completedKeys);
  updateHomepageAnalysisHeader(
    translate("analysis.preparingStepsTitle", "Preparazione delle fasi..."),
    translate("analysis.preparingStepsDescription", "Tra pochi istanti iniziera il controllo guidato."),
    0
  );

  if (badgeNode) {
    badgeNode.className = "status-pill status-info";
    badgeNode.textContent = translate("analysis.inProgress", "In corso");
  }

  await sleep(250);
  if (homepageAnalysisRunId !== currentRunId) {
    return;
  }

  const browserEnvironment = await getBrowserEnvironment();
  if (homepageAnalysisRunId !== currentRunId) {
    return;
  }

  renderHomepageAnalysisPreview(browserEnvironment);
  const stepPercent = Math.round(100 / ANALYSIS_PHASES.length);

  for (let index = 0; index < ANALYSIS_PHASES.length; index += 1) {
    const phase = ANALYSIS_PHASES[index];
    const localizedTitle = getLocalizedPhaseTitle(phase.key, phase.title);
    const localizedDescription = getLocalizedPhaseDescription(phase.key, phase.description);

    renderHomepageAnalysisPhases(index, completedKeys);
    updateHomepageAnalysisHeader(localizedTitle, localizedDescription, index * stepPercent);
    await sleep(index === 0 ? 850 : 700);
    if (homepageAnalysisRunId !== currentRunId) {
      return;
    }

    completedKeys.add(phase.key);
    renderHomepageAnalysisPhases(index, completedKeys);
    updateHomepageAnalysisHeader(
      localizedTitle,
      `${localizedTitle} ${translate("analysis.completedSentence", "completato")}.`,
      Math.min(100, (index + 1) * stepPercent)
    );
    await sleep(260);
    if (homepageAnalysisRunId !== currentRunId) {
      return;
    }
  }

  if (badgeNode) {
    badgeNode.className = "status-pill status-success";
    badgeNode.textContent = translate("analysis.completed", "Completata");
  }

  updateHomepageAnalysisHeader(
    translate("analysis.completedTitle", "Analisi completata"),
    translate("analysis.completedDescription", "Sto aprendo la dashboard con i risultati disponibili."),
    100
  );

  await sleep(650);
  if (homepageAnalysisRunId !== currentRunId) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const target = params.get("target");
  const focus = params.get("focus");
  let destination = "dashboard.html";
  if (target === "optimization") {
    destination = "optimization.html";
  }
  if (target === "analysis") {
    destination = "analysis.html";
  }
  if (focus && destination !== "dashboard.html") {
    const safeFocus = String(focus).replace(/[^A-Za-z0-9_-]/g, "");
    if (safeFocus) {
      destination = `${destination}#${safeFocus}`;
    }
  }
  window.location.href = destination;
}

async function initHomepage() {
  const startButtons = Array.from(document.querySelectorAll("[data-home-start-analysis]"));
  const homepageRoot = document.querySelector("[data-home-browser]");
  if (!homepageRoot) {
    return;
  }

  try {
    const browserEnvironment = await getBrowserEnvironment();
    renderHomepagePreview(browserEnvironment);
  } catch (error) {
    // Keep homepage usable even if live preview fails.
  }

  startButtons.forEach((button) => {
    button.addEventListener("click", () => {
      startHomepageAnalysisFlow();
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("start") === "1") {
    await sleep(50);
    startHomepageAnalysisFlow();
  }

  const modalRoot = document.getElementById("homeAnalysisModal");
  if (modalRoot) {
    modalRoot.addEventListener("hidden.bs.modal", () => {
      homepageAnalysisRunId = 0;
    });
  }
}

function localizeRootCausePolarity(value) {
  const normalizedValue = typeof value === "string" ? value.toLowerCase() : "";

  if (normalizedValue === "negative") {
    return translate("analysis.rootCause.polarity.negative", "Negativa");
  }

  if (normalizedValue === "positive") {
    return translate("analysis.rootCause.polarity.positive", "Positiva");
  }

  if (normalizedValue === "neutral") {
    return translate("analysis.rootCause.polarity.neutral", "Neutra");
  }

  return translate("analysis.rootCause.polarity.unknown", "Non classificata");
}

function buildAnalysisRootCauseReportData(rootCauseState) {
  const createdRootCauses = rootCauseState && Array.isArray(rootCauseState.createdRootCauses)
    ? rootCauseState.createdRootCauses
    : [];

  if (!createdRootCauses.length) {
    return [
      {
        title: translate("analysis.rootCause.emptyTitle", "Nessuna Root Cause osservata"),
        description: translate("analysis.rootCause.emptyDescription", "Il layer causale non ha prodotto cause aggregate da mostrare in questa lettura."),
        tone: "info"
      }
    ];
  }

  return createdRootCauses.map((item) => {
    const observedState = item && item.observedState ? item.observedState : {};
    const confidenceValue = observedState.confidence && typeof observedState.confidence.overallConfidence === "number"
      ? formatConfidenceValue(observedState.confidence.overallConfidence)
      : translate("analysis.rootCause.confidenceUnavailable", "Non disponibile");
    const details = [
      translate("analysis.rootCause.observedState", "Stato osservato: {state}.", {
        state: localizeRootCausePolarity(observedState.dominantPolarity)
      }),
      translate("analysis.rootCause.severity", "Gravita: {severity}.", {
        severity: localizeSeverity(observedState.strongestIntrinsicSeverity)
      }),
      translate("analysis.rootCause.priority", "Priorita: {priority}.", {
        priority: localizePriority(observedState.highestSuggestedPriority)
      }),
      translate("analysis.rootCause.confidence", "Confidenza: {confidence}.", {
        confidence: confidenceValue
      }),
      translate("analysis.rootCause.signalCount", "Segnali collegati: {count}.", {
        count: Array.isArray(item.signalIds) ? item.signalIds.length : 0
      })
    ];

    if (observedState.representativeSignalId) {
      details.push(translate("analysis.rootCause.referenceSignal", "Segnale guida: {signalId}.", {
        signalId: observedState.representativeSignalId
      }));
    }

    return {
      title: getReadableRootCauseLabel(item.rootCauseId),
      description: details.join(" "),
      tone: observedState.dominantPolarity === "negative"
        ? "warning"
        : observedState.dominantPolarity === "positive"
          ? "success"
          : "info"
    };
  });
}

function buildAnalysisTechnicalReportData(browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment, privacyScore) {
  return [
    {
      title: translate("analysis.technical.browser", "Base browser"),
      description: translate("analysis.technical.browserDescription", "{browser} - livello privacy {level}.", {
        browser: localizeAvailability(browserEnvironment.browser),
        level: localizePrivacyLevel(browserEnvironment.privacyLevel)
      }),
      tone: "info"
    },
    {
      title: translate("analysis.technical.network", "Profilo di rete"),
      description: translate("analysis.technical.networkDescription", "Do Not Track: {dnt}. Lingua: {language}. Timezone: {timezone}.", {
        dnt: localizeDoNotTrackValue(networkEnvironment.doNotTrack),
        language: localizeAvailability(networkEnvironment.browserLanguage),
        timezone: localizeAvailability(networkEnvironment.timezone)
      }),
      tone: "info"
    },
    {
      title: translate("analysis.technical.dns", "Contesto DNS"),
      description: translate("analysis.technical.dnsDescription", "Resolver osservato: {provider}. Affidabilita: {reliability} ({confidence}).", {
        provider: localizeAvailability(dnsEnvironment.provider),
        reliability: localizeKnownDashboardText(dnsEnvironment.reliability || "Non disponibile"),
        confidence: formatConfidenceValue(dnsEnvironment.confidence)
      }),
      tone: dnsEnvironment.reliability === "Alta" ? "success" : dnsEnvironment.reliability === "Media" ? "info" : "warning"
    },
    {
      title: translate("analysis.technical.webrtc", "Stato WebRTC"),
      description: translate("analysis.technical.webrtcDescription", "Il browser mostra lo stato {state}.", {
        state: localizeWebRtcState(webrtcEnvironment.state)
      }),
      tone: webrtcEnvironment.risk === "Alto" ? "warning" : webrtcEnvironment.risk === "Medio" ? "info" : "success"
    },
    {
      title: translate("analysis.technical.score", "Privacy Score"),
      description: translate("analysis.technical.scoreDescription", "Sintesi attuale: {score}/100 - {level}.", {
        score: privacyScore.score,
        level: localizeScoreLevel(privacyScore.level)
      }),
      tone: privacyScore.level === "Ottimo" || privacyScore.level === "Buono"
        ? "success"
        : privacyScore.level === "Discreto"
          ? "info"
          : "warning"
    },
    {
      title: translate("analysis.technical.scope", "Copertura attiva"),
      description: translate("analysis.technical.scopeDescription", "Browser, rete, provider DNS, DNSSEC, WebRTC, DNS Leak, osservazione VPN, Privacy Score e raccomandazioni passo passo sono attivi. Restano futuri il DoH completo e il supporto Safari.", {}),
      tone: "info"
    }
  ];
}

function renderAnalysisOverview(analysisState, privacyScore) {
  const resolvedAnalysis = analysisState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS;
  const badgeNode = document.querySelector("[data-analysis-badge]");
  const overallStateNode = document.querySelector("[data-analysis-overall-state]");
  const dominantCauseNode = document.querySelector("[data-analysis-dominant-cause]");
  const confidenceNode = document.querySelector("[data-analysis-confidence]");
  const scoreNode = document.querySelector("[data-analysis-score]");
  const overallState = resolvedAnalysis.overallState || FALLBACK_PRIVACY_INTELLIGENCE_ANALYSIS.overallState;
  const dominantRootCauseId = resolvedAnalysis.mainIssue && resolvedAnalysis.mainIssue.rootCauseId
    ? resolvedAnalysis.mainIssue.rootCauseId
    : null;

  updateAnalysisHeader(
    translate("analysis.header.title", "Sto rileggendo lo stato generale della configurazione"),
    translate("analysis.header.description", "Il motore aggrega le Root Causes osservate e costruisce una lettura spiegabile del contesto attuale."),
    100
  );

  if (badgeNode) {
    badgeNode.className = `status-pill status-${getOverallStateTone(overallState.key)}`;
    badgeNode.textContent = translate("analysis.header.badge", "Root Cause Driven");
  }

  if (overallStateNode) {
    overallStateNode.textContent = localizeOverallStateLabel(overallState.label, overallState.key);
  }

  if (dominantCauseNode) {
    dominantCauseNode.textContent = dominantRootCauseId
      ? getReadableRootCauseLabel(dominantRootCauseId)
      : translate("analysis.header.noDominantCause", "Nessun problema dominante rilevato");
  }

  if (confidenceNode) {
    confidenceNode.textContent = formatConfidenceValue(resolvedAnalysis.overallConfidence);
  }

  if (scoreNode) {
    scoreNode.textContent = translate("analysis.technical.scoreDescription", "{score}/100 - {level}.", {
      score: privacyScore.score,
      level: localizeScoreLevel(privacyScore.level)
    });
  }
}

async function initAnalysisPage() {
  const pageRoot = document.getElementById("analysisIntroEyebrow");
  if (!pageRoot) {
    return;
  }

  const [browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment] = await Promise.all([
    getBrowserEnvironment(),
    getNetworkEnvironment(),
    getDnsEnvironment(),
    getWebRtcEnvironment()
  ]);
  const privacyScore = getPrivacyScore(browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment);
  const dnsLeakEnvironment = await getDnsLeakEnvironment(dnsEnvironment);
  const dnsSecurityEnvironment = await getDnsSecurityEnvironment(dnsEnvironment);
  const vpnEnvironment = await getVpnEnvironment();
  const privacyIntelligenceSignals = getPrivacyIntelligenceSignals({
    browserEnvironment,
    networkEnvironment,
    dnsEnvironment,
    dnsLeakEnvironment,
    dnsSecurityEnvironment,
    vpnEnvironment,
    webrtcEnvironment,
    privacyScore
  });
  storePrivacyIntelligenceSignals(privacyIntelligenceSignals, "analysis");
  const privacyRootCauses = getPrivacyRootCausesFromStoredSignals();
  storePrivacyRootCauses(privacyRootCauses, "analysis");
  const privacyAnalysis = getPrivacyIntelligenceAnalysisFromStoredSignals();
  storePrivacyIntelligenceAnalysis(privacyAnalysis, "analysis");

  renderAnalysisPreview(browserEnvironment, dnsEnvironment, webrtcEnvironment);
  renderAnalysisOverview(privacyAnalysis, privacyScore);
  renderPrivacyIntelligenceDetailCard(
    "privacyIntelligenceMainIssueCard",
    buildPrivacyIntelligenceMainIssueModel(privacyAnalysis),
    "warning"
  );
  renderPrivacyIntelligenceDetailCard(
    "privacyIntelligencePriorityActionCard",
    buildPrivacyIntelligencePriorityActionModel(privacyAnalysis),
    "info"
  );
  renderPrivacyIntelligenceStrengths(buildPrivacyIntelligenceStrengthsModel(privacyAnalysis));
  renderPrivacyIntelligenceReasoning(buildPrivacyIntelligenceReasoningModel(privacyAnalysis));
  renderSimpleReportList("analysisRootCauseList", buildAnalysisRootCauseReportData(privacyRootCauses));
  renderSimpleReportList(
    "analysisTechnicalList",
    buildAnalysisTechnicalReportData(browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment, privacyScore)
  );
}

async function initDashboard() {
  const dashboardRoot = document.getElementById("dashboardIntroEyebrow");
  if (!dashboardRoot) {
    return;
  }

  const [browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment] = await Promise.all([
    getBrowserEnvironment(),
    getNetworkEnvironment(),
    getDnsEnvironment(),
    getWebRtcEnvironment()
  ]);
  const privacyScore = getPrivacyScore(browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment);
  const dnsLeakEnvironment = await getDnsLeakEnvironment(dnsEnvironment);
  const dnsSecurityEnvironment = await getDnsSecurityEnvironment(dnsEnvironment);
  const vpnEnvironment = await getVpnEnvironment();
  const privacyIntelligenceSignals = getPrivacyIntelligenceSignals({
    browserEnvironment,
    networkEnvironment,
    dnsEnvironment,
    dnsLeakEnvironment,
    dnsSecurityEnvironment,
    vpnEnvironment,
    webrtcEnvironment,
    privacyScore
  });
  storePrivacyIntelligenceSignals(privacyIntelligenceSignals, "dashboard");
  const privacyRootCauses = getPrivacyRootCausesFromStoredSignals();
  storePrivacyRootCauses(privacyRootCauses, "dashboard");
  const privacyAnalysis = getPrivacyIntelligenceAnalysisFromStoredSignals();
  storePrivacyIntelligenceAnalysis(privacyAnalysis, "dashboard");
  const recommendationsState = getRecommendations(browserEnvironment, privacyScore);
  const privacyJourneyState = await getPrivacyJourneyState(privacyAnalysis, privacyRootCauses, recommendationsState);
  storePrivacyJourney(privacyJourneyState.journey, privacyJourneyState.validation, "dashboard");
  renderPrivacyIntelligenceSection(privacyAnalysis, privacyRootCauses);
  renderSummary(buildSummaryData(browserEnvironment, dnsEnvironment, webrtcEnvironment, dnsLeakEnvironment, dnsSecurityEnvironment, vpnEnvironment));
  renderFindings(buildFindingData(browserEnvironment, dnsEnvironment, webrtcEnvironment).slice(0, 3));
  const dnsDebugSection = document.getElementById("dnsDebugSection");
  if (dnsDebugSection) {
    dnsDebugSection.hidden = !isDnsDebugEnabled();
  }
  if (isDnsDebugEnabled()) {
    renderSimpleReportList("dnsDebugList", buildDnsDebugData(dnsEnvironment));
  }
  renderPrivacyScore(privacyScore);
  renderDashboardHubOverview(privacyAnalysis, privacyJourneyState.journey, recommendationsState);
  renderDashboardActionPanel(privacyAnalysis, privacyJourneyState.journey, recommendationsState);
}

async function initOptimizationCenter() {
  const recommendationRoot = document.getElementById("optimizationRecommendationList");
  if (!recommendationRoot) {
    return;
  }

  const [browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment] = await Promise.all([
    getBrowserEnvironment(),
    getNetworkEnvironment(),
    getDnsEnvironment(),
    getWebRtcEnvironment()
  ]);
  const privacyScore = getPrivacyScore(browserEnvironment, networkEnvironment, dnsEnvironment, webrtcEnvironment);
  const dnsLeakEnvironment = await getDnsLeakEnvironment(dnsEnvironment);
  const dnsSecurityEnvironment = await getDnsSecurityEnvironment(dnsEnvironment);
  const vpnEnvironment = await getVpnEnvironment();
  const privacyIntelligenceSignals = getPrivacyIntelligenceSignals({
    browserEnvironment,
    networkEnvironment,
    dnsEnvironment,
    dnsLeakEnvironment,
    dnsSecurityEnvironment,
    vpnEnvironment,
    webrtcEnvironment,
    privacyScore
  });
  storePrivacyIntelligenceSignals(privacyIntelligenceSignals, "optimization");
  const optimizationRootCauses = getPrivacyRootCausesFromStoredSignals();
  storePrivacyRootCauses(optimizationRootCauses, "optimization");
  const optimizationAnalysis = getPrivacyIntelligenceAnalysisFromStoredSignals();
  storePrivacyIntelligenceAnalysis(optimizationAnalysis, "optimization");
  const recommendationsState = getRecommendations(browserEnvironment, privacyScore);
  const privacyJourneyState = await getPrivacyJourneyState(optimizationAnalysis, optimizationRootCauses, recommendationsState);
  storePrivacyJourney(privacyJourneyState.journey, privacyJourneyState.validation, "optimization");
  const recommendationLookup = buildJourneyRecommendationLookup(recommendationsState.recommendations);

  renderOptimizationJourneySummary(browserEnvironment, privacyScore, privacyJourneyState.journey);
  renderJourneyHero(privacyJourneyState.journey, optimizationAnalysis);
  renderJourneyStepList("optimizationJourneyStepList", privacyJourneyState.journey.steps, recommendationLookup, {
    mode: "primary",
    emptyTitle: translate("journey.empty.primaryTitle", "Nessuno step principale necessario"),
    emptyDescription: translate("journey.empty.primaryDescription", "Non emerge un percorso correttivo principale da aprire in questa sessione.")
  });
  renderJourneyStepList("optimizationOptionalStepList", privacyJourneyState.journey.optionalSteps, recommendationLookup, {
    mode: "optional",
    emptyTitle: translate("journey.empty.optionalTitle", "Nessuno step opzionale disponibile"),
    emptyDescription: translate("journey.empty.optionalDescription", "Non ci sono elementi secondari o di mantenimento da evidenziare ora.")
  });
  renderJourneyStepList("optimizationDeferredRecommendationList", privacyJourneyState.journey.deferredRecommendations, recommendationLookup, {
    mode: "deferred",
    emptyTitle: translate("journey.empty.deferredTitle", "Nessun suggerimento differito"),
    emptyDescription: translate("journey.empty.deferredDescription", "Al momento non restano suggerimenti fuori dal percorso principale.")
  });
  renderJourneyStepList("optimizationNonApplicableList", privacyJourneyState.journey.nonApplicableSteps, recommendationLookup, {
    mode: "nonApplicable",
    emptyTitle: translate("journey.empty.nonApplicableTitle", "Nessuna azione esclusa"),
    emptyDescription: translate("journey.empty.nonApplicableDescription", "Tutte le cause osservate hanno gia un ruolo chiaro nel percorso o nei suggerimenti.")
  });
  renderOptimizationActionPanel(optimizationAnalysis, privacyJourneyState.journey, recommendationsState);
  renderRecommendationCards("optimizationRecommendationList", recommendationsState.recommendations, { mode: "optimization" });
  renderSimpleReportList("futureIntegrationList", buildFutureIntegrationsData(recommendationsState));
  focusRecommendationFromHash();
}

document.addEventListener("DOMContentLoaded", async () => {
  initThemeToggle();
  initActiveNav();
  await initHomepage();
  await initDashboard();
  await initOptimizationCenter();
  await initAnalysisPage();
});
