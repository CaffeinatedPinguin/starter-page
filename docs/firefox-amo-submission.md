# Firefox (AMO): przygotowanie do wysłania

Ten dokument opisuje przygotowanie dodatku `starter-page` (Firefox, Manifest V3) do publikacji na
addons.mozilla.org. Podstawa: Firefox Add-on Policies i Firefox Add-on Distribution Agreement.

## Status

Kod jest gotowy. Przed wysłaniem zostają sprawy submissionowe: archiwum źródeł z `BUILD.md`,
deklaracja `data_collection_permissions`, listing i support contact.

## Co już jest zgodne

- **Brak remote code.** MV3, bez `host_permissions`; JS, CSS i ikony są lokalne. Iconify działa
  build-time (`mode: 'svg'`, `allowAPI: false`), fonty pochodzą z `@fontsource`. Brak `eval`, CDN,
  XHR, WebSocket i beacon.
- **Lokalny New Tab.** `chrome_url_overrides.newtab` wskazuje `index.html`. Brak redirectu i iframe.
  Dodatek czyta `browser.storage.local`, a build wyklucza `config.json` i `config/`.
- **Minimalne uprawnienia.** Tylko `storage`; brak `tabs`, `webRequest`, `scripting`, `cookies`,
  `history` i `<all_urls>`.
- **Brak zbierania danych.** Search działa lokalnie i w pamięci; query nie jest wysyłane ani
  zapisywane. Nie ma analityki ani telemetrii.
- **Private browsing.** Brak `incognito` (domyślne), nic z sesji prywatnych nie jest zapisywane.
  Zgodne z §6.3 Additional Privacy Protocols.
- **Sole purpose.** To lokalna strona startowa z lokalnym search. Linki otwierają się po kliknięciu
  użytkownika, więc §2 Content nie jest łamany.

## Co trzeba zrobić przed wysłaniem

1. **Archiwum źródeł i `BUILD.md`.** Vite bundluje i minifikuje kod, więc Mozilla musi móc odtworzyć
   identyczny artefakt (Add-on Policies §3.1). `pnpm-lock.yaml` już jest. `BUILD.md` musi zawierać:
   - system i architekturę oraz wersję Node (projekt wymaga `>=22.22.2`),
   - sposób użycia pnpm przez Corepack (`corepack prepare pnpm@12.2.1 --activate`),
   - komendy:
     ```sh
     pnpm install --frozen-lockfile
     pnpm build
     pnpm build:addon
     ```
   - uwagę, że środowisko review AMO to Ubuntu 24.04 ARM64, Node 24.14.0 i npm 11.9.0, a projekt
     buduje przez pnpm,
   - listę bibliotek third-party z linkami.

2. **`browser_specific_settings.gecko.data_collection_permissions`.** Od 3 listopada 2025 jest
   wymagane w nowych zgłoszeniach. Skoro nic nie zbieramy, ustaw `{ "required": ["none"] }`. Ustaw
   też `gecko.strict_min_version = "140.0"` i `gecko_android.strict_min_version = "142.0"`, bo od
   tych wersji pole jest wspierane.

3. **Listing AMO.** Napisz wprost, że dodatek podmienia New Tab, trzyma konfigurację lokalnie i
   otwiera linki dopiero po kliknięciu (§1 No Surprises).

4. **Support contact.** Wymagany przez umowę (§5(b)); obecnie brakuje go w repozytorium.

## Ryzyka

- **Logotypy firm** (`logos`, `simple-icons`: Google, GitHub, Grafana, Proxmox, Twitch, TrueNAS
  itd.). Pakiety są CC0/MIT, ale CC0 nie daje praw do znaków towarowych. To ryzyko IP, nie
  automatyczny blocker. Bądź gotowy usunąć logo na żądanie (umowa §5(c)).
- **`gecko.id`.** `starter-page@caffeinatedpinguin` jest technicznie poprawne. Mozilla wymaga
  formatu email-like albo GUID, nie prawdziwej domeny. Identyfikator na własnej domenie jest
  czytelniejszy, ale nie jest konieczny.
- **Podpisywanie.** `release.yml` nie podpisuje add-onu. Dla self-distributed potrzebne jest
  `web-ext sign` / API; opublikowany ZIP jest niepodpisany.
- **Wersje.** `manifest.json` i `package.json` muszą mieć tę samą wersję. Podbijaj oba przez
  `pnpm version:patch`. `release.yml` wymaga tagu `v<wersja>`, a `scripts/build.mjs` sprawdza
  zgodność i synchronizuje wersję manifestu z `package.json`.

## Koszty

- W oficjalnej dokumentacji nie ma opłat.
- Poza pieniędzmi: czas review, source archive przy każdym release, wsparcie użytkowników,
  utrzymanie zgodności i odpowiedzialność za IP.

## Automatyzacja

