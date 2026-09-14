# Firefox (AMO) — instrukcja przed wysłaniem

Audyt zgodności dodatku `starter-page` (Firefox, Manifest V3) na potrzeby publikacji na
addons.mozilla.org. Źródła prawdy: **Firefox Add-on Policies** i **Firefox Add-on
Distribution Agreement** (Extension Workshop).

## Status

**READY AFTER MINOR CHANGES / bardzo blisko READY** — kodowo jest czysto; do wysyłki
brakuje wyłącznie rzeczy submissionowych (source archive + build instructions, deklaracja
`data_collection_permissions`, listing i support contact).

## Co jest zgodne (PASS)

- **Self-contained / brak remote code**: MV3, brak `host_permissions`, JS/CSS/ikony
  lokalne; Iconify generowany build-time (`mode:'svg'`, `allowAPI:false`); fonty
  `@fontsource`; brak `eval`, CDN, XHR/WebSocket/beacon.
- **New Tab lokalny**: `chrome_url_overrides.newtab = "index.html"`; brak redirectu /
  iframe; addon czyta z `browser.storage.local`; build wyklucza `config.json`/`config/`.
- **Uprawnienia minimalne**: tylko `storage` (brak `tabs`, `webRequest`, `scripting`,
  `cookies`, `history`, `<all_urls>`).
- **Zero zbierania/transmisji danych**: wyszukiwanie lokalne, w pamięci; query nigdy nie
  jest wysyłane ani zapisywane; brak analityki/telemetrii.
- **Private browsing**: brak `incognito` (default), nic z sesji prywatnych nie jest
  zapisywane — zgodne z §6.3 Additional Privacy Protocols.
- **Nie łamie „sole purpose promoting outside website”** (§2 Content): to lokalna strona
  startowa + lokalny search; linki otwierają się dopiero po kliknięciu użytkownika.

## Wymagane przed wysłaniem (P0)

1. **Source code + BUILD.md** — **twardy wymóg, nie „nice to have”**: Vite
   generuje/bundluje/minifikuje kod, a Mozilla musi móc odtworzyć identyczny artefakt
   (Add-on Policies §3.1). Lockfile (`pnpm-lock.yaml`) już jest. Instrukcje muszą zawierać:
   - OS/arch oraz wersję Node (wymóg projektu: `>=22.20.0`),
   - sposób użycia pnpm przez corepack (`corepack prepare pnpm@12.2.1 --activate`),
   - dokładne komendy:
     ```
     pnpm install --frozen-lockfile
     pnpm build
     pnpm build:addon   # albo: node scripts/build.mjs addon --no-build
     ```
   - uwaga: domyślne środowisko review to Ubuntu 24.04 ARM64 + Node 24.14.0 + npm 11.9.0,
     a my budujemy pnpm — trzeba to jasno zaznaczyć,
   - lista bibliotek third-party + linki.
2. **`browser_specific_settings.gecko.data_collection_permissions`** — **wymagane** dla
   nowych submissionów do AMO od **3 listopada 2025**. Skoro nic nie zbieramy ani nie
   transmitujemy, właściwa deklaracja to `{ "required": ["none"] }`. To wymóg dla nowych
   zgłoszeń i **nie zależy** od `strict_min_version`. Ustawiamy `gecko.strict_min_version`
  = `140.0` oraz `gecko_android.strict_min_version` = `142.0`, bo od tych wersji
  `data_collection_permissions` jest wspierane (inaczej walidator AMO ostrzega).
3. **Listing AMO** musi wprost mówić: podmienia New Tab, konfiguracja trzymana lokalnie,
   linki otwierane po kliknięciu (§1 No Surprises).
4. **Support contact** — wymagany przez umowę (§5(b)); obecnie brak w repozytorium.

## Ryzyka (P1)

- **Loga brandów** (`logos` + `simple-icons`: Google, GitHub, Grafana, Proxmox, Twitch,
  TrueNAS, …): pakiety są CC0/MIT (copyright OK), ale **CC0 nie daje praw do znaków
  towarowych**. To ryzyko IP/trademark, a **nie automatyczny blocker**; bądź gotowy usunąć
  logo na żądanie (umowa §5(c)).
- **`browser_specific_settings.gecko.id = starter-page@caffeinatedpinguin`** — **jest już
  technicznie poprawne**. Mozilla wymaga formatu „email-like” albo GUID, nie prawdziwej
  domeny (regex dopuszcza taki identyfikator). Identyfikator oparty o własną domenę jest
  ładniejszy semantycznie, ale niekonieczny.
- **CI nie podpisuje addonu** (`release.yml`) — dla self-distributed wymagane
  `web-ext sign` / API; opublikowany zip jest niepodpisany.
- Repo `manifest.json` ma wersję `0.1.0`, a `package.json` `0.7.0`; CI nadpisuje wersję z
  tagu — kosmetyka.

## Koszty

- Opłat nie znaleziono w oficjalnej dokumentacji („No fee found in reviewed official docs”).
- Koszty pozafinansowe: czas review, source archive przy każdym release, wsparcie
  użytkowników, utrzymanie zgodności, odpowiedzialność IP.

## Automatyzacja (JS w `scripts/`)

Dwie komendy (skrypty Node, bez bash):

