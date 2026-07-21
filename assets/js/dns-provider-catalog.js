(function attachDnsProviderCatalog(globalObject) {
  const PROVIDER_CATALOG = [
    {
      id: "nextdns",
      name: "NextDNS",
      privacyLevel: "Molto Avanzato",
      description: "Resolver orientato alla privacy con profili personalizzabili, blocco di tracker e funzioni di controllo molto granulari.",
      signatures: [
        {
          kind: "contains",
          method: "catalog_hostname",
          label: "Hostname provider NextDNS",
          values: [
            "dns.nextdns.io",
            "dns1.nextdns.io",
            "dns2.nextdns.io",
            "anycast.dns.nextdns.io",
            "ultralow.dns.nextdns.io",
            "ipv4.dns1.nextdns.io",
            "ipv4.dns2.nextdns.io",
            "relay.nextdns.io",
            "steering.nextdns.io",
            ".dns.nextdns.io"
          ]
        },
        {
          kind: "exact_ip",
          method: "catalog_provider",
          label: "IP provider catalogato",
          values: [
            "45.90.28.0",
            "45.90.30.0",
            "178.255.155.63",
            "38.175.119.129"
          ]
        },
        {
          kind: "regex",
          method: "catalog_signature",
          label: "Firma anycast NextDNS IPv4",
          values: [
            "\\b45\\.90\\.(?:28|30)\\.\\d{1,3}\\b"
          ]
        }
      ],
      verificationProbes: [
        {
          id: "nextdnsProfile",
          label: "Verifica NextDNS",
          url: "https://{unique}.test.nextdns.io/",
          uniqueSubdomain: true,
          successPolicy: "all",
          matchers: [
            {
              kind: "regex",
              value: "\"profile\"\\s*:\\s*\"[^\"]+\""
            }
          ]
        }
      ]
    },
    {
      id: "cloudflare",
      name: "Cloudflare",
      privacyLevel: "Buono",
      description: "Resolver molto diffuso e veloce, con una buona base privacy ma meno orientato alla personalizzazione rispetto ai provider specializzati.",
      signatures: [
        {
          kind: "contains",
          method: "catalog_hostname",
          label: "Hostname Cloudflare",
          values: [
            "cloudflare",
            "one.one.one.one",
            "1dot1dot1dot1",
            "cloudflare-dns.com",
            "mozilla.cloudflare-dns.com",
            "security.cloudflare-dns.com",
            "family.cloudflare-dns.com"
          ]
        },
        {
          kind: "exact_ip",
          method: "catalog_provider",
          label: "IP pubblico Cloudflare",
          values: [
            "1.1.1.1",
            "1.0.0.1",
            "1.1.1.2",
            "1.0.0.2",
            "1.1.1.3",
            "1.0.0.3",
            "172.71.236.58"
          ]
        },
        {
          kind: "cidr_ipv4",
          method: "catalog_network",
          label: "Rete edge Cloudflare osservata",
          values: [
            "172.64.0.0/13"
          ]
        }
      ],
      verificationProbes: [
        {
          id: "cloudflareHelp",
          label: "Verifica Cloudflare",
          url: "https://one.one.one.one/help",
          successPolicy: "all",
          matchers: [
            {
              kind: "regex",
              value: "Connected to 1\\.1\\.1\\.1\\s*\\|\\s*Yes"
            }
          ]
        }
      ]
    },
    {
      id: "quad9",
      name: "Quad9",
      privacyLevel: "Avanzato",
      description: "Resolver focalizzato su sicurezza e privacy, noto soprattutto per il blocco dei domini malevoli e per un'impostazione prudente.",
      signatures: [
        {
          kind: "contains",
          method: "catalog_hostname",
          label: "Hostname Quad9",
          values: [
            "quad9",
            "dns.quad9.net",
            "dns11.quad9.net",
            "dns10.quad9.net",
            "dns-nosec.quad9.net",
            "on.quad9.net"
          ]
        },
        {
          kind: "exact_ip",
          method: "catalog_provider",
          label: "IP Quad9 catalogato",
          values: [
            "9.9.9.9",
            "149.112.112.112",
            "9.9.9.10",
            "149.112.112.10",
            "109.200.199.200",
            "109.200.199.201"
          ]
        },
        {
          kind: "cidr_ipv4",
          method: "catalog_network",
          label: "Rete nodo Quad9 osservata",
          values: [
            "109.200.199.200/31"
          ]
        }
      ],
      verificationProbes: [
        {
          id: "quad9Status",
          label: "Verifica Quad9",
          url: "https://on.quad9.net/",
          successPolicy: "all",
          matchers: [
            {
              kind: "regex",
              value: "^#\\s*YES"
            },
            {
              kind: "regex",
              value: "ARE\\s+using\\s+quad9"
            }
          ]
        }
      ]
    },
    {
      id: "adguard",
      name: "AdGuard DNS",
      privacyLevel: "Avanzato",
      description: "Resolver orientato a privacy e filtraggio di ads e tracker, utile per ridurre molte richieste indesiderate gia a livello DNS.",
      signatures: [
        {
          kind: "contains",
          method: "catalog_hostname",
          label: "Hostname AdGuard DNS",
          values: [
            "adguard",
            "dns.adguard.com",
            "dns.adguard-dns.com",
            "family.adguard-dns.com",
            "unfiltered.adguard-dns.com"
          ]
        },
        {
          kind: "exact_ip",
          method: "catalog_provider",
          label: "IP AdGuard DNS catalogato",
          values: [
            "79.127.211.213",
            "156.146.33.97",
            "185.229.191.160",
            "84.17.46.77"
          ]
        },
        {
          kind: "regex",
          method: "catalog_signature",
          label: "Firma IP AdGuard DNS",
          values: [
            "\\b94\\.140\\.(?:14|15)\\.\\d{1,3}\\b",
            "\\b79\\.127\\.211\\.213\\b",
            "\\b156\\.146\\.33\\.97\\b",
            "\\b185\\.229\\.191\\.160\\b",
            "\\b84\\.17\\.46\\.77\\b"
          ]
        }
      ],
      verificationProbes: []
    },
    {
      id: "google",
      name: "Google DNS",
      privacyLevel: "Base",
      description: "Resolver pubblico molto diffuso e affidabile sul piano operativo, ma meno focalizzato sulla minimizzazione dei dati rispetto ai provider privacy-first.",
      signatures: [
        {
          kind: "contains",
          method: "catalog_hostname",
          label: "Hostname Google DNS",
          values: [
            "dns.google",
            "google-public-dns"
          ]
        },
        {
          kind: "exact_ip",
          method: "catalog_provider",
          label: "IP Google DNS catalogato",
          values: [
            "8.8.8.8",
            "8.8.4.4",
            "172.253.12.151"
          ]
        },
        {
          kind: "cidr_ipv4",
          method: "catalog_network",
          label: "Rete nodo Google DNS osservata",
          values: [
            "172.253.12.0/24"
          ]
        }
      ],
      verificationProbes: []
    },
    {
      id: "controld",
      name: "ControlD",
      privacyLevel: "Molto Avanzato",
      description: "Resolver avanzato con forte controllo sulle policy DNS, protezioni granulari e impostazione orientata a privacy e personalizzazione.",
      signatures: [
        {
          kind: "contains",
          method: "catalog_hostname",
          label: "Hostname ControlD",
          values: [
            "controld",
            "freedns.controld.com",
            "p0.freedns.controld.com",
            "family.freedns.controld.com",
            "uncensored.freedns.controld.com",
            "x-adguard.freedns.controld.com"
          ]
        },
        {
          kind: "exact_ip",
          method: "catalog_provider",
          label: "IP ControlD catalogato",
          values: [
            "185.40.234.64",
            "185.40.234.187",
            "185.40.234.222",
            "185.40.234.228"
          ]
        },
        {
          kind: "cidr_ipv4",
          method: "catalog_network",
          label: "Rete nodo ControlD osservata",
          values: [
            "185.40.234.0/24"
          ]
        },
        {
          kind: "regex",
          method: "catalog_signature",
          label: "Firma IP ControlD",
          values: [
            "\\b76\\.76\\.2\\.\\d{1,3}\\b"
          ]
        }
      ],
      verificationProbes: [
        {
          id: "controlDStatus",
          label: "Verifica ControlD",
          url: "https://controld.com/status",
          successPolicy: "all",
          matchers: [
            {
              kind: "regex",
              value: "Using Control D"
            }
          ]
        }
      ]
    },
    {
      id: "opendns",
      name: "OpenDNS",
      privacyLevel: "Buono",
      description: "Resolver storico con funzioni di filtro e sicurezza, utile per controllo e stabilita ma non progettato primariamente come provider privacy-specializzato.",
      signatures: [
        {
          kind: "contains",
          method: "catalog_hostname",
          label: "Hostname OpenDNS",
          values: [
            "opendns",
            "umbrella",
            "cisco umbrella",
            "doh.opendns.com",
            "doh.familyshield.opendns.com"
          ]
        },
        {
          kind: "exact_ip",
          method: "catalog_provider",
          label: "IP OpenDNS catalogato",
          values: [
            "146.112.136.74",
            "146.112.136.75",
            "146.112.136.76",
            "146.112.136.82"
          ]
        },
        {
          kind: "cidr_ipv4",
          method: "catalog_network",
          label: "Rete nodo OpenDNS osservata",
          values: [
            "146.112.136.76/30",
            "146.112.136.80/29"
          ]
        },
        {
          kind: "regex",
          method: "catalog_signature",
          label: "Firma IP OpenDNS",
          values: [
            "\\b208\\.67\\.(?:220|222)\\.\\d{1,3}\\b"
          ]
        }
      ],
      verificationProbes: []
    }
  ];

  function getProviderCatalog() {
    return PROVIDER_CATALOG.map((provider) => {
      return {
        ...provider,
        signatures: (provider.signatures || []).map((signature) => ({
          ...signature,
          values: Array.isArray(signature.values) ? signature.values.slice() : []
        })),
        verificationProbes: (provider.verificationProbes || []).map((probe) => ({
          ...probe,
          matchers: Array.isArray(probe.matchers) ? probe.matchers.map((matcher) => ({ ...matcher })) : []
        }))
      };
    });
  }

  globalObject.PrivacyDnsProviderCatalog = {
    getProviderCatalog
  };
})(window);
