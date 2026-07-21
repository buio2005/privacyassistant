# Changelog

## 0.0.1

* Creata struttura iniziale progetto
* Definiti obiettivi
* Creati README.md
* Creati PROJECT.md
* Creati ROADMAP.md
* Creati CHANGELOG.md

## 0.3.0

Implementato Network Detection Engine

Aggiunte le seguenti rilevazioni:

- IPv4
- IPv6
- Lingua Browser
- Timezone
- Risoluzione Schermo
- Do Not Track

## 0.4.0

- Privacy Score Engine: calcolo punteggio, livelli di rischio, priorita problemi

## 0.5.0

- Recommendation Engine: suggerimenti personalizzati per browser e sistema operativo

## 0.6.0

- DNS Provider Detection: catalogo provider, probe e motore di confidenza

## 0.7.1

- WebRTC Analysis: stato funzionale, osservazione indirizzo pubblico, mascheramento mDNS

## 0.8.2

- Privacy Intelligence Engine con Root Cause Layer: overallState, mainIssue, strengths, priorityAction
- Deduplicazione dei segnali sotto cause funzionali stabili

## 0.8.3

- Privacy Journey Engine: percorso guidato con step blocking / optional / non_applicable
- Pagine dedicate analysis e optimization

## 0.8.3-ux

Revisione esperienza di navigazione (nessuna modifica ai motori decisionali):

- Navbar estesa a cinque voci (Home, Dashboard, Analisi, Ottimizza, Guida)
- Stepper di percorso Capisci / Approfondisci / Agisci sulle pagine del flusso
- Componente card di verifica con stati uniformi (ok, attenzione, critico, non applicabile, in verifica)
- Indice interno "In questa pagina" su analysis e optimization
- Progressive disclosure del dettaglio tecnico tramite elemento nativo details
- Allineamento delle etichette di versione su tutte le pagine

## 0.8.7

Privacy Assistant: istruzioni guidate semplici e passo-passo (lavoro di fino):

- Le raccomandazioni hanno passi numerati con percorsi di clic esatti (campo steps), resi in UI come elenco numerato
- Riscritti in lingua semplice e senza gergo i passi per TUTTI i browser del catalogo: Firefox, Chrome, Edge, Brave, LibreWolf, Mullvad, Zen, Vivaldi, Floorp, Tor e generico
- Raccomandazioni browser ora bilingui (IT/EN) tramite tabella dati inline con scelta per lingua: inglese completo, niente chiavi i18n da mantenere
- Safari rinviato: non e ancora riconosciuto dalla detection, va aggiunto prima li

## 0.8.6

VPN Protection Analysis (osservazione neutra, senza giudizio):

- Nuovo modulo isolato vpn-detection.js: osserva SEGNALI compatibili con l'uso di una VPN o proxy, senza valutare la VPN
- Euristica trasparente su ipwho.is (CORS-aperto): organizzazione/dominio dell'IP pubblico riconosciuti come datacenter/hosting, piu discrepanza tra timezone dell'IP e del browser
- Segnale vpn_presence_observation a polarita neutra e status informativo, inserito nelle regole di esclusione delle Root Cause: non tocca stato generale ne punteggio
- Stati signals_present / no_signals / not_determinable; card neutra "VPN / Proxy" in dashboard con tono informativo
- Traduzioni EN, CONTRACT_VERSION a 0.8.6

## 0.8.5

DNSSEC / DNS Security Detection:

- Nuovo modulo isolato dns-security-detection.js: verifica se il resolver valida DNSSEC
- Approccio primario per capacita del provider: i provider confermati che validano DNSSEC (NextDNS, Cloudflare, Quad9, Google, ...) danno un risultato affidabile senza dipendere da domini di test bloccabili
- Probe live come ripiego per resolver sconosciuti (coppia di domini con firma valida e rotta, via fetch no-cors)
- Nuovo adapter adaptDnsSecuritySignals e nuova Root Cause dns_security_posture; stati validating / not_validating / not_determinable
- Card "DNSSEC" nella sintesi dashboard, traduzioni EN, CONTRACT_VERSION a 0.8.5
- protected del DNS Leak reso punto di forza esplicito (active + candidate_for_strength)

## 0.8.4

Rilevamento DNS piu robusto per configurazioni blindate (DoH + VPN):

- Verifica provider indipendente dallo snapshot: quando il resolver osservato non e a catalogo (tipico con DoH/VPN), le sonde di verifica dei provider girano comunque
- NextDNS: verifica via sottodominio unico CORS-aperto (https://{unique}.test.nextdns.io/) con riconoscimento del profilo, al posto dell'endpoint esterno CORS-bloccato
- Il confidence engine riconosce un provider come "confermato" quando la verifica ha successo anche senza match dello snapshot
- DNS Leak Detection: nuovo modulo di detection isolato con adapter e mapping su dns_resolver_quality; stati protected / single_resolver / multiple_resolvers / not_determinable, con confronto per rete e stato "protected" quando il provider e verificato

## 0.8.4

Rilevamento provider DNS: verifica robusta per configurazioni DoH/VPN.

- La verifica del provider ora gira in modo indipendente dallo snapshot del resolver: quando l'egress osservato non e a catalogo (tipico con DoH e VPN), le sonde di verifica vengono comunque eseguite in parallelo.
- Verifica NextDNS riscritta: usa un sottodominio unico `https://<random>.test.nextdns.io/` (endpoint CORS-aperto) e riconosce la presenza del profilo, invece dell'endpoint esterno CORS-bloccato.
- `evaluateIdentification` riconosce un provider come confermato anche quando la conferma arriva dalla sola verifica, senza match dello snapshot.
- Risultato: setup con Firefox DoH + NextDNS + VPN ora identificati correttamente come provider confermato, dove prima restavano "non determinabile".
