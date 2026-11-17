# Contributing

This project is developed and maintained by a single person. To keep it sustainable:

- **Bugs and feature requests:** open an issue using one of the forms. Include everything the form
  asks for. Reports that cannot be reproduced get the `needs-info` label and are closed after 14 days
  without a reply. Search existing issues first.
- **Pull requests from outside contributors are not accepted.** Only collaborators can open them. If
  you have a fix, describe it in the issue and the maintainer will implement it.
- **Security issues:** never public. See [SECURITY.md](SECURITY.md).

## Local development

Requires Node 22.22.2 or newer and pnpm through Corepack:

```bash
corepack enable
corepack prepare pnpm@12.2.1 --activate
pnpm install
pnpm dev
```

Common commands:

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

Architecture and delivery are in [docs/architecture.md](docs/architecture.md).
