/**
 * ZIP helpers, backed by 7-Zip.
 *
 * 7-Zip always stores POSIX `/` entry names, which Mozilla requires (the
 * Windows PowerShell Compress-Archive path used to emit backslashes). The
 * reader below parses the raw central directory instead of `7z l`, because
 * 7-Zip's *display* on Windows uses backslashes even though the stored names
 * are already `/` — validation must see the real bytes.
 */
import {execFileSync} from 'node:child_process';
import {readFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';

/** Locates a 7-Zip executable. */
function find7z() {
  const candidates = [
    process.env.SEVEN_ZIP,
    process.env.PROGRAMFILES ? join(process.env.PROGRAMFILES, '7-Zip', '7z.exe') : null,
    process.env['PROGRAMFILES(X86)'] ? join(process.env['PROGRAMFILES(X86)'], '7-Zip', '7z.exe') : null,
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Programs', '7-Zip', '7z.exe') : null,
    '7z',
    '7za',
    '7zz',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['i'], {stdio: 'ignore'});
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

/**
 * Creates a ZIP from `sourceDir` with 7-Zip. Entries are relative to
 * `sourceDir` and stored with `/` separators.
 */
export function createZip(sourceDir, outPath) {
  const sevenZip = find7z();
  if (!sevenZip) {
    throw new Error('7-Zip not found — install it or set the SEVEN_ZIP env var to 7z(.exe).');
  }

  rmSync(outPath, {force: true});
  execFileSync(sevenZip, ['a', '-tzip', '-y', '-bso0', '-bsp0', outPath, '.'], {cwd: sourceDir});
}

/**
 * Extracts a ZIP into `destDir` with 7-Zip. Creation and extraction share the
 * same cross-platform 7-Zip dependency so both work on Windows and Linux and
 * fail clearly when no supported executable is available.
 *
 * Deliberately not `tar`: GNU tar (the default on Linux CI) cannot read ZIP
 * archives, even though bsdtar on Windows can.
 */
export function extractZip(zipPath, destDir) {
  const sevenZip = find7z();
  if (!sevenZip) {
    throw new Error('7-Zip not found — install it or set the SEVEN_ZIP env var to 7z(.exe).');
  }

  execFileSync(sevenZip, ['x', zipPath, `-o${destDir}`, '-y', '-bso0', '-bsp0'], {stdio: 'inherit'});
}

/** Returns the raw entry names stored in a ZIP (as-is, separators included). */
export function listZipEntries(zipPath) {
  const buffer = readFileSync(zipPath);
  const sig = 0x06054b50;
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0 && i >= buffer.length - 22 - 0xffff; i -= 1) {
    if (buffer.readUInt32LE(i) === sig) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('ZIP end-of-central-directory not found');

  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const names = [];
  for (let n = 0; n < count; n += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    names.push(buffer.toString('utf8', offset + 46, offset + 46 + nameLen));
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return names;
}
