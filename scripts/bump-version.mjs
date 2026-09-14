#!/usr/bin/env node
/**
 * Bumps the application version in BOTH package.json and manifest.json so the
 * Firefox add-on manifest can never drift from the canonical package version.
 *
 * package.json is the single source of truth; manifest.json is kept in lockstep
 * (release.yml requires the git tag to be exactly v<package.json.version>, and
 * scripts/build.mjs refuses to package when the two disagree).
 *
 * Usage:
 *   node scripts/bump-version.mjs patch        # 0.1.0 -> 0.1.1
 *   node scripts/bump-version.mjs minor        # 0.1.0 -> 0.2.0
 *   node scripts/bump-version.mjs major        # 0.1.0 -> 1.0.0
 *   node scripts/bump-version.mjs 1.2.3        # explicit version
 *   node scripts/bump-version.mjs patch --tag  # also commit and create tag vX.Y.Z
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'package.json');
const manifestPath = join(root, 'manifest.json');

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function nextVersion(current, target) {
    const match = current.match(SEMVER);
    if (!match) throw new Error(`current version is not x.y.z: ${current}`);

    const [major, minor, patch] = match.slice(1).map(Number);
    switch (target) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
            return `${major}.${minor}.${patch + 1}`;
        default:
            if (!SEMVER.test(target)) {
                throw new Error(`unknown bump target: ${target} (use major|minor|patch|x.y.z)`);
            }
            return target;
    }
}

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith('-'));
const createTag = args.includes('--tag');

if (!target) {
    console.error('Usage: node scripts/bump-version.mjs <major|minor|patch|x.y.z> [--tag]');
    process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const version = nextVersion(pkg.version, target);

pkg.version = version;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.version = version;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`version -> ${version} (package.json + manifest.json)`);

if (createTag) {
    const tag = `v${version}`;
    const git = (gitArgs) => execFileSync('git', gitArgs, {cwd: root, stdio: 'inherit'});
    git(['add', 'package.json', 'manifest.json']);
    git(['commit', '-m', `Release ${tag}`]);
    git(['tag', '-a', tag, '-m', tag]);
    console.log(`created commit + annotated tag ${tag}`);
    console.log('push with: git push origin main --follow-tags');
} else {
    console.log(`next: commit the bump, then tag with: git tag -a v${version} -m v${version}`);
}
