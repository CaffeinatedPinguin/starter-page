#!/usr/bin/env node
/**
 * Builds the AMO source archive for the starter-page Firefox addon.
 *
 * Produces build/starter-page-source.zip containing everything a Mozilla
 * reviewer needs to reproduce the exact submitted addon:
 *   - full application source (src, public, scripts, configs, lockfile),
 *   - generated BUILD.md (environment + exact commands),
 *   - generated THIRD-PARTY.md (libraries, licenses, links),
 *   - a copy of the reviewed manifest and LICENSE.
 *
 * Inputs (optional) come from ./amo-submission.config.json (gitignored). See
 * ./amo-submission.config.example.json. Only the real config is used; the
 * example holds placeholders and is never embedded.
 *
 * Usage: node scripts/amo-source-archive.mjs
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {deriveAmoMeta} from './lib/amo-meta.mjs';
import {createZip} from './lib/zip.mjs';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = join(APP_ROOT, 'build');
const STAGING = join(BUILD_DIR, 'source');
const FENCE = '\u0060\u0060\u0060';

const readJson = (path, fallback = {}) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
};

// Optional overrides (gitignored). Everything below is derived automatically
// when the config is absent, so nothing has to be filled in by hand.
const config = readJson(join(APP_ROOT, 'amo-submission.config.json'));

const pkg = readJson(join(APP_ROOT, 'package.json'));
const {homepage, support, listing, reviewNotes} = deriveAmoMeta(APP_ROOT, config);

// Files/dirs copied verbatim into the source archive.
const INCLUDE_FILES = [
  'index.html',
  'options.html',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'vite.config.ts',
  'vitest.config.ts',
  'eslint.config.js',
  'manifest.json',
  'LICENSE',
  'README.md',
];
const INCLUDE_DIRS = ['src', 'public', 'scripts'];

// ---------------------------------------------------------------- staging

rmSync(STAGING, {recursive: true, force: true});
mkdirSync(STAGING, {recursive: true});

for (const file of INCLUDE_FILES) {
  const src = join(APP_ROOT, file);
  if (existsSync(src)) cpSync(src, join(STAGING, file));
}
for (const dir of INCLUDE_DIRS) {
  const src = join(APP_ROOT, dir);
  if (existsSync(src)) cpSync(src, join(STAGING, dir), {recursive: true});
}

// Never ship private/local files even if they appear in an included dir.
for (const name of ['amo-submission.config.json', 'tmp', 'node_modules', 'dist', 'build']) {
  rmSync(join(STAGING, name), {recursive: true, force: true});
}

// -------------------------------------------------------------- generated

const LIBRARIES = {
  react: ['MIT', 'https://github.com/facebook/react'],
  'react-dom': ['MIT', 'https://github.com/facebook/react'],
  '@radix-ui/react-tooltip': ['MIT', 'https://github.com/radix-ui/primitives'],
  '@fontsource/manrope': ['OFL-1.1', 'https://github.com/fontsource/fontsource'],
  '@iconify-json/tabler': ['MIT', 'https://github.com/tabler/tabler-icons'],
  '@iconify-json/logos': ['CC0-1.0', 'https://github.com/gilbarbara/logos'],
  '@iconify-json/simple-icons': ['CC0-1.0', 'https://github.com/simple-icons/simple-icons'],
  '@iconify/unplugin': ['MIT', 'https://github.com/iconify/iconify-unplugin'],
  vite: ['MIT', 'https://github.com/vitejs/vite'],
  '@vitejs/plugin-react': ['MIT', 'https://github.com/vitejs/vite-plugin-react'],
  typescript: ['Apache-2.0', 'https://github.com/microsoft/TypeScript'],
  vitest: ['MIT', 'https://github.com/vitest-dev/vitest'],
  eslint: ['MIT', 'https://github.com/eslint/eslint'],
};

const libRow = ([name, version, dev]) => {
  const [license, url] = LIBRARIES[name] ?? ['see package', `https://www.npmjs.com/package/${name}`];
  return `| ${name} | ${version} | ${license} | ${dev ? 'build' : 'runtime'} | ${url} |`;
};

const rows = [
  ...Object.entries(pkg.dependencies ?? {}).map(([n, v]) => libRow([n, v, false])),
  ...Object.entries(pkg.devDependencies ?? {}).map(([n, v]) => libRow([n, v, true])),
];

const now = new Date().toISOString().slice(0, 10);
const nodeEngine = pkg.engines?.node ?? '>=22.20.0';
const pnpmVersion = (pkg.packageManager ?? 'pnpm@12').split('@')[1];

const thirdParty = `# Third-party libraries

Generated: ${now} for ${'`'}${pkg.name}@${pkg.version}${'`'}.

Runtime libraries are bundled into the addon; build libraries are not shipped but
are required to reproduce the package. Icon collections are consumed at build time
by @iconify/unplugin and inlined as SVG (no runtime icon requests).

| Library | Version | License | Scope | Source |
|---|---|---|---|---|
${rows.join('\n')}

## Brand logos / trademarks

Some inlined icons are third-party brand marks (Google, GitHub, YouTube, Grafana,
Proxmox, TrueNAS, Twitch, Reddit, etc.) sourced from the Iconify logos and
simple-icons collections. Those collections are permissively licensed (CC0/MIT),
which covers the icon files' copyright but does not grant trademark rights. The
marks are used only to identify the corresponding destinations; they are not
intended to imply endorsement.
`;

const buildMd = `# Build instructions (AMO source submission)

Generated: ${now} for ${'`'}${pkg.name}@${pkg.version}${'`'}.

This archive reproduces the exact addon submitted to addons.mozilla.org. The
distributed package is built/transformed by tooling (see below), so source and
build instructions are provided as required by the AMO Add-on Policies §3.1.

## Tools that generate the bundled code

All are open source, run locally (none is web-based), and their versions are
pinned in pnpm-lock.yaml:

- Vite — bundler and minifier (rollup/rolldown + esbuild, CSS + PostCSS pipeline).
- TypeScript (tsc) — transpiles TS/TSX.
- @vitejs/plugin-react — JSX transform.
- @iconify/unplugin — generates the icon components from @iconify-json/* at build
  time (mode 'svg', allowAPI false); output is inlined SVG, no runtime icon API.

## Environment

- OS/arch: ${process.platform}/${process.arch} (built with Node ${process.version})
- Package manager: ${pkg.packageManager ?? 'pnpm'} (enable via corepack)
- Node: ${nodeEngine}
- Note: the AMO default review environment is Ubuntu 24.04 ARM64, Node 24.14.0,
  npm 11.9.0. This project uses pnpm; see the commands below rather than npm.
- The addon ZIP is created with 7-Zip (entries use POSIX '/'). On Linux install
  p7zip-full if you want to rebuild the identical container; the extracted
  contents are what matters.

## Build

${FENCE}sh
# from the directory containing this file (package.json + pnpm-lock.yaml)
corepack enable
corepack prepare pnpm@${pnpmVersion} --activate
pnpm install --frozen-lockfile
pnpm build            # Vite + tsc -> dist/ (compiled assets: JS, CSS, HTML, fonts)
pnpm build:addon      # -> build/addon/ (adds manifest.json + LICENSE) and the ZIP
${FENCE}

Output: build/addon/ is the unpacked extension that matches the submitted addon
(manifest.json at the archive root, then assets/, icons/, logo/, options.html,
index.html, LICENSE). Compare it against the submitted ZIP; there should be no
differences.

## Notes

- Icons are generated at build time (@iconify/unplugin, mode 'svg', allowAPI false)
  from @iconify-json/* collections pinned in the lockfile. No icon API/CDN call is
  made at build or runtime.
- The only network access during build is the package manager fetching the pinned
  dependencies from the official npm registry.
- config.json is NOT part of the addon (web-only runtime asset).

## Contact / listing metadata

- Support contact: ${support}
- Homepage / source: ${homepage || '(set in listing)'}
- Listing description: ${listing}
${reviewNotes ? `- Reviewer notes: ${reviewNotes}` : ''}
`;

const listingMd = `# AMO listing (ready to paste)

Generated: ${now} for ${'`'}${pkg.name}@${pkg.version}${'`'}.

- **Name:** Starter Page
- **Summary:** A local, configurable start page that replaces the Firefox New Tab.
- **Homepage:** ${homepage || '(set in listing)'}
- **Support:** ${support}
- **Privacy:** No data is collected or transmitted. Configuration is stored only in
  browser extension storage; search runs locally and is never sent anywhere.

## Description

${listing}

## Reviewer notes

This extension replaces the New Tab page with a page bundled in the addon. It
requests only the \`storage\` permission. It loads no remote code and makes no
network requests; external sites open only when the user clicks a link.
`;

writeFileSync(join(STAGING, 'BUILD.md'), buildMd, 'utf8');
writeFileSync(join(STAGING, 'THIRD-PARTY.md'), thirdParty, 'utf8');
writeFileSync(join(STAGING, 'LISTING.md'), listingMd, 'utf8');

// --------------------------------------------------------------------- zip

// Only the two real release artifacts end up in build/.
const version = pkg.version;
const addonZipIn = join(BUILD_DIR, 'starter-page-addon.zip');
const addonZipOut = join(BUILD_DIR, `starter-page-v${version}-addon.zip`);
const sourceZipOut = join(BUILD_DIR, `starter-page-v${version}-source.zip`);

if (!existsSync(addonZipIn)) {
  console.error('Addon zip missing — run the addon build first.');
  process.exit(1);
}

createZip(STAGING, sourceZipOut);
cpSync(addonZipIn, addonZipOut);

const count = (function walk(dir) {
  return readdirSync(dir, {withFileTypes: true}).reduce(
    (n, e) => n + (e.isDirectory() ? walk(join(dir, e.name)) : 1),
    0,
  );
})(STAGING);

// Keep build/ limited to the two release artifacts (drop staging + intermediate).
rmSync(STAGING, {recursive: true, force: true});
rmSync(addonZipIn, {force: true});
rmSync(join(BUILD_DIR, 'addon'), {recursive: true, force: true});

const rel = (p) => relative(process.cwd(), p) || p;
console.log(`✓ release artifacts in ${rel(BUILD_DIR)}/`);
console.log(`  ${rel(addonZipOut)}`);
console.log(`  ${rel(sourceZipOut)} (${count} source files)`);
