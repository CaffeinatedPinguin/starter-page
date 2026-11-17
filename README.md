# starter-page

A configurable, offline start page for a homelab. One React + Vite + TypeScript app, built once and
shipped as a Docker/nginx web page and as a Manifest V3 add-on that replaces the New Tab.

[![CI workflow status](https://github.com/CaffeinatedPinguin/starter-page/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/CaffeinatedPinguin/starter-page/actions/workflows/ci.yml)
[![Latest version](https://img.shields.io/github/v/release/CaffeinatedPinguin/starter-page?label=version&sort=semver)](https://github.com/CaffeinatedPinguin/starter-page/releases/latest)
[![License](https://img.shields.io/github/license/CaffeinatedPinguin/starter-page)](LICENSE)

**Status:** active, maintained by one person on a best-effort basis. Issues are welcome; outside
pull requests are not accepted. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Overview

`starter-page` renders a configurable, offline, searchable list of links. It is built once
(`pnpm build` -> `dist/`) and deployed in two forms from that build:

| Form | Runtime | Configuration |
|---|---|---|
| Web | Docker + nginx over HTTP/HTTPS | `/config.json`, a runtime asset served by nginx |
| Browser add-on | Manifest V3 (Chrome, Brave, Firefox) | `browser.storage.local`, imported from `options.html` |

The compiled frontend is identical for both. Only the runtime data source differs. See
[Deployment](#deployment).

## Features

- **One build, two targets.** The web page and the add-on share one `dist/`; no frontend is
  duplicated.
- **Independent Starter Pages.** Each page has its own layout and is loaded in memory, without a
  router. `categorized` is the only page today.
- **Local search.** Matching rows are highlighted, not filtered. Search ignores case and diacritics
  and needs no fuzzy-search dependency.
- **Runtime config.** The web app reads `/config.json` from nginx, so you can replace or
  shadow-mount it without rebuilding the image.
- **Self-contained.** Icons are generated at build time and fonts are bundled. There is no CDN and
  no runtime fetch.
- **Semantic links.** Real `<a href>` elements keep middle click, Ctrl/Cmd click and the browser
  context menu working.
- **No collection.** The add-on asks for the `storage` permission only, makes no network requests
  and keeps search in memory.

## Quick start

Requires Node 22.22.2 or newer and pnpm through Corepack:

```bash
corepack enable
corepack prepare pnpm@12.2.1 --activate
pnpm install
pnpm dev
```

`pnpm dev` starts Vite in web mode and reads `config.json` from the repository root.

## Deployment

### Web (Docker / nginx)

```bash
pnpm build
docker build -t starter-page .
docker run --rm -p 8080:8080 starter-page
```

`/config.json` is served with `Cache-Control: no-store`. You can replace or shadow-mount it after
the image is built; a page reload picks it up.

### Browser add-on

```bash
pnpm build:all   # -> build/web + build/addon + build/starter-page-addon.zip
```

Load `build/addon/` as an unpacked extension, or install the released
`starter-page-v<version>-chromium.zip`. The add-on stores configuration in `browser.storage.local`;
import a `config.json` from the options page (`options.html`). It accepts the same schema as the web
app.

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

- `title`: document title.
- `heading`, `subtitle`: passed to the selected page.
- `defaultPage`: page id used when no local preference exists (`categorized` today).
- `categories`: optional per-category `icon` and `color`.
- `links[]`: shared link data (`LinkEntry`) with a stable unique `id`, `name`, `url` (absolute
  `http(s)` or app-relative `/path`), and optional `icon`, `description`, `category`, `order`.

A link is declared once and rendered by any page. User preferences (`entryPage`) are separate from
application data: `localStorage` on the web, extension storage in the add-on, never in `config.json`.
The `config.json` in the repository root is a complete example.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Vite dev server in web mode. |
| `pnpm build` | Production build: `vite build` + `tsc -b --noEmit` -> `dist/`. |
| `pnpm build:all` | One Vite build -> `build/web` + `build/addon` (+ add-on zip). |
| `pnpm build:web` | Web output from an existing `dist/` (`--no-build`). |
| `pnpm build:addon` | Validated add-on output + zip from an existing `dist/`. |
| `pnpm preview` | Preview the production build. |
| `pnpm test` | Vitest, once. |
| `pnpm test:watch` | Vitest in watch mode. |
| `pnpm lint` | ESLint. |
| `pnpm typecheck` | `tsc -b --noEmit`. |
| `pnpm version:patch` | Bump `package.json` + `manifest.json` (`:minor` / `:major` too). |
| `pnpm amo:build` | Versioned AMO artifacts: `build/starter-page-v<version>-{addon,source}.zip`. |
| `pnpm amo:check` | AMO readiness validation of the built add-on (also runs `web-ext lint`). |

## Architecture

The initial page is resolved during bootstrap: detect the runtime, load data and preferences, pick
the page (`entryPage` -> `defaultPage` -> safe fallback), then `import()` only that page. Vite emits
one chunk per Starter Page.

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

Workflows live in `.github/workflows/`. Every third-party action is pinned to a full commit SHA, so
a moved tag cannot swap the code under you.

- **`ci.yml`**: runs on pull requests, pushes to `main`, `vX.Y.Z` tags and manual dispatch. It calls
  the shared `templates` workflows for tests and build, the Docker image, the release (tags only),
  the PR title check and the dependency review. `ci-required` is the only required check; it passes
  when the other jobs pass or are skipped.
- **`firefox.yml`**: manual only. It builds the add-on and its source and submits them to Mozilla
  AMO as an unlisted, self-distributed package.
- **`stale.yml`**: closes issues with the `needs-info` label that get no reply.
- **`dependabot-auto-merge.yml`**: enables auto-merge for Dependabot pull requests, except major
  updates.

Dependabot keeps GitHub Actions, the npm/pnpm dependencies and the Docker image up to date.

## Documentation

Start at [docs/index.md](docs/index.md) for the runtime model, the module boundaries and the AMO
submission guide.

## Releases

Tagged releases are published on the [GitHub releases page](https://github.com/CaffeinatedPinguin/starter-page/releases):

- Chromium add-on: `starter-page-v<version>-chromium.zip`.
- Container image: `ghcr.io/caffeinatedpinguin/starter-page:<version>`.

Firefox (AMO) builds are submitted manually as unlisted/self-distributed. The signed XPI is attached
to the matching release after Mozilla approval. See
[docs/firefox-amo-submission.md](docs/firefox-amo-submission.md) for the checklist and the
`AMO_JWT_ISSUER` / `AMO_JWT_SECRET` repository secrets.

## Security

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Do not open a public
issue for a security problem.

## License

Apache-2.0. See [LICENSE](LICENSE).
