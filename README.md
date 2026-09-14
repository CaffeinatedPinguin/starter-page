# starter-page

**A configurable start page for your homelab — one React + Vite + TypeScript app, one build, shipped both as a Docker/nginx web page and as a Manifest V3 browser add-on that replaces the New Tab.**

[![ci](https://github.com/CaffeinatedPinguin/starter-page/actions/workflows/ci.yml/badge.svg)](https://github.com/CaffeinatedPinguin/starter-page/actions/workflows/ci.yml)
[![release](https://github.com/CaffeinatedPinguin/starter-page/actions/workflows/release.yml/badge.svg)](https://github.com/CaffeinatedPinguin/starter-page/actions/workflows/release.yml)
[![license](https://img.shields.io/github/license/CaffeinatedPinguin/starter-page)](https://github.com/CaffeinatedPinguin/starter-page/blob/main/LICENSE)

## Overview

`starter-page` renders a configurable, offline, searchable list of links. It is
built once (`pnpm build` → `dist/`) and deployed in two independent forms from
that same build:

| Form | Runtime | Configuration |
| --- | --- | --- |
| **Web** | Docker + nginx over HTTP/HTTPS | `/config.json`, a runtime asset served by nginx |
| **Browser add-on** | Manifest V3 (Chrome, Brave, Firefox) | `browser.storage.local`, imported from `options.html` |

The compiled frontend is identical for both; only the runtime data source
differs. See [Deployment](#deployment) for details.

## Features

- **Single build, two targets** — no duplicated frontend; web and add-on share
  one `dist/`.
- **Independent Starter Pages** — each page is its own feature root with its own
  layout, selected in memory (no router). Only `categorized` ships today.
- **Local search** — highlights matching rows without filtering; case- and
  diacritic-insensitive, with no fuzzy-search dependency.
- **Runtime config, no rebuild** — the web app reads `/config.json` from nginx,
  so operators can replace or shadow-mount it without rebuilding the image.
- **Self-contained & offline** — icons are generated at build time
  (`@iconify/unplugin`, `allowAPI: false`) and fonts are bundled; no CDN, no
  runtime fetch.
- **Semantic links** — real `<a href>` elements; middle click, Ctrl/Cmd click
  and the browser context menu keep their native behavior.
- **No collection** — the add-on requests only the `storage` permission, makes
  no network requests and runs search entirely in memory.

## Quick start

Requires **Node ≥ 22.20.0** and **pnpm** (provided through Corepack):

```bash
corepack enable
corepack prepare pnpm@12.2.1 --activate
pnpm install
pnpm dev
```

`pnpm dev` starts Vite in web mode and reads `config.json` from the repository
root.

## Deployment

### Web (Docker / nginx)

```bash
pnpm build
docker build -t starter-page .
docker run --rm -p 8080:8080 starter-page
```

`/config.json` is served with `Cache-Control: no-store` and can be replaced or
shadow-mounted after the image is built — changing it needs only a page reload,
not a rebuild.

### Browser add-on

```bash
pnpm build:addon   # -> build/addon/ (unpacked) + build/starter-page-addon.zip
```

Load `build/addon/` as an unpacked extension, or install the released
`starter-page-v<version>-chromium.zip`. The add-on stores its configuration in
`browser.storage.local`; import a `config.json` from the options page
(`options.html`) and the same schema as the web app is accepted.

## Configuration

`config.json` is the only application data file:

```json
{
  "title": "Starter Page",
  "heading": "Welcome",
  "subtitle": "Pick a destination",
  "defaultPage": "categorized",
  "categories": {
    "General": { "icon": "home", "color": "#5b8def" }
  },
  "links": [
    { "id": "home", "name": "Home", "url": "/", "icon": "home", "category": "General", "order": 1 }
  ]
}
```

- `title` — document title.
- `heading`, `subtitle` — passed to the selected page.
- `defaultPage` — page id used when no local preference exists (currently
  `categorized`).
- `categories` — optional per-category `icon` and `color`.
- `links[]` — shared link data every page renders (`LinkEntry`): a stable unique
  `id`, `name`, `url` (absolute `http(s)` or app-relative `/path`), and optional
  `icon`, `tooltip`, `category`, `order`.

A link is declared once and rendered by any page — never duplicated because
pages display it differently. User preferences (`entryPage`) are kept strictly
apart from application data: `localStorage` on the web, extension storage in the
add-on, and never part of `config.json`. `config.json` in the repository root is
a complete example.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Vite dev server (web mode, `/config.json`). |
| `pnpm build` | Production build: `vite build` + `tsc -b --noEmit` → `dist/`. |
| `pnpm build:all` | One Vite build → `build/web` + `build/addon` (+ add-on zip). |
| `pnpm build:web` | Web output from an existing `dist/` (`--no-build`). |
| `pnpm build:addon` | Validated add-on output + zip from an existing `dist/`. |
| `pnpm preview` | Preview the production build. |
| `pnpm test` | Vitest (run once). |
| `pnpm test:watch` | Vitest in watch mode. |
| `pnpm lint` | ESLint. |
| `pnpm typecheck` | `tsc -b --noEmit`. |
| `pnpm amo:build` | Versioned AMO artifacts: `build/starter-page-v<version>-{addon,source}.zip`. |
| `pnpm amo:check` | AMO readiness validation of the built add-on (also runs `web-ext lint`). |

## Architecture

The initial page is resolved during bootstrap — detect runtime → load data and
preferences → pick the page (`entryPage` → `defaultPage` → safe fallback) →
`import()` only that page. Vite emits one chunk per Starter Page.

<details>
<summary>Source layout</summary>

```text
src/
├── app/                  # bootstrap: detect runtime -> load data -> render ONE page
│   ├── bootstrap.tsx     # entry point used by index.html (deps injectable)
│   ├── autoStart.ts      # browser-only auto-start guard (skipped under test)
│   ├── pageRegistry.ts   # page id -> dynamic import map (one chunk per page)
│   └── pageTypes.ts
├── config/
│   ├── environment.ts    # protocol-based runtime detection (web vs addon)
│   ├── configLoader.ts   # /config.json (web) vs extension storage (addon)
│   ├── storageAdapters.ts# JsonStorage adapters (extension + localStorage)
│   ├── storage.ts        # single runtime -> storage factory
│   ├── staticConfig.ts   # common parser: parseConfig + parsePreferences
│   └── storageKeys.ts
├── features/             # independent Starter Pages (feature roots)
│   ├── categorized/      # grouped, multi-column page (CategorizedPage)
│   └── shared/           # shared link behavior + primitives used by every page
├── models/               # common schema: StarterPageConfig, LinkEntry, preferences
├── styles/               # tokens.css + app.css (start page) + options.css
└── options/              # options page (thin composition; markup in options.html)
```

</details>

## Pipelines

Workflows live in `.github/workflows/` and all third-party actions are pinned to
full commit SHAs:

- **`ci.yml`** — on every push to `main` (and manual dispatch): test, lint,
  build, canonical add-on packaging/validation, Docker build and a container
  smoke test. Nothing is published.
- **`release.yml`** — on `v*.*.*` tags: validates the tag against
  `package.json`, publishes `ghcr.io/<owner>/starter-page:<version>`, builds the
  Chromium add-on ZIP and creates the GitHub release.
- **`firefox.yml`** — manual dispatch only: resolves the newest stable `vX.Y.Z`
  tag, builds and validates the AMO packages, and submits the add-on and source
  to Mozilla as **unlisted / self-distributed**. The signed XPI is downloaded
  and attached to the matching release by hand.

`ci.yml` and `release.yml` share a SHA-based concurrency group so a release tag
supersedes CI for the same commit. Firefox submissions are fully isolated.

## Releases

Tagged releases are published on GitHub — see
<https://github.com/CaffeinatedPinguin/starter-page/releases>:

- **Chromium add-on** — `starter-page-v<version>-chromium.zip`.
- **Container image** — `ghcr.io/caffeinatedpinguin/starter-page:<version>`.

Firefox (AMO) builds are submitted manually as unlisted/self-distributed; the
signed XPI is attached to the matching release after Mozilla approval. See
`docs/firefox-amo-submission.md` for the submission checklist and the required
`AMO_JWT_ISSUER` / `AMO_JWT_SECRET` repository secrets.

## License

Apache-2.0 — see [LICENSE](LICENSE).
