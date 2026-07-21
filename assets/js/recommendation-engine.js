(function attachRecommendationEngine(globalObject) {
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

  function isEnglish() {
    const i18n = globalObject.PCAI18n;
    return Boolean(i18n && typeof i18n.isEnglish === "function" && i18n.isEnglish());
  }

  // Sceglie il testo nella lingua attiva. Le raccomandazioni browser sono
  // definite in modo bilingue inline, cosi l'inglese e sempre completo e
  // aggiungere un browser significa solo aggiungere una voce alla tabella.
  function pick(it, en) {
    return isEnglish() ? en : it;
  }

  function getHighPriorityLabel() {
    return translate("recommendation.priority.high", "Priorita Alta");
  }

  function getMediumPriorityLabel() {
    return translate("recommendation.priority.medium", "Priorita Media");
  }

  function getLowPriorityLabel() {
    return translate("recommendation.priority.low", "Priorita Bassa");
  }

  function priorityFromKey(key) {
    if (key === "high") {
      return getHighPriorityLabel();
    }
    if (key === "medium") {
      return getMediumPriorityLabel();
    }
    return getLowPriorityLabel();
  }

  const FUTURE_INTEGRATIONS = [
    {
      title: { it: "Ri-verifica automatica dopo la correzione", en: "Automatic re-check after a fix" },
      description: { it: "Dopo una modifica, il controllo verra rifatto e confrontato in automatico per confermare il risultato.", en: "After a change, the check will be re-run and compared automatically to confirm the result." }
    },
    {
      title: { it: "Supporto per il browser Safari", en: "Safari browser support" },
      description: { it: "Rilevamento e istruzioni dedicate anche per Safari su Mac e iPhone.", en: "Detection and dedicated steps for Safari on Mac and iPhone too." }
    },
    {
      title: { it: "Report finale da salvare o condividere", en: "Final report to save or share" },
      description: { it: "Un riepilogo della configurazione e dei miglioramenti applicati, esportabile.", en: "An exportable summary of your setup and the improvements you applied." }
    }
  ];

  function getFutureIntegrations() {
    return FUTURE_INTEGRATIONS.map((item) => ({
      title: pick(item.title.it, item.title.en),
      description: pick(item.description.it, item.description.en)
    }));
  }

  function createRecommendation(id, priority, title, description, howTo, audience, steps) {
    return {
      id,
      priority,
      title,
      description,
      howTo,
      audience,
      steps: Array.isArray(steps) ? steps : null
    };
  }

  function getPriorityRank(priority) {
    if (priority === getHighPriorityLabel()) {
      return 0;
    }
    if (priority === getMediumPriorityLabel()) {
      return 1;
    }
    return 2;
  }

  // Tabella bilingue delle raccomandazioni per browser. Ogni campo ha it/en.
  const BROWSER_RECOMMENDATIONS = {
    firefox: [
      {
        id: "firefox-enhanced-tracking",
        priority: "high",
        audience: "Firefox",
        title: { it: "Blocca chi ti segue tra i siti", en: "Block cross-site tracking" },
        description: { it: "Firefox puo bloccare gli elementi che ti seguono da un sito all'altro. Basta alzare il livello di protezione.", en: "Firefox can block the things that follow you from one site to another. You just need to raise the protection level." },
        howTo: { it: "Alza a Rigorosa la protezione antitracciamento.", en: "Set tracking protection to Strict." },
        steps: {
          it: ["Clicca il menu ☰ in alto a destra.", "Scegli Impostazioni.", "Nella colonna a sinistra clicca Privacy e sicurezza.", "Alla voce 'Protezione antitracciamento avanzata' scegli Rigorosa.", "Se un sito smette di funzionare, puoi rimetterlo su Standard solo per quel sito."],
          en: ["Click the ☰ menu in the top right.", "Choose Settings.", "In the left column click Privacy & Security.", "Under 'Enhanced Tracking Protection' choose Strict.", "If a site stops working, you can switch it back to Standard for that site only."]
        }
      },
      {
        id: "firefox-telemetry",
        priority: "medium",
        audience: "Firefox",
        title: { it: "Smetti di inviare dati d'uso", en: "Stop sending usage data" },
        description: { it: "Firefox puo inviare a Mozilla dati su come usi il browser (telemetria). Se preferisci, puoi disattivarli.", en: "Firefox can send Mozilla data about how you use the browser (telemetry). If you prefer, you can turn it off." },
        howTo: { it: "Disattiva la raccolta dati d'uso nelle impostazioni.", en: "Turn off usage-data collection in settings." },
        steps: {
          it: ["Clicca il menu ☰ in alto a destra e scegli Impostazioni.", "A sinistra clicca Privacy e sicurezza.", "Scorri fino a 'Raccolta e utilizzo dati di Firefox'.", "Togli la spunta dalle opzioni di invio dati che trovi elencate."],
          en: ["Click the ☰ menu in the top right and choose Settings.", "On the left click Privacy & Security.", "Scroll down to 'Firefox Data Collection and Use'.", "Uncheck the data-sending options listed there."]
        }
      },
      {
        id: "firefox-webrtc",
        priority: "low",
        audience: "Firefox",
        title: { it: "WebRTC: intervieni solo se usi una VPN", en: "WebRTC: only act if you use a VPN" },
        description: { it: "I browser moderni nascondono gia il tuo IP locale, quindi di solito non devi fare nulla. Il rischio che resta riguarda l'IP pubblico reale, che WebRTC puo rivelare anche dietro una VPN. Se usi una VPN e vuoi la massima protezione, puoi disattivare del tutto WebRTC.", en: "Modern browsers already hide your local IP, so usually you don't need to do anything. The remaining risk is your real public IP, which WebRTC can reveal even behind a VPN. If you use a VPN and want maximum protection, you can turn WebRTC off entirely." },
        howTo: { it: "Disattiva WebRTC da about:config (attenzione: blocca chiamate e videochiamate nel browser).", en: "Disable WebRTC from about:config (note: it blocks calls and video calls in the browser)." },
        steps: {
          it: ["Apri una nuova scheda, scrivi about:config nella barra degli indirizzi e premi Invio.", "Conferma l'avviso 'Accetto il rischio'.", "Nel campo di ricerca in alto incolla: media.peerconnection.enabled", "Fai doppio clic sulla riga per portare il valore su false.", "Ricorda: cosi le chiamate e videochiamate dentro il browser (Meet, Whereby...) smetteranno di funzionare. Rimetti true se ti servono."],
          en: ["Open a new tab, type about:config in the address bar and press Enter.", "Confirm the 'Accept the Risk' warning.", "In the search box at the top paste: media.peerconnection.enabled", "Double-click the row to set the value to false.", "Remember: in-browser calls and video calls (Meet, Whereby...) will stop working. Set it back to true if you need them."]
        }
      }
    ],
    chrome: [
      {
        id: "chrome-privacy-settings",
        priority: "high",
        audience: "Chrome",
        title: { it: "Alza le protezioni di Chrome", en: "Raise Chrome's protections" },
        description: { it: "Chrome ha gia alcune protezioni, ma vanno attivate a mano. Bastano pochi clic.", en: "Chrome already has some protections, but you have to turn them on by hand. It only takes a few clicks." },
        howTo: { it: "Attiva la Protezione avanzata e blocca i cookie di terze parti.", en: "Turn on Enhanced protection and block third-party cookies." },
        steps: {
          it: ["Clicca il menu ⋮ (tre puntini) in alto a destra.", "Scegli Impostazioni.", "Nella colonna a sinistra clicca Privacy e sicurezza.", "Apri Sicurezza e scegli Protezione avanzata.", "Torna indietro, apri 'Cookie di terze parti' e scegli Blocca cookie di terze parti."],
          en: ["Click the ⋮ (three dots) menu in the top right.", "Choose Settings.", "In the left column click Privacy and security.", "Open Security and choose Enhanced protection.", "Go back, open 'Third-party cookies' and choose Block third-party cookies."]
        }
      },
      {
        id: "chrome-sync-review",
        priority: "medium",
        audience: "Chrome",
        title: { it: "Scegli cosa salvare nell'account Google", en: "Choose what to save in your Google account" },
        description: { it: "La sincronizzazione salva i tuoi dati (cronologia, password...) nell'account Google. Puoi scegliere cosa condividere.", en: "Sync saves your data (history, passwords...) in your Google account. You can choose what to share." },
        howTo: { it: "Rivedi o metti in pausa la sincronizzazione.", en: "Review or pause sync." },
        steps: {
          it: ["Clicca il menu ⋮ in alto a destra e scegli Impostazioni.", "In alto a sinistra clicca 'Tu e Google'.", "Apri 'Sincronizzazione' (o 'Gestisci cio che sincronizzi').", "Disattiva le voci che non ti servono, oppure metti in pausa la sincronizzazione."],
          en: ["Click the ⋮ menu in the top right and choose Settings.", "At the top left click 'You and Google'.", "Open 'Sync' (or 'Manage what you sync').", "Turn off the items you don't need, or pause sync."]
        }
      },
      {
        id: "chrome-webrtc",
        priority: "low",
        audience: "Chrome",
        title: { it: "WebRTC: cosa puoi fare davvero su Chrome", en: "WebRTC: what you can actually do on Chrome" },
        description: { it: "Chrome nasconde gia il tuo IP locale di default, quindi la fuga piu comune e coperta. Non ha pero un interruttore per WebRTC e, dopo i cambiamenti alle estensioni, non c'e piu un blocco affidabile via add-on. Il rischio residuo e l'IP pubblico dietro una VPN.", en: "Chrome already hides your local IP by default, so the most common leak is covered. It has no WebRTC switch, however, and after the changes to extensions there's no longer a reliable add-on block. The remaining risk is your public IP behind a VPN." },
        howTo: { it: "Tieni il browser aggiornato; se usi una VPN, scegline una con protezione WebRTC, o passa a Brave/Firefox per le attivita sensibili.", en: "Keep the browser updated; if you use a VPN, pick one with WebRTC protection, or switch to Brave/Firefox for sensitive activity." },
        steps: {
          it: ["Verifica che Chrome sia aggiornato: l'IP locale e gia nascosto di default.", "Sappi che Chrome non ha un interruttore nativo per WebRTC e le estensioni non lo bloccano piu in modo affidabile.", "Se usi una VPN, scegline una che dichiari esplicitamente la protezione dai leak WebRTC.", "Per le attivita piu sensibili valuta Brave (controllo nativo) o Firefox (disattivazione da about:config)."],
          en: ["Make sure Chrome is up to date: the local IP is already hidden by default.", "Be aware that Chrome has no native WebRTC switch and extensions no longer block it reliably.", "If you use a VPN, choose one that explicitly advertises WebRTC leak protection.", "For more sensitive activity, consider Brave (native control) or Firefox (about:config toggle)."]
        }
      }
    ],
    edge: [
      {
        id: "edge-tracking-prevention",
        priority: "high",
        audience: "Microsoft Edge",
        title: { it: "Blocca chi ti segue tra i siti", en: "Block cross-site tracking" },
        description: { it: "Edge blocca gia chi ti segue da un sito all'altro. Puoi rendere il blocco piu forte.", en: "Edge already blocks trackers that follow you across sites. You can make the blocking stronger." },
        howTo: { it: "Alza la Prevenzione del tracciamento a Bilanciata o Rigorosa.", en: "Set Tracking prevention to Balanced or Strict." },
        steps: {
          it: ["Clicca il menu ⋯ (tre puntini) in alto a destra.", "Scegli Impostazioni.", "A sinistra clicca 'Privacy, ricerca e servizi'.", "Alla voce 'Prevenzione del tracciamento' scegli Bilanciata o Rigorosa."],
          en: ["Click the ⋯ (three dots) menu in the top right.", "Choose Settings.", "On the left click 'Privacy, search, and services'.", "Under 'Tracking prevention' choose Balanced or Strict."]
        }
      },
      {
        id: "edge-services-review",
        priority: "medium",
        audience: "Microsoft Edge",
        title: { it: "Spegni le funzioni extra che non usi", en: "Turn off extra features you don't use" },
        description: { it: "Edge ha diverse funzioni extra collegate al cloud. Puoi disattivare quelle che non ti servono.", en: "Edge has several extra cloud-connected features. You can turn off the ones you don't need." },
        howTo: { it: "Disattiva suggerimenti e servizi aggiuntivi.", en: "Turn off suggestions and optional services." },
        steps: {
          it: ["Clicca il menu ⋯ in alto a destra e scegli Impostazioni.", "A sinistra clicca 'Privacy, ricerca e servizi'.", "Scorri fino alla sezione 'Servizi', in fondo.", "Disattiva i suggerimenti e le funzioni che non usi."],
          en: ["Click the ⋯ menu in the top right and choose Settings.", "On the left click 'Privacy, search, and services'.", "Scroll to the 'Services' section at the bottom.", "Turn off the suggestions and features you don't use."]
        }
      },
      {
        id: "edge-webrtc",
        priority: "low",
        audience: "Microsoft Edge",
        title: { it: "WebRTC: cosa puoi fare davvero su Edge", en: "WebRTC: what you can actually do on Edge" },
        description: { it: "Edge nasconde gia il tuo IP locale di default, quindi la fuga piu comune e coperta. Come Chrome non ha un interruttore per WebRTC e le estensioni non offrono piu un blocco affidabile. Il rischio residuo e l'IP pubblico dietro una VPN.", en: "Edge already hides your local IP by default, so the most common leak is covered. Like Chrome it has no WebRTC switch and extensions no longer offer a reliable block. The remaining risk is your public IP behind a VPN." },
        howTo: { it: "Tieni il browser aggiornato; se usi una VPN, scegline una con protezione WebRTC, o passa a Brave/Firefox per le attivita sensibili.", en: "Keep the browser updated; if you use a VPN, pick one with WebRTC protection, or switch to Brave/Firefox for sensitive activity." },
        steps: {
          it: ["Verifica che Edge sia aggiornato: l'IP locale e gia nascosto di default.", "Sappi che Edge non ha un interruttore nativo per WebRTC e le estensioni non lo bloccano piu in modo affidabile.", "Se usi una VPN, scegline una che dichiari esplicitamente la protezione dai leak WebRTC.", "Per le attivita piu sensibili valuta Brave (controllo nativo) o Firefox (disattivazione da about:config)."],
          en: ["Make sure Edge is up to date: the local IP is already hidden by default.", "Be aware that Edge has no native WebRTC switch and extensions no longer block it reliably.", "If you use a VPN, choose one that explicitly advertises WebRTC leak protection.", "For more sensitive activity, consider Brave (native control) or Firefox (about:config toggle)."]
        }
      }
    ],
    brave: [
      {
        id: "brave-shields",
        priority: "high",
        audience: "Brave",
        title: { it: "Controlla gli Scudi di Brave", en: "Check Brave Shields" },
        description: { it: "Gli Scudi (Shields) bloccano pubblicita e chi ti segue tra i siti. Controlla che siano attivi e al massimo.", en: "Shields block ads and trackers that follow you across sites. Make sure they're on and set high." },
        howTo: { it: "Verifica che gli Scudi siano attivi e imposta il blocco su Aggressivo.", en: "Make sure Shields are on and set blocking to Aggressive." },
        steps: {
          it: ["Su un sito qualsiasi, clicca l'icona del leone in alto, nella barra degli indirizzi.", "Controlla che gli Scudi siano 'Su'.", "Per renderli piu forti ovunque: menu ☰ in alto a destra → Impostazioni → Scudi.", "Imposta il blocco di tracker e annunci su Aggressivo."],
          en: ["On any site, click the lion icon at the top, in the address bar.", "Make sure Shields are 'Up'.", "To make them stronger everywhere: menu ☰ top right → Settings → Shields.", "Set trackers and ads blocking to Aggressive."]
        }
      },
      {
        id: "brave-rewards",
        priority: "medium",
        audience: "Brave",
        title: { it: "Spegni le funzioni extra che non usi", en: "Turn off extra features you don't use" },
        description: { it: "Brave include funzioni extra (Rewards, Wallet, VPN, Leo AI). Puoi disattivare quelle che non usi.", en: "Brave includes extra features (Rewards, Wallet, VPN, Leo AI). You can turn off the ones you don't use." },
        howTo: { it: "Disattiva Rewards e le altre funzioni extra nelle impostazioni.", en: "Turn off Rewards and the other extras in settings." },
        steps: {
          it: ["Clicca il menu ☰ in alto a destra e scegli Impostazioni.", "Scorri le sezioni come Rewards, Wallet, Leo AI e VPN.", "Disattiva quelle che non usi per alleggerire il browser."],
          en: ["Click the ☰ menu in the top right and choose Settings.", "Scroll through sections like Rewards, Wallet, Leo AI and VPN.", "Turn off the ones you don't use to keep the browser lean."]
        }
      },
      {
        id: "brave-webrtc",
        priority: "low",
        audience: "Brave",
        title: { it: "WebRTC: usa il controllo nativo di Brave", en: "WebRTC: use Brave's native control" },
        description: { it: "Il tuo IP locale e gia nascosto di default. Per l'IP pubblico (importante soprattutto se usi una VPN) Brave ha un'impostazione nativa dedicata, senza bisogno di estensioni.", en: "Your local IP is already hidden by default. For the public IP (important especially with a VPN) Brave has a dedicated native setting, no extensions needed." },
        howTo: { it: "Imposta la 'WebRTC IP handling policy' su un'opzione piu restrittiva.", en: "Set the 'WebRTC IP handling policy' to a stricter option." },
        steps: {
          it: ["Apri una nuova scheda, scrivi brave://settings/privacy e premi Invio.", "Cerca la voce 'WebRTC IP handling policy' (Gestione IP WebRTC).", "Scegli 'Disable non-proxied UDP' per la protezione piu forte, specie con una VPN.", "Nota: le opzioni piu restrittive possono disturbare alcune chiamate; se serve, torna a un livello meno rigido."],
          en: ["Open a new tab, type brave://settings/privacy and press Enter.", "Find the 'WebRTC IP handling policy' entry.", "Choose 'Disable non-proxied UDP' for the strongest protection, especially with a VPN.", "Note: stricter options can disrupt some calls; if needed, go back to a less strict level."]
        }
      }
    ],
    librewolf: [
      {
        id: "librewolf-updates",
        priority: "high",
        audience: "LibreWolf",
        title: { it: "Tieni LibreWolf aggiornato", en: "Keep LibreWolf up to date" },
        description: { it: "LibreWolf parte gia da una buona base di privacy. La cosa piu importante e tenerlo aggiornato.", en: "LibreWolf already starts from a good privacy baseline. The most important thing is keeping it updated." },
        howTo: { it: "Controlla gli aggiornamenti dal menu Aiuto o dal gestore con cui l'hai installato.", en: "Check for updates from the Help menu or the tool you installed it with." },
        steps: {
          it: ["Apri il menu ☰ in alto a destra.", "Vai su Aiuto e poi 'Informazioni su LibreWolf'.", "Se c'e un aggiornamento, installalo.", "Se lo hai installato con uno store o un gestore pacchetti, aggiornalo da li."],
          en: ["Open the ☰ menu in the top right.", "Go to Help, then 'About LibreWolf'.", "If an update is available, install it.", "If you installed it via a store or package manager, update it from there."]
        }
      },
      {
        id: "librewolf-breakage-review",
        priority: "low",
        audience: "LibreWolf",
        title: { it: "Aggiungi eccezioni solo quando servono", en: "Add exceptions only when needed" },
        description: { it: "LibreWolf e volutamente restrittivo. Se un sito non funziona, meglio un'eccezione mirata che abbassare tutto.", en: "LibreWolf is intentionally strict. If a site breaks, a targeted exception is better than lowering everything." },
        howTo: { it: "Gestisci le eccezioni sito per sito e rivedile ogni tanto.", en: "Handle exceptions site by site and review them from time to time." },
        steps: {
          it: ["Se un sito non funziona, clicca l'icona dello scudo nella barra degli indirizzi, su quel sito.", "Disattiva la protezione solo per quel sito.", "Non abbassare le protezioni globali dalle impostazioni.", "Ogni tanto rivedi le eccezioni che hai creato."],
          en: ["If a site breaks, click the shield icon in the address bar, on that site.", "Turn protection off for that site only.", "Don't lower the global protections in settings.", "Every so often review the exceptions you've created."]
        }
      },
      {
        id: "librewolf-webrtc",
        priority: "low",
        audience: "LibreWolf",
        title: { it: "WebRTC: intervieni solo se usi una VPN", en: "WebRTC: only act if you use a VPN" },
        description: { it: "LibreWolf nasconde gia il tuo IP locale. Il rischio che resta riguarda l'IP pubblico reale, che WebRTC puo rivelare anche dietro una VPN. Se usi una VPN e vuoi la massima protezione, puoi disattivare del tutto WebRTC.", en: "LibreWolf already hides your local IP. The remaining risk is your real public IP, which WebRTC can reveal even behind a VPN. If you use a VPN and want maximum protection, you can turn WebRTC off entirely." },
        howTo: { it: "Disattiva WebRTC da about:config (attenzione: blocca chiamate e videochiamate nel browser).", en: "Disable WebRTC from about:config (note: it blocks calls and video calls in the browser)." },
        steps: {
          it: ["Apri una nuova scheda, scrivi about:config nella barra degli indirizzi e premi Invio.", "Conferma l'avviso 'Accetto il rischio'.", "Nel campo di ricerca in alto incolla: media.peerconnection.enabled", "Fai doppio clic sulla riga per portare il valore su false.", "Ricorda: cosi le chiamate e videochiamate dentro il browser smetteranno di funzionare. Rimetti true se ti servono."],
          en: ["Open a new tab, type about:config in the address bar and press Enter.", "Confirm the 'Accept the Risk' warning.", "In the search box at the top paste: media.peerconnection.enabled", "Double-click the row to set the value to false.", "Remember: in-browser calls and video calls will stop working. Set it back to true if you need them."]
        }
      }
    ],
    mullvad: [
      {
        id: "mullvad-defaults",
        priority: "high",
        audience: "Mullvad Browser",
        title: { it: "Lascia le impostazioni predefinite", en: "Leave the default settings" },
        description: { it: "Mullvad Browser protegge di piu quando resta uguale a quello di tutti gli altri utenti. Le modifiche ti rendono piu riconoscibile.", en: "Mullvad Browser protects you more when it stays identical to everyone else's. Changes make you more recognizable." },
        howTo: { it: "Evita estensioni e personalizzazioni non necessarie.", en: "Avoid unnecessary extensions and customizations." },
        steps: {
          it: ["Non installare estensioni aggiuntive.", "Non cambiare tema, lingua o impostazioni avanzate.", "Non ingrandire la finestra a tutto schermo: lasciala alla dimensione predefinita.", "Piu il browser resta 'standard', piu ti confondi con gli altri."],
          en: ["Don't install extra extensions.", "Don't change theme, language or advanced settings.", "Don't maximize the window to full screen: keep it at the default size.", "The more the browser stays 'standard', the more you blend in with others."]
        }
      },
      {
        id: "mullvad-profile-separation",
        priority: "medium",
        audience: "Mullvad Browser",
        title: { it: "Separa attivita riservate e quotidiane", en: "Separate private and everyday activities" },
        description: { it: "Per una privacy migliore conviene usare questo browser solo per cio che vuoi tenere riservato.", en: "For better privacy, use this browser only for what you want to keep private." },
        howTo: { it: "Usa un altro browser per email, social e login personali.", en: "Use another browser for email, social media and personal logins." },
        steps: {
          it: ["Usa Mullvad Browser per le attivita in cui vuoi piu riservatezza.", "Usa un altro browser per email, social e siti dove fai login.", "Non mescolare account personali e navigazione riservata nella stessa sessione."],
          en: ["Use Mullvad Browser for the activities where you want more privacy.", "Use another browser for email, social media and sites where you log in.", "Don't mix personal accounts and private browsing in the same session."]
        }
      }
    ],
    zen: [
      {
        id: "zen-privacy-review",
        priority: "high",
        audience: "Zen Browser",
        title: { it: "Rivedi le impostazioni privacy", en: "Review the privacy settings" },
        description: { it: "Zen puo offrire una buona base, ma conviene controllare le opzioni di tracciamento e cookie.", en: "Zen can offer a good baseline, but it's worth checking the tracking and cookie options." },
        howTo: { it: "Alza la protezione antitracciamento nelle impostazioni Privacy.", en: "Raise tracking protection in the Privacy settings." },
        steps: {
          it: ["Apri il menu principale (in alto) e vai su Impostazioni.", "Cerca la sezione Privacy e sicurezza.", "Imposta la protezione antitracciamento su un livello alto.", "Controlla la gestione dei cookie e la cancellazione dei dati alla chiusura."],
          en: ["Open the main menu (at the top) and go to Settings.", "Find the Privacy & Security section.", "Set tracking protection to a high level.", "Check cookie handling and clearing data on close."]
        }
      },
      {
        id: "zen-extensions",
        priority: "medium",
        audience: "Zen Browser",
        title: { it: "Tieni poche estensioni", en: "Keep few extensions" },
        description: { it: "Troppe estensioni aumentano la superficie esposta e rendono il tuo profilo piu riconoscibile.", en: "Too many extensions increase your exposed surface and make your profile more recognizable." },
        howTo: { it: "Rimuovi o disattiva le estensioni che non usi davvero.", en: "Remove or disable extensions you don't really use." },
        steps: {
          it: ["Apri il menu e vai su Estensioni (o Componenti aggiuntivi).", "Guarda l'elenco delle estensioni installate.", "Disattiva o rimuovi quelle che non usi davvero."],
          en: ["Open the menu and go to Extensions (or Add-ons).", "Look at the list of installed extensions.", "Disable or remove the ones you don't really use."]
        }
      },
      {
        id: "zen-webrtc",
        priority: "low",
        audience: "Zen Browser",
        title: { it: "WebRTC: intervieni solo se usi una VPN", en: "WebRTC: only act if you use a VPN" },
        description: { it: "Zen e basato su Firefox e nasconde gia il tuo IP locale. Il rischio che resta riguarda l'IP pubblico reale, che WebRTC puo rivelare anche dietro una VPN. Se usi una VPN e vuoi la massima protezione, puoi disattivare del tutto WebRTC.", en: "Zen is based on Firefox and already hides your local IP. The remaining risk is your real public IP, which WebRTC can reveal even behind a VPN. If you use a VPN and want maximum protection, you can turn WebRTC off entirely." },
        howTo: { it: "Disattiva WebRTC da about:config (attenzione: blocca chiamate e videochiamate nel browser).", en: "Disable WebRTC from about:config (note: it blocks calls and video calls in the browser)." },
        steps: {
          it: ["Apri una nuova scheda, scrivi about:config nella barra degli indirizzi e premi Invio.", "Conferma l'avviso 'Accetto il rischio'.", "Nel campo di ricerca in alto incolla: media.peerconnection.enabled", "Fai doppio clic sulla riga per portare il valore su false.", "Ricorda: cosi le chiamate e videochiamate dentro il browser smetteranno di funzionare. Rimetti true se ti servono."],
          en: ["Open a new tab, type about:config in the address bar and press Enter.", "Confirm the 'Accept the Risk' warning.", "In the search box at the top paste: media.peerconnection.enabled", "Double-click the row to set the value to false.", "Remember: in-browser calls and video calls will stop working. Set it back to true if you need them."]
        }
      }
    ],
    vivaldi: [
      {
        id: "vivaldi-privacy-check",
        priority: "high",
        audience: "Vivaldi",
        title: { it: "Controlla ricerca, suggerimenti e blocco contenuti", en: "Check search, suggestions and content blocking" },
        description: { it: "Vivaldi e molto flessibile: alcune funzioni integrate vanno riviste per una privacy migliore.", en: "Vivaldi is very flexible: some built-in features are worth reviewing for better privacy." },
        howTo: { it: "Rivedi Privacy e attiva il blocco di tracker e annunci.", en: "Review Privacy and turn on tracker and ad blocking." },
        steps: {
          it: ["Apri le Impostazioni (icona in basso a sinistra, o premi Ctrl+F12).", "Vai nella sezione Privacy e sicurezza.", "Attiva il blocco di tracker e annunci.", "Rivedi motore di ricerca, suggerimenti e permessi dei siti."],
          en: ["Open Settings (icon at the bottom left, or press Ctrl+F12).", "Go to the Privacy and Security section.", "Turn on tracker and ad blocking.", "Review the search engine, suggestions and site permissions."]
        }
      },
      {
        id: "vivaldi-profile-order",
        priority: "low",
        audience: "Vivaldi",
        title: { it: "Tieni ordinate funzioni e personalizzazioni", en: "Keep features and customizations tidy" },
        description: { it: "Troppa personalizzazione puo rendere piu difficile controllare privacy ed eccezioni.", en: "Too much customization can make it harder to keep privacy and exceptions under control." },
        howTo: { it: "Rivedi periodicamente le opzioni attive e disattiva quelle inutili.", en: "Periodically review active options and turn off the unnecessary ones." },
        steps: {
          it: ["Apri le Impostazioni di Vivaldi.", "Scorri le sezioni delle funzioni integrate.", "Disattiva quelle che non usi per mantenere tutto piu semplice."],
          en: ["Open Vivaldi's Settings.", "Scroll through the built-in feature sections.", "Turn off the ones you don't use to keep everything simpler."]
        }
      },
      {
        id: "vivaldi-webrtc",
        priority: "low",
        audience: "Vivaldi",
        title: { it: "WebRTC: cosa puoi fare davvero su Vivaldi", en: "WebRTC: what you can actually do on Vivaldi" },
        description: { it: "Vivaldi e basato su Chromium e nasconde gia il tuo IP locale di default. Non offre un blocco WebRTC affidabile via estensione. Il rischio residuo e l'IP pubblico dietro una VPN.", en: "Vivaldi is Chromium-based and already hides your local IP by default. It doesn't offer a reliable WebRTC block via extension. The remaining risk is your public IP behind a VPN." },
        howTo: { it: "Tieni il browser aggiornato; se usi una VPN, scegline una con protezione WebRTC, o usa Brave/Firefox per le attivita sensibili.", en: "Keep the browser updated; if you use a VPN, pick one with WebRTC protection, or use Brave/Firefox for sensitive activity." },
        steps: {
          it: ["Verifica che Vivaldi sia aggiornato: l'IP locale e gia nascosto di default.", "Controlla in Impostazioni > Privacy se e presente un'opzione relativa a WebRTC e, se c'e, impostala sul livello piu restrittivo.", "Se usi una VPN, scegline una che dichiari la protezione dai leak WebRTC.", "Per le attivita piu sensibili valuta Brave (controllo nativo) o Firefox (disattivazione da about:config)."],
          en: ["Make sure Vivaldi is up to date: the local IP is already hidden by default.", "In Settings > Privacy check whether a WebRTC-related option exists and, if so, set it to the strictest level.", "If you use a VPN, choose one that advertises WebRTC leak protection.", "For more sensitive activity, consider Brave (native control) or Firefox (about:config toggle)."]
        }
      }
    ],
    floorp: [
      {
        id: "floorp-privacy-review",
        priority: "high",
        audience: "Floorp",
        title: { it: "Controlla le opzioni privacy di Floorp", en: "Check Floorp's privacy options" },
        description: { it: "Floorp e una buona base, ma conviene verificare impostazioni e componenti aggiuntivi attivi.", en: "Floorp is a good base, but it's worth checking the settings and active add-ons." },
        howTo: { it: "Alza la protezione antitracciamento e rivedi le funzioni extra.", en: "Raise tracking protection and review the extra features." },
        steps: {
          it: ["Apri il menu ☰ in alto a destra e vai su Impostazioni.", "Apri Privacy e sicurezza.", "Alza la protezione antitracciamento.", "Rivedi le funzioni extra di Floorp e disattiva quelle che non usi."],
          en: ["Open the ☰ menu in the top right and go to Settings.", "Open Privacy & Security.", "Raise tracking protection.", "Review Floorp's extra features and turn off the ones you don't use."]
        }
      },
      {
        id: "floorp-extension-discipline",
        priority: "medium",
        audience: "Floorp",
        title: { it: "Tieni essenziali le estensioni", en: "Keep extensions to the essentials" },
        description: { it: "Anche con un browser attento alla privacy, troppe estensioni aumentano l'esposizione.", en: "Even with a privacy-minded browser, too many extensions increase exposure." },
        howTo: { it: "Lascia attive solo le estensioni davvero necessarie.", en: "Keep only the extensions you truly need." },
        steps: {
          it: ["Apri il menu e vai su Estensioni (o Componenti aggiuntivi).", "Guarda l'elenco delle estensioni.", "Disattiva o rimuovi quelle che non usi davvero."],
          en: ["Open the menu and go to Extensions (or Add-ons).", "Look at the list of extensions.", "Disable or remove the ones you don't really use."]
        }
      },
      {
        id: "floorp-webrtc",
        priority: "low",
        audience: "Floorp",
        title: { it: "WebRTC: intervieni solo se usi una VPN", en: "WebRTC: only act if you use a VPN" },
        description: { it: "Floorp e basato su Firefox e nasconde gia il tuo IP locale. Il rischio che resta riguarda l'IP pubblico reale, che WebRTC puo rivelare anche dietro una VPN. Se usi una VPN e vuoi la massima protezione, puoi disattivare del tutto WebRTC.", en: "Floorp is based on Firefox and already hides your local IP. The remaining risk is your real public IP, which WebRTC can reveal even behind a VPN. If you use a VPN and want maximum protection, you can turn WebRTC off entirely." },
        howTo: { it: "Disattiva WebRTC da about:config (attenzione: blocca chiamate e videochiamate nel browser).", en: "Disable WebRTC from about:config (note: it blocks calls and video calls in the browser)." },
        steps: {
          it: ["Apri una nuova scheda, scrivi about:config nella barra degli indirizzi e premi Invio.", "Conferma l'avviso 'Accetto il rischio'.", "Nel campo di ricerca in alto incolla: media.peerconnection.enabled", "Fai doppio clic sulla riga per portare il valore su false.", "Ricorda: cosi le chiamate e videochiamate dentro il browser smetteranno di funzionare. Rimetti true se ti servono."],
          en: ["Open a new tab, type about:config in the address bar and press Enter.", "Confirm the 'Accept the Risk' warning.", "In the search box at the top paste: media.peerconnection.enabled", "Double-click the row to set the value to false.", "Remember: in-browser calls and video calls will stop working. Set it back to true if you need them."]
        }
      }
    ],
    tor: [
      {
        id: "tor-uniformity",
        priority: "high",
        audience: "Tor Browser",
        title: { it: "Non cambiare le impostazioni predefinite", en: "Don't change the default settings" },
        description: { it: "Tor Browser protegge di piu quando resta identico a quello di tutti gli altri. Ogni modifica ti rende piu riconoscibile.", en: "Tor Browser protects you more when it stays identical to everyone else's. Every change makes you more recognizable." },
        howTo: { it: "Non aggiungere estensioni e usa le opzioni standard.", en: "Don't add extensions and use the standard options." },
        steps: {
          it: ["Non installare estensioni.", "Per la sicurezza usa solo il pulsante scudo in alto (Standard, Piu sicuro, Massima sicurezza).", "Non ingrandire la finestra a tutto schermo.", "Piu tutto resta standard, piu sei indistinguibile dagli altri utenti."],
          en: ["Don't install extensions.", "For security use only the shield button at the top (Standard, Safer, Safest).", "Don't maximize the window to full screen.", "The more everything stays standard, the more you're indistinguishable from other users."]
        }
      },
      {
        id: "tor-window-discipline",
        priority: "medium",
        audience: "Tor Browser",
        title: { it: "Mantieni stabile la finestra", en: "Keep the window stable" },
        description: { it: "Cambiare spesso dimensione o comportamento della finestra puo ridurre l'effetto di uniformita.", en: "Frequently changing the window size or behavior can reduce the uniformity effect." },
        howTo: { it: "Evita modifiche inutili alla finestra durante attivita sensibili.", en: "Avoid needless window changes during sensitive activity." },
        steps: {
          it: ["Evita di ridimensionare continuamente la finestra.", "Non massimizzarla a tutto schermo durante attivita sensibili.", "Se ti serve un'identita nuova, usa l'icona 'Nuova identita' (la scopa) in alto."],
          en: ["Avoid resizing the window over and over.", "Don't maximize it to full screen during sensitive activity.", "If you need a fresh identity, use the 'New Identity' icon (the broom) at the top."]
        }
      }
    ],
    unknown: [
      {
        id: "generic-privacy-review",
        priority: "high",
        audience: { it: "Browser non riconosciuto", en: "Unrecognized browser" },
        title: { it: "Rivedi le impostazioni privacy del browser", en: "Review your browser's privacy settings" },
        description: { it: "Il browser non e stato riconosciuto con certezza: conviene partire dalle impostazioni di privacy e sicurezza generali.", en: "The browser wasn't recognized with certainty: it's best to start from the general privacy and security settings." },
        howTo: { it: "Attiva blocco tracker e cookie di terze parti e controlla i permessi dei siti.", en: "Turn on tracker and third-party cookie blocking and check site permissions." },
        steps: {
          it: ["Apri il menu principale del browser (di solito ☰ o tre puntini in alto a destra).", "Cerca Impostazioni, poi una sezione chiamata Privacy o Sicurezza.", "Attiva il blocco dei tracker e dei cookie di terze parti, se disponibile.", "Controlla i permessi dei siti: fotocamera, microfono, posizione e notifiche."],
          en: ["Open the browser's main menu (usually ☰ or three dots in the top right).", "Look for Settings, then a section called Privacy or Security.", "Turn on blocking of trackers and third-party cookies, if available.", "Check site permissions: camera, microphone, location and notifications."]
        }
      },
      {
        id: "generic-webrtc",
        priority: "low",
        audience: { it: "Browser non riconosciuto", en: "Unrecognized browser" },
        title: { it: "WebRTC: cosa sapere", en: "WebRTC: what to know" },
        description: { it: "Quasi tutti i browser moderni nascondono gia il tuo IP locale. Il rischio che resta e l'IP pubblico reale, che WebRTC puo esporre soprattutto se usi una VPN.", en: "Almost all modern browsers already hide your local IP. The remaining risk is your real public IP, which WebRTC can expose especially if you use a VPN." },
        howTo: { it: "Tieni il browser aggiornato e, se usi una VPN, scegline una con protezione WebRTC.", en: "Keep the browser updated and, if you use a VPN, choose one with WebRTC protection." },
        steps: {
          it: ["Tieni il browser aggiornato: l'offuscamento dell'IP locale e ormai attivo di default quasi ovunque.", "Se il tuo browser ha impostazioni Privacy, cerca una voce relativa a WebRTC o alla gestione dell'IP.", "Se usi una VPN, scegline una che dichiari protezione dai leak WebRTC.", "Per le attivita sensibili, browser come Brave (controllo nativo) o Firefox (about:config) offrono opzioni dirette."],
          en: ["Keep the browser updated: local-IP obfuscation is now on by default almost everywhere.", "If your browser has Privacy settings, look for a WebRTC or IP-handling option.", "If you use a VPN, choose one that advertises WebRTC leak protection.", "For sensitive activity, browsers like Brave (native control) or Firefox (about:config) offer direct options."]
        }
      }
    ]
  };

  function localizeField(field) {
    if (field && typeof field === "object" && ("it" in field || "en" in field)) {
      return pick(field.it, field.en);
    }
    return field;
  }

  function buildBrowserRecommendation(entry) {
    return createRecommendation(
      entry.id,
      priorityFromKey(entry.priority),
      localizeField(entry.title),
      localizeField(entry.description),
      localizeField(entry.howTo),
      localizeField(entry.audience),
      entry.steps ? pick(entry.steps.it, entry.steps.en) : null
    );
  }

  function getBaseSuggestions(browserEnvironment) {
    const list = BROWSER_RECOMMENDATIONS[browserEnvironment.browserId] || BROWSER_RECOMMENDATIONS.unknown;
    return list.map(buildBrowserRecommendation);
  }

  function getFamilySuggestions(browserEnvironment) {
    const family = browserEnvironment.family;

    if (family === "Chromium Family") {
      return [
        createRecommendation(
          "chromium-site-permissions",
          getMediumPriorityLabel(),
          translate("recommendation.family.chromium.permissions.title", "Rivedi i permessi concessi ai siti"),
          translate("recommendation.family.chromium.permissions.description", "I browser Chromium tendono a concentrare molte autorizzazioni in un solo pannello: conviene tenerle sotto controllo."),
          translate("recommendation.family.chromium.permissions.howTo", "Controlla camera, microfono, notifiche, clipboard e geolocalizzazione nelle impostazioni sito."),
          family
        )
      ];
    }

    if (family === "Firefox Family") {
      return [
        createRecommendation(
          "firefox-family-cookie-isolation",
          getMediumPriorityLabel(),
          translate("recommendation.family.firefox.isolation.title", "Valuta l'isolamento dei dati tra siti"),
          translate("recommendation.family.firefox.isolation.description", "Nei browser della famiglia Firefox e spesso utile rafforzare l'isolamento tra siti e ridurre la persistenza dei dati."),
          translate("recommendation.family.firefox.isolation.howTo", "Controlla protezioni anti-tracciamento, gestione cookie e politiche di cancellazione dati."),
          family
        )
      ];
    }

    if (family === "Tor Family") {
      return [
        createRecommendation(
          "tor-family-usage-model",
          getHighPriorityLabel(),
          translate("recommendation.family.tor.usage.title", "Usa il browser per contesti coerenti con il suo scopo"),
          translate("recommendation.family.tor.usage.description", "I browser della famiglia Tor danno piu valore quando vengono usati in un modello d'uso coerente e dedicato."),
          translate("recommendation.family.tor.usage.howTo", "Evita di usarli come browser universale per account personali e navigazione quotidiana se non necessario."),
          family
        )
      ];
    }

    return [];
  }

  function getOperatingSystemSuggestions(browserEnvironment) {
    const os = browserEnvironment.os;

    if (os === "Windows") {
      return [
        createRecommendation(
          "windows-privacy-review",
          getMediumPriorityLabel(),
          translate("recommendation.os.windows.privacy.title", "Rivedi le impostazioni privacy del sistema"),
          translate("recommendation.os.windows.privacy.description", "Una parte della privacy dipende anche dal sistema operativo, non solo dal browser."),
          translate("recommendation.os.windows.privacy.howTo", "Controlla le impostazioni di privacy del sistema, soprattutto diagnostica, annunci e autorizzazioni applicazioni."),
          os
        )
      ];
    }

    if (os === "macOS") {
      return [
        createRecommendation(
          "macos-permissions-review",
          getLowPriorityLabel(),
          translate("recommendation.os.macos.permissions.title", "Verifica i permessi concessi alle applicazioni"),
          translate("recommendation.os.macos.permissions.description", "Su macOS conviene controllare periodicamente i permessi di accesso a file, rete locale, fotocamera e microfono."),
          translate("recommendation.os.macos.permissions.howTo", "Apri le impostazioni di privacy del sistema e rivedi le autorizzazioni applicazione per applicazione."),
          os
        )
      ];
    }

    if (os === "Linux") {
      return [
        createRecommendation(
          "linux-browser-updates",
          getLowPriorityLabel(),
          translate("recommendation.os.linux.updates.title", "Mantieni aggiornato il browser dal canale corretto"),
          translate("recommendation.os.linux.updates.description", "Su Linux la qualita della configurazione dipende anche da come il browser viene installato e aggiornato."),
          translate("recommendation.os.linux.updates.howTo", "Controlla se usi pacchetti di sistema, repository dedicati o sandbox e conferma che gli aggiornamenti arrivino regolarmente."),
          os
        )
      ];
    }

    return [];
  }

  function getScoreSuggestions(privacyScore) {
    if (privacyScore.score <= 30) {
      return [
        createRecommendation(
          "score-low-priority",
          getHighPriorityLabel(),
          translate("recommendation.score.low.title", "Parti dai miglioramenti con impatto maggiore"),
          translate("recommendation.score.low.description", "Il punteggio attuale suggerisce che ci sono piu aree da rivedere in modo prioritario."),
          translate("recommendation.score.low.howTo", "Apri il Centro Ottimizzazione Privacy e inizia dalle raccomandazioni ad alta priorita."),
          "Privacy Score"
        )
      ];
    }

    if (privacyScore.score <= 60) {
      return [
        createRecommendation(
          "score-medium-priority",
          getMediumPriorityLabel(),
          translate("recommendation.score.medium.title", "Consolida la configurazione attuale"),
          translate("recommendation.score.medium.description", "Il punteggio e discreto: puoi migliorarlo intervenendo sui dettagli che oggi pesano di piu."),
          translate("recommendation.score.medium.howTo", "Controlla i contributi del punteggio e lavora prima sui fattori con contributo medio o basso."),
          "Privacy Score"
        )
      ];
    }

    if (privacyScore.score <= 80) {
      return [
        createRecommendation(
          "score-good-priority",
          getLowPriorityLabel(),
          translate("recommendation.score.good.title", "Mantieni stabile la configurazione"),
          translate("recommendation.score.good.description", "Il punteggio e gia buono: in questa fase conta soprattutto evitare regressioni e cambiamenti poco controllati."),
          translate("recommendation.score.good.howTo", "Rivedi periodicamente aggiornamenti, permessi e preferenze chiave del browser."),
          "Privacy Score"
        )
      ];
    }

    return [
      createRecommendation(
        "score-excellent-priority",
        getLowPriorityLabel(),
        translate("recommendation.score.excellent.title", "Preserva una configurazione coerente"),
        translate("recommendation.score.excellent.description", "Il punteggio e ottimo rispetto ai dati oggi disponibili. La priorita principale e mantenere coerenza nel tempo."),
        translate("recommendation.score.excellent.howTo", "Continua a usare il browser in modo disciplinato e controlla eventuali cambiamenti dopo aggiornamenti importanti."),
        "Privacy Score"
      )
    ];
  }

  function deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  function sortRecommendations(recommendations) {
    return recommendations.sort((left, right) => {
      const priorityDifference = getPriorityRank(left.priority) - getPriorityRank(right.priority);
      if (priorityDifference !== 0) {
        return priorityDifference;
      }
      return left.title.localeCompare(right.title, "it");
    });
  }

  function detectRecommendations(browserEnvironment, privacyScore) {
    const allRecommendations = []
      .concat(getBaseSuggestions(browserEnvironment))
      .concat(getFamilySuggestions(browserEnvironment))
      .concat(getOperatingSystemSuggestions(browserEnvironment))
      .concat(getScoreSuggestions(privacyScore));

    const recommendations = sortRecommendations(deduplicateRecommendations(allRecommendations));

    return {
      recommendations,
      futureIntegrations: getFutureIntegrations()
    };
  }

  globalObject.PrivacyRecommendationEngine = {
    detectRecommendations
  };
})(window);