Dwie komendy Node, bez bash:

- `pnpm amo:build` tworzy w `build/` (gitignored) dwa artefakty:
  - `starter-page-v<wersja>-addon.zip` do checkera Firefox/AMO,
  - `starter-page-v<wersja>-source.zip` jako source code (źródła, `pnpm-lock.yaml`, `BUILD.md`,
    `THIRD-PARTY.md`, `LISTING.md`).
- `pnpm amo:check` waliduje dokładnie ten add-on ZIP po rozpakowaniu i sprawdza spójność wersji i
  tagów. Raport trafia na stdout/stderr, nic nie zapisuje na dysk. Exit 1 oznacza FAIL.

Kolejność: najpierw `amo:build`, potem `amo:check`.

AMO przyjmuje dwa osobne pliki w dwóch krokach. Najpierw wybierasz add-on
(`build/starter-page-v<wersja>-addon.zip`) w polu „Select file”. Źródłowy ZIP dokładasz później w
polu „Source code” (Manage -> Status & Versions), bo build jest minifikowany. Nie łącz ich w jeden
ZIP.

Opcjonalne pola w `amo-submission.config.json` (gitignored; wzór:
`amo-submission.config.example.json`):

```json
{
  "supportContact": "https://github.com/CaffeinatedPinguin/starter-page/issues",
  "homepageUrl": "https://github.com/CaffeinatedPinguin/starter-page",
  "listingDescription": "…",
  "reviewNotes": ""
}
```

Wypełnione pola trafiają do `BUILD.md` w ZIP-ie źródłowym i odhaczają pozycje w raporcie. Po dodaniu
`data_collection_permissions` i uzupełnieniu configu `amo:check` nie powinien zwracać FAIL.

## Ręczna wysyłka do AMO

Workflow `.github/workflows/firefox.yml` uruchamia się tylko ręcznie (`workflow_dispatch`). Wybiera
najnowszy stabilny tag `vX.Y.Z`, buduje z tego tagu, waliduje (`amo:build`, `amo:check`,
`web-ext lint`) i wysyła add-on wraz ze źródłami do AMO jako unlisted/self-distributed. Nie publikuje
XPI, nie tworzy GitHub Release i nie dołącza niczego do release. Podpisany XPI pobierasz później
ręcznie z AMO i dołączasz do istniejącego GitHub Release.

Skonfiguruj ręcznie sekrety w Settings -> Secrets and variables -> Actions. Workflow ich nie tworzy,
nie wypisuje i nie umieszcza w artefaktach ani w source ZIP.

- `AMO_JWT_ISSUER` -> `web-ext --api-key`
- `AMO_JWT_SECRET` -> `web-ext --api-secret`

## Checklist przed releasem

- [ ] wersja podbita przez `pnpm version:patch` (`package.json` + `manifest.json`); tag = `v<wersja>`
- [ ] `manifest.json` poprawny (MV3, `gecko.id`, `strict_min_version`)
- [ ] `data_collection_permissions.required = ["none"]`
- [ ] tylko wymagane uprawnienia (`storage`; brak `host_permissions`)
- [ ] `chrome_url_overrides.newtab` -> `index.html` (lokalny)
- [ ] paczka add-onu bez `config.json` / `config/`
- [ ] brak remote executable code
- [ ] Iconify build-time (`mode: 'svg'`, `allowAPI: false`)
- [ ] fonty lokalne
- [ ] brak analityki i telemetrii
- [ ] search lokalny (query nie jest zapisywane)
- [ ] `pnpm build`, `pnpm test` i `pnpm lint` przechodzą
- [ ] source archive i `BUILD.md` aktualne (system, Node, corepack/pnpm, komendy)
- [ ] lista bibliotek third-party z linkami
- [ ] ZIP bez zbędnych plików
- [ ] logotypy sprawdzone pod kątem znaków towarowych
- [ ] listing AMO zgodny z rzeczywistością
- [ ] support contact gotowy
- [ ] tag i artefakty CI
- [ ] (self-distributed) podpisanie i mechanizm aktualizacji

## Źródła

- [Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)
  (§1 No Surprises, §2 Content, §3.1 Source, §4 Development, §6 Data, §6.3 Private)
- [Distribution Agreement](https://extensionworkshop.com/documentation/publish/firefox-add-on-distribution-agreement/)
  (§5, §6, §7, §9, §10)
- [Source code submission](https://extensionworkshop.com/documentation/publish/source-code-submission/)
- [Data consent](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/)
- [Signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)
- [incognito (MDN)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/incognito)

## Podsumowanie

Kodowo dodatek jest gotowy. Przed wysłaniem dodaj `data_collection_permissions`, przygotuj source
archive z `BUILD.md`, uzupełnij support contact i listing. `gecko.id` jest poprawne. Logotypy to
ryzyko IP, nie automatyczny blocker.
