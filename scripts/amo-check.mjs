#!/usr/bin/env node
/**
 * AMO submission readiness check for the starter-page Firefox addon.
 *
 * Validates the exact artifact that gets uploaded to Mozilla (the built addon
 * ZIP), extracting it to a temp dir and inspecting the extracted content. The
 * result is printed to stdout (PASS/WARN/summary) and stderr (FAIL) only — no
 * report file is written, so a clean git tree stays clean.
 *
 * Usage:
 *   node scripts/amo-check.mjs
 *   node scripts/amo-check.mjs --target build/starter-page-v0.7.0-addon.zip
 *   node scripts/amo-check.mjs --version v0.7.0
 *
 * Exit code: 0 = no blocking failures, 1 = at least one FAIL.
 */
import {execFileSync} from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {dirname, extname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {deriveAmoMeta} from './lib/amo-meta.mjs';
import {extractZip, listZipEntries} from './lib/zip.mjs';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = join(APP_ROOT, 'build');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    args[name] = value;
  }
  return args;
}

const readJson = (path, fallback = {}) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
};

function git(args) {
  try {
    return execFileSync('git', args, {cwd: APP_ROOT, encoding: 'utf8'}).trim();
  } catch {
    return '';
  }
}

const args = parseArgs(process.argv.slice(2));
const versionArg = args.version ?? null;
const pkg = readJson(join(APP_ROOT, 'package.json'));
const pkgVersion = pkg.version ?? null;
const expectedVersion = (versionArg ? String(versionArg) : pkgVersion ?? '').replace(/^v/, '') || null;

const versionedAddonZip = expectedVersion
  ? join(BUILD_DIR, `starter-page-v${expectedVersion}-addon.zip`)
  : null;
const versionedSourceZip = expectedVersion
  ? join(BUILD_DIR, `starter-page-v${expectedVersion}-source.zip`)
  : null;

const targetArg = resolve(
  APP_ROOT,
  args.target ??
    (versionedAddonZip && existsSync(versionedAddonZip)
      ? relative(APP_ROOT, versionedAddonZip)
      : 'build/addon'),
);

const configPath = resolve(APP_ROOT, args.config ?? 'amo-submission.config.json');
const config = existsSync(configPath) ? readJson(configPath) : {};

// ---------------------------------------------------------------- target I/O

let targetDir = targetArg;
let cleanupDir = null;

if (!existsSync(targetArg)) {
  console.error(`Target not found: ${targetArg}`);
  console.error('Build it first:  pnpm amo:build');
  process.exit(2);
}

const targetIsZip = statSync(targetArg).isFile() && extname(targetArg).toLowerCase() === '.zip';
if (targetIsZip) {
  cleanupDir = mkdtempSync(join(tmpdir(), 'amo-check-'));
  extractZip(targetArg, cleanupDir);
  targetDir = cleanupDir;
}

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push({rel: relative(base, full).replaceAll('\\', '/'), size: statSync(full).size});
  }
  return out;
}

const files = walk(targetDir);
const relPaths = new Set(files.map((f) => f.rel));
const read = (rel) => readFileSync(join(targetDir, rel), 'utf8');

// ------------------------------------------------------------------- checks

const results = [];
const add = (id, label, status, detail = '') => results.push({id, label, status, detail});

const BROAD_PERMISSIONS = [
  '<all_urls>', 'tabs', 'webRequest', 'webNavigation', 'scripting', 'cookies',
  'history', 'downloads', 'management', 'proxy', 'privacy', 'clipboardRead',
  'clipboardWrite', 'nativeMessaging', 'bookmarks', 'browsingData', 'geolocation',
];

let manifest = null;
if (!relPaths.has('manifest.json')) {
  add('manifest', 'manifest', 'FAIL', 'manifest.json missing from package');
} else {
  try {
    manifest = JSON.parse(read('manifest.json'));
    add('manifest', 'manifest', 'PASS', `name="${manifest.name}"`);
  } catch (error) {
    add('manifest', 'manifest', 'FAIL', String(error.message));
  }
}

