# starter-page architecture

This file owns the runtime model and the module boundaries of starter-page. The repository root is the application: one package manifest, one frontend build, and no nested apps or monorepo.

## Runtime model

- One build. `pnpm build` runs Vite and TypeScript once and writes `dist/`. The same compiled frontend is shipped in both deployment forms; only runtime assets differ.
- Web: a Docker image with nginx serves the static `dist/` output and `/config.json`. `config.json` is a runtime asset copied by the Dockerfile from the build context, never emitted into `dist/`; nginx serves it with `Cache-Control: no-store`, so operators can replace or shadow-mount it without rebuilding the image.
- Add-on: an MV3 (Manifest V3) package assembled from the same `dist/` plus `manifest.json` and `LICENSE`. `pnpm build:addon` validates the package and rejects `config.json` or `config/` inside it.
- New Tab override: `manifest.json` sets `chrome_url_overrides.newtab` to `index.html`. The add-on requests only the `storage` permission and makes no network requests.
- Add-on configuration lives in `browser.storage.local` (`chrome.storage.local` on Chromium). Users import a `config.json` through `options.html`; a missing configuration shows a setup notice instead of invented data.
- Runtime detection is protocol based, in `src/config/environment.ts`: `chrome-extension:`, `moz-extension:` and `safari-web-extension:` mean add-on; any other protocol means web. Detection never touches the URL path, hash or history.
- User preferences are separate from application data: `localStorage` on the web, extension storage in the add-on, and never part of `config.json`.

## Configuration and storage

- One config schema, in `src/models/starter-page.ts`: `StarterPageConfig`, `LinkEntry`, `StarterPagePreferences`, `PAGE_IDS` and the shared icon set. A link is declared once and rendered by any page; preferences are resolved separately.
- `src/config/staticConfig.ts` validates configuration and preferences with the same parser used by the options-page import, so invalid data is never written to storage.
- `src/config/configLoader.ts` loads `/config.json` for web or extension storage for the add-on, then resolves the entry page: local preference, then `defaultPage`, then the safe built-in fallback.
- `src/config/storageAdapters.ts` defines the `JsonStorage` boundary plus the `ExtensionStorage` and `LocalStorage` adapters. `src/config/storage.ts` selects the adapter from the detected runtime. Components never call extension storage directly; they use these storage adapters or the higher-level loaders.
- `src/config/storageKeys.ts` owns the storage key names shared by both deployment forms.
- All runtime selection lives in `src/config/*`: storage adapters, environment detection and the configuration loaders.

## Module boundaries

- `src/app/` is bootstrap only: `bootstrap.tsx` (entry), `autoStart.ts` (browser-only auto-start), `pageRegistry.ts` (`PAGE_LOADERS`) and `pageTypes.ts`.
- `src/features/` holds independent Starter Pages. `src/features/categorized/` is the only page that ships today; `src/features/shared/` holds link behavior, search and UI primitives used by every page.
- `src/models/` owns the common schema.
- `src/options/` is the options page: thin composition, with the markup in `options.html`.
- `src/styles/` holds design tokens, start-page styles and options styles.

## Starter Pages

Several independent Starter Pages can coexist. Each one is a separate feature root with its own layout, not a rendering mode of another page. Register a new stable id in `PAGE_IDS` in `src/models/starter-page.ts` and its dynamic import in `PAGE_LOADERS` in `src/app/pageRegistry.ts` together; Vite then emits one chunk per page. Add a page only when its design exists; do not add placeholder pages.

## Delivery

- CI and release automation live in `.github/workflows/`. `ci.yml` runs test, lint, build, add-on packaging and a Docker smoke test; `release.yml` publishes the container image and Chromium add-on from a version tag; `firefox.yml` submits the add-on to AMO manually.
- Every third-party GitHub Actions `uses:` reference is pinned to a full commit SHA.
- The Firefox AMO checklist and the `amo:build` / `amo:check` automation are documented in `docs/firefox-amo-submission.md`.
