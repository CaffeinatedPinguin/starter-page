/**
 * Assembles the two deployment outputs from ONE Vite build (dist/).
 *
 * Usage: node scripts/build.mjs <web|addon|all> [--no-build]
 *
 *   web   -> build/web/   dist/ + runtime config.json (serve via nginx)
 *   addon -> build/addon/ dist/ + manifest.json + LICENSE (no config.json)
 *            and build/starter-page-addon.zip ready to load/ship
 *   all   -> one Vite build, then both outputs above
 *
 * `--no-build` reuses an existing dist/ instead of running Vite again (used by
 * CI/release to share the single build across jobs). The compiled frontend is
 * identical for both deployments; only runtime assets differ.
 */
import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {exec} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {createZip} from './lib/zip.mjs';

const execAsync = promisify(exec);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith('-'));
const skipBuild = args.includes('--no-build');

async function runBuild() {
    console.log('› vite build + typecheck (single shared frontend build)');
    await execAsync('pnpm run build', {cwd: root});
}

function requireDist() {
    if (!existsSync(join(root, 'dist', 'index.html'))) {
        throw new Error('dist/ is missing — run the shared build first: pnpm build (or pnpm build:all)');
    }
}

async function buildWeb() {
    const out = join(root, 'build', 'web');
    await rm(out, {recursive: true, force: true});
    await mkdir(out, {recursive: true});
    await cp(join(root, 'dist'), out, {recursive: true});

    // Runtime/deployment configuration is NOT part of the Vite build.
    await cp(join(root, 'config.json'), join(out, 'config.json'));
    console.log(`✓ dist/nginx output: ${out}`);
}

async function buildAddon() {
    const out = join(root, 'build', 'addon');
    await rm(out, {recursive: true, force: true});
    await mkdir(out, {recursive: true});
    await cp(join(root, 'dist'), out, {recursive: true});

    // Keep the packaged manifest version in lockstep with package.json so a
    // local addon build never drifts from the release version. Refuse to build
    // when the two disagree — bump both with `pnpm version:patch`.
    const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
    const {version} = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    if (manifest.version !== version) {
        throw new Error(
            `manifest.json version (${manifest.version}) does not match package.json (${version}) — ` +
            'bump both with `pnpm version:patch` (or minor/major)',
        );
    }
    manifest.version = version;
    await writeFile(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

    await cp(join(root, 'LICENSE'), join(out, 'LICENSE'));

    assertAddonPackage(out, manifest, version);

    const zipPath = join(root, 'build', 'starter-page-addon.zip');
    await rm(zipPath, {force: true});
    createZip(out, zipPath);
    console.log(`✓ addon output: ${out}`);
    console.log(`✓ addon zip:    ${zipPath}`);
}

function assertNoRuntimeConfig(dir) {
    if (existsSync(join(dir, 'config.json'))) {
        throw new Error('addon package must not contain config.json');
    }
    if (existsSync(join(dir, 'config'))) {
        throw new Error('addon package must not contain config/');
    }
}

// Files every packaged addon must contain (relative to the addon root).
const ADDON_REQUIRED_FILES = [
    'index.html',
    'options.html',
    'manifest.json',
    'LICENSE',
    'logo/favicon.svg',
    'icons/icon-16.png',
    'icons/icon-32.png',
    'icons/icon-48.png',
    'icons/icon-128.png',
];

/**
 * Canonical addon validation, shared by every packaging path (CI and release).
 * Guarantees a tagged release is independently safe: the generated manifest is
 * MV3 with the New Tab override and the storage permission, its version matches
 * package.json, required runtime files are present, and no web-only runtime
 * config leaks into the package.
 */
function assertAddonPackage(out, manifest, version) {
    const fail = (message) => {
        throw new Error(`addon validation failed: ${message}`);
    };

    if (manifest.manifest_version !== 3) {
        fail(`manifest_version must be 3 (got ${manifest.manifest_version})`);
    }
    if (manifest.chrome_url_overrides?.newtab !== 'index.html') {
        fail('chrome_url_overrides.newtab must be "index.html"');
    }
    const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
    if (!permissions.includes('storage')) {
        fail('manifest must request the "storage" permission');
    }
    if (manifest.version !== version) {
        fail(`generated manifest version ${manifest.version} does not match package.json ${version}`);
    }

    for (const rel of ADDON_REQUIRED_FILES) {
        if (!existsSync(join(out, rel))) {
            fail(`missing required addon file: ${rel}`);
        }
    }
    if (!existsSync(join(out, 'assets')) || !statSync(join(out, 'assets')).isDirectory()) {
        fail('missing addon assets/ directory');
    }

    assertNoRuntimeConfig(out);

    if (readFileSync(join(out, 'index.html'), 'utf8').includes('config/runtime.js')) {
        fail('index.html must not reference config/runtime.js');
    }
}

async function main() {
    if (target !== 'web' && target !== 'addon' && target !== 'all') {
        console.error('Usage: node scripts/build.mjs <web|addon|all> [--no-build]');
        process.exit(1);
    }

    if (skipBuild) {
        requireDist();
    } else {
        await runBuild();
    }

    if (target === 'web' || target === 'all') {
        await buildWeb();
    }
    if (target === 'addon' || target === 'all') {
        await buildAddon();
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