if (manifest) {
  add('mv3', 'manifest v3', manifest.manifest_version === 3 ? 'PASS' : 'FAIL',
    `manifest_version=${manifest.manifest_version}`);

  const geo = manifest.browser_specific_settings?.gecko ?? {};
  const idOk = typeof geo.id === 'string'
    && (/^\{[0-9a-fA-F-]{36}\}$/.test(geo.id) || /^[^@\s]+@[^@\s]+$/.test(geo.id));
  add('gecko-id', 'gecko add-on id', idOk ? 'PASS' : 'WARN',
    geo.id ? geo.id : 'missing gecko.id (needed for signing)');

  add('min-version', 'min Firefox version', geo.strict_min_version ? 'PASS' : 'WARN',
    geo.strict_min_version ? String(geo.strict_min_version) : 'missing');

  const dcp = geo.data_collection_permissions;
  if (!dcp) {
    add('data-collection', 'data collection declaration', 'FAIL',
      'required since 2025-11-03; use required:["none"] when nothing is collected');
  } else {
    const req = Array.isArray(dcp.required) ? dcp.required : [];
    add('data-collection', 'data collection declaration', 'PASS', `required=${JSON.stringify(req)}`);
    if (req.includes('none') && req.length > 1) {
      add('data-collection-none', 'data collection "none"', 'WARN', '"none" should be the only entry');
    }
  }

  // data_collection_permissions needs Firefox 140+ / Android 142+, otherwise
  // the AMO validator warns that the key is unsupported by the min version.
  const minMajor = (value) => {
    const match = String(value ?? '').match(/^(\d+)/);
    return match ? Number(match[1]) : null;
  };
  const geckoMin = minMajor(geo.strict_min_version);
  const androidMin = minMajor(manifest.browser_specific_settings?.gecko_android?.strict_min_version);
  add('data-collection-min', 'data collection key supported by min version',
    dcp && geckoMin >= 140 && androidMin >= 142 ? 'PASS' : 'WARN',
    `gecko=${geo.strict_min_version ?? '?'}, gecko_android=${manifest.browser_specific_settings?.gecko_android?.strict_min_version ?? '?'} (need 140 / 142)`);

  const perms = Array.isArray(manifest.permissions) ? manifest.permissions : [];
  const broad = perms.filter((p) => BROAD_PERMISSIONS.includes(p));
  add('permissions', 'permissions', broad.length === 0 ? 'PASS' : 'FAIL',
    perms.length ? JSON.stringify(perms) : 'none');

  const hosts = Array.isArray(manifest.host_permissions) ? manifest.host_permissions : [];
  add('host-permissions', 'host permissions', hosts.length === 0 ? 'PASS' : 'WARN',
    hosts.length ? JSON.stringify(hosts) : 'none');

  const newtab = manifest.chrome_url_overrides?.newtab;
  const localNewtab = newtab === 'index.html' && relPaths.has('index.html');
  add('newtab', 'newtab override', localNewtab ? 'PASS' : 'FAIL',
    newtab ? `${newtab} (packaged=${relPaths.has('index.html')})` : 'missing');
}

// ------------------------------------------------------ version consistency

const repoManifestVersion = readJson(join(APP_ROOT, 'manifest.json')).version ?? null;
const builtVersion = manifest?.version ?? null;

add('version-package', 'version package.json', pkgVersion ? 'PASS' : 'FAIL', String(pkgVersion));
add('version-manifest-repo', 'version repo manifest',
  repoManifestVersion && repoManifestVersion === pkgVersion ? 'PASS' : 'FAIL',
  `${repoManifestVersion} vs ${pkgVersion}`);
add('version-manifest-built', 'version built manifest',
  builtVersion && builtVersion === expectedVersion ? 'PASS' : 'FAIL',
  `${builtVersion} vs ${expectedVersion}`);

if (expectedVersion) {
  const tag = `v${expectedVersion}`;
  const tagExists = git(['tag', '--list', tag]) !== '';
  add('version-tag', 'release tag', tagExists ? 'PASS' : 'WARN',
    tagExists ? tag : `missing local tag ${tag}`);
  if (tagExists) {
    const head = git(['rev-parse', 'HEAD']);
    const tagCommit = git(['rev-parse', `${tag}^{commit}`]);
    add('version-tag-head', 'tag points at HEAD', head && tagCommit && head === tagCommit ? 'PASS' : 'WARN',
      `HEAD=${head.slice(0, 7)}, ${tag}=${(tagCommit || '?').slice(0, 7)}`);
  }
}

// Runtime assets must never ship in the addon.
const hasConfig = relPaths.has('config.json')
  || [...relPaths].some((p) => p === 'config' || p.startsWith('config/'));
add('no-runtime-config', 'addon has no config.json', hasConfig ? 'FAIL' : 'PASS',
  hasConfig ? 'web-only runtime assets found' : 'clean');