- `pnpm amo:build` — tworzy w `build/` (gitignored) **tylko dwa artefakty**:
  - `starter-page-v<wersja>-addon.zip` → **wgrywasz do checkera Firefox/AMO**,
  - `starter-page-v<wersja>-source.zip` → **załączasz jako source code** (źródła +
    `pnpm-lock.yaml` + `BUILD.md` + `THIRD-PARTY.md` + `LISTING.md`).
- `pnpm amo:check` — waliduje **dokładnie ten addon ZIP** (rozpakowany) + spójność
  wersji/tagów. Raport idzie na stdout/stderr (bez pliku), exit 1 przy FAIL.

Kolejność: najpierw `amo:build`, potem `amo:check`. `amo:check` nic nie zapisuje na
dysk, więc nie brudzi gita.

> AMO przyjmuje **dwa osobne pliki, w dwóch krokach**. Najpierw wybierasz tylko addon
> (`build/starter-page-v<wersja>-addon.zip`, pole „Select file" — nazwa kończy się
> `.zip`, co AMO akceptuje). Źródłowy `build/starter-page-v<wersja>-source.zip`
> dokładasz **później** (pole „Source code" / Manage → Status & Versions), bo build
> jest minifikowany. **Nie łączy się ich w jeden zip.**

Inputy (opcjonalne) w `amo-submission.config.json` (gitignored; wzór:
`amo-submission.config.example.json`):

```json
{
  "supportContact": "https://github.com/CaffeinatedPinguin/starter-page/issues",
  "homepageUrl": "https://github.com/CaffeinatedPinguin/starter-page",
  "listingDescription": "…",
  "reviewNotes": ""
}
```

Wypełnione pola trafiają do `BUILD.md` w zipie źródłowym i odhaczają pozycje w
raporcie. Cel: po dodaniu `data_collection_permissions: ["none"]` i uzupełnieniu
configu `amo:check` nie powinien mieć FAIL.

## Ręczna wysyłka do AMO (GitHub Actions)

Workflow `.github/workflows/firefox.yml` uruchamiany jest **tylko ręcznie**
(`workflow_dispatch`). Sam wybiera najnowszy stabilny tag `vX.Y.Z`, buduje z
dokładnie tego tagu, waliduje (`amo:build`, `amo:check`, `web-ext lint`) i
wysyła addon wraz ze źródłami do AMO jako **unlisted / self-distributed**. Nie
publikuje XPI, nie tworzy GitHub Release i nie dołącza niczego do release.
Podpisany XPI pobierasz później ręcznie z AMO i dołączasz go do istniejącego
GitHub Release.

Wymagane sekrety repozytorium GitHub Actions — skonfiguruj je **ręcznie** w
Settings → Secrets and variables → Actions (workflow ich nie tworzy, nie
wypisuje i nie umieszcza w artefaktach ani w source ZIP):

- `AMO_JWT_ISSUER` — klucz API (JWT issuer) z addons.mozilla.org,
- `AMO_JWT_SECRET` — sekret API (JWT secret) z addons.mozilla.org.

Mapowanie: `AMO_JWT_ISSUER` → `web-ext --api-key`, `AMO_JWT_SECRET` →
`web-ext --api-secret`.

## Checklist przed każdym release

```
[ ] wersja zaktualizowana w package.json i manifest.json; tag = v<wersja> (pilnuje tego release.yml)
[ ] manifest.json poprawny (MV3, gecko.id, strict_min_version)
[ ] data_collection_permissions.required = ["none"]
[ ] tylko wymagane uprawnienia (storage; brak host_permissions)
[ ] chrome_url_overrides.newtab -> index.html (lokalny)
[ ] paczka addonu bez config.json / config/
[ ] brak remote executable code
[ ] Iconify build-time (mode:'svg', allowAPI:false)
[ ] fonty lokalne
[ ] brak analityki/telemetrii
[ ] search lokalny (query niepersystowane)
[ ] pnpm build / test / lint przechodzą
[ ] source archive + BUILD.md aktualne (OS, Node, corepack/pnpm, komendy)
[ ] lista bibliotek third-party + linki
[ ] ZIP bez zbędnych plików
[ ] trademarki logotypów przejrzane
[ ] listing AMO zgodny z rzeczywistością
[ ] support contact gotowy
[ ] tag + artefakty CI
[ ] (self-distributed) podpisanie + mechanizm aktualizacji
```

## Źródła (oficjalne)

- Add-on Policies: https://extensionworkshop.com/documentation/publish/add-on-policies/
  (§1 No Surprises, §2 Content, §3.1 Source, §4 Development, §6 Data, §6.3 Private)
- Distribution Agreement: https://extensionworkshop.com/documentation/publish/firefox-add-on-distribution-agreement/
  (§5, §6, §7, §9, §10)
- Source code submission: https://extensionworkshop.com/documentation/publish/source-code-submission/
- Data consent: https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
- Signing/distribution: https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/
- `incognito` (MDN): https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/incognito

## Odpowiedź końcowa

**Czy wysłać dzisiejszy build na AMO? NIE** — przed submissionem trzeba dodać
`data_collection_permissions: { "required": ["none"] }`, przygotować source archive +
reproducible build instructions oraz podać support contact / listing metadata. `gecko.id`
jest już technicznie poprawne. Kwestia brand logo to ryzyko IP/trademark, a nie
automatyczny blocker.