const iconSizes = ['16', '32', '48', '128'];
const missingIcons = iconSizes.filter((s) => !relPaths.has(`icons/icon-${s}.png`));
add('icons', 'icons', missingIcons.length === 0 ? 'PASS' : 'WARN',
  missingIcons.length ? `missing ${missingIcons.map((s) => `${s}px`).join(', ')}` : 'all sizes');

add('license', 'LICENSE', relPaths.has('LICENSE') ? 'PASS' : 'WARN',
  relPaths.has('LICENSE') ? 'present' : 'missing');

// ------------------------------------------------------- bundle content scan

const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.css', '.html']);
const textFiles = files.filter((f) => TEXT_EXT.has(extname(f.rel).toLowerCase()));
const blob = textFiles.map((f) => read(f.rel)).join('\n');
const count = (re) => (blob.match(re) ?? []).length;

const evalHits = count(/\beval\s*\(|\bnew\s+Function\s*\(/g);
add('remote-exec', 'no remote code', evalHits === 0 ? 'PASS' : 'FAIL',
  `${evalHits} eval/new Function`);

// Remote network calls (external host literal) fail; local/same-origin is fine.
const REMOTE_NET = /\b(?:fetch|sendBeacon|EventSource|WebSocket)\s*\([^)]{0,90}?(?:https?:|wss?:)\/\/|\.open\s*\([^)]{0,90}?(?:https?:|wss?:)\/\//g;
const ANY_NET = /\bfetch\s*\(|XMLHttpRequest|\bWebSocket\b|EventSource|sendBeacon/g;

const remoteNet = [];
const localNet = [];
for (const f of textFiles) {
  const content = read(f.rel);
  if ((content.match(REMOTE_NET) ?? []).length) remoteNet.push(f.rel);
  const any = (content.match(ANY_NET) ?? []).length;
  if (any) localNet.push(`${f.rel} (${any})`);
}

add('network-remote', 'no remote network calls', remoteNet.length === 0 ? 'PASS' : 'FAIL',
  remoteNet.length ? remoteNet.join(', ') : 'none');
add('network-local', 'local/same-origin network only', 'PASS',
  localNet.length ? `${localNet.join(', ')}` : 'none');

add('no-analytics', 'no analytics/telemetry', count(/\b(gtag|googletagmanager|analytics|telemetry|sentry|mixpanel|posthog|amplitude)\b/gi) === 0 ? 'PASS' : 'FAIL');

add('iconify-runtime', 'no runtime Iconify/CDN',
  count(/iconify\.(design|app)|api\.iconify/g) === 0 ? 'PASS' : 'FAIL');

const htmlBlob = files.filter((f) => f.rel.toLowerCase().endsWith('.html')).map((f) => read(f.rel)).join('\n');
add('csp-inline-script', 'no inline scripts',
  /<script(?![^>]*\bsrc=)[^>]*>/i.test(htmlBlob) ? 'FAIL' : 'PASS');

const remoteUrlRe = /https?:\/\/[a-z0-9][a-z0-9.\-]*[a-z0-9](?::\d+)?(\/[^\s"'`)\\]*)?/gi;
const ALLOWED_HOSTS = /(^|\.)w3\.org$|(^|\.)invalid$|(^|\.)react\.dev$|(^|\.)example\.(com|org|net)$/i;
const remoteUrls = [...new Set((blob.match(remoteUrlRe) ?? []))]
  .filter((url) => {
    try { return !ALLOWED_HOSTS.test(new URL(url).hostname); } catch { return false; }
  });
add('remote-urls', 'no remote resources', remoteUrls.length === 0 ? 'PASS' : 'FAIL',
  remoteUrls.length ? remoteUrls.slice(0, 8).join(', ') : 'none');

add('remote-fonts', 'fonts bundled locally',
  /url\(\s*["']?https?:\/\//i.test(blob) ? 'FAIL' : 'PASS');

// Authoritative AMO lint: run web-ext's own linter against the exact extracted
// addon. Invoked through the current Node binary with web-ext's CLI entry so it
// works on Windows (.cmd shims break execFileSync) and Linux alike. A linter
// error fails the check; warnings are reported but do not.
function findWebExtEntry() {
  try {
    const require = createRequire(import.meta.url);
    const entry = join(dirname(require.resolve('web-ext')), 'bin', 'web-ext.js');
    return existsSync(entry) ? entry : null;
  } catch {
    return null;
  }
}

const webExtEntry = findWebExtEntry();
if (webExtEntry) {
  try {
    execFileSync(process.execPath, [webExtEntry, 'lint', '--source-dir', targetDir, '--self-hosted', '--output', 'text'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    add('web-ext-lint', 'web-ext lint', 'PASS');
  } catch (error) {
    add('web-ext-lint', 'web-ext lint', 'FAIL',
      String(error?.stdout ?? '').trim().split('\n').slice(-3).join(' | ') || String(error?.message ?? error));
  }
} else {
  add('web-ext-lint', 'web-ext lint', 'INFO', 'web-ext not installed — skipped');
}

// --------------------------------------------------------- artifact checks

add('addon-archive', 'addon archive',
  targetIsZip ? 'PASS' : 'WARN',
  targetIsZip ? relative(APP_ROOT, targetArg) : 'validated unpacked build (no addon zip found)');

const sourceArchive = config.sourceArchive ?? (
  versionedSourceZip && existsSync(versionedSourceZip)
    ? relative(APP_ROOT, versionedSourceZip)
    : null
);
add('source-archive', 'source archive', sourceArchive ? 'PASS' : 'WARN',
  sourceArchive ?? 'missing (run pnpm amo:build)');

// Inspect the raw ZIP entry names: Mozilla requires POSIX `/` separators and
// rejects backslashes, absolute paths and traversal entries.
function validateZipEntries(label, zipPath, requireManifest) {
  try {
    const entries = listZipEntries(zipPath);
    const backslash = entries.filter((e) => e.includes('\\'));
    const absolute = entries.filter((e) => e.startsWith('/') || /^[A-Za-z]:/.test(e));
    const traversal = entries.filter((e) => e.split(/[\\/]/).includes('..'));

    add(`zip-separators-${label}`, `${label} zip separators`,
      backslash.length === 0 ? 'PASS' : 'FAIL',
      backslash.length ? `${backslash.length} entry(ies) with backslash, e.g. ${backslash[0]}` : 'all POSIX /');
    add(`zip-paths-${label}`, `${label} zip entry paths`,
      absolute.length + traversal.length === 0 ? 'PASS' : 'FAIL',
      absolute.length ? `absolute: ${absolute[0]}` : traversal.length ? `traversal: ${traversal[0]}` : 'relative');

    if (requireManifest) {
      add(`zip-root-${label}`, `${label} manifest.json at root`,
        entries.includes('manifest.json') ? 'PASS' : 'FAIL',
        entries.includes('manifest.json') ? 'manifest.json' : 'not at archive root');
    }
  } catch (error) {
    add(`zip-${label}`, `${label} zip readable`, 'WARN', String(error?.message ?? error));
  }
}

const addonZipToCheck = versionedAddonZip && existsSync(versionedAddonZip)
  ? versionedAddonZip
  : targetIsZip
    ? targetArg
    : null;
if (addonZipToCheck) validateZipEntries('addon', addonZipToCheck, true);
if (versionedSourceZip && existsSync(versionedSourceZip)) validateZipEntries('source', versionedSourceZip, false);

const meta = deriveAmoMeta(APP_ROOT, config);
const metaOk = Boolean(meta.support && meta.homepage && meta.listing);
add('metadata', 'listing metadata', metaOk ? 'PASS' : 'WARN',
  metaOk ? `${meta.homepage} · ${meta.support}` : 'support/homepage/listing incomplete');
add('trademark', 'brand-logo trademark review', 'INFO', 'manual review required');

// ------------------------------------------------------------------- output

const dirty = git(['status', '--porcelain']);
add('git-clean', 'working tree', dirty === '' ? 'PASS' : 'WARN',
  dirty === '' ? 'clean' : `${dirty.split('\n').length} changed path(s) not committed`);

const fails = results.filter((r) => r.status === 'FAIL').length;
const warns = results.filter((r) => r.status === 'WARN').length;
const verdict = fails > 0 ? 'NOT READY' : warns > 0 ? 'READY AFTER MINOR CHANGES' : 'READY';

if (cleanupDir) rmSync(cleanupDir, {recursive: true, force: true});

const shown = results.filter((r) => r.status !== 'INFO');
console.log('AMO CHECK');
console.log('');
for (const r of shown) {
  const line = `${r.status.padEnd(4)}  ${r.label}${r.detail ? ` — ${r.detail}` : ''}`;
  if (r.status === 'FAIL') console.error(line);
  else console.log(line);
}
console.log('');
console.log(`RESULT: ${verdict}`);

process.exit(fails > 0 ? 1 : 0);
