import {execFileSync} from 'node:child_process';

const DEFAULT_LISTING =
  'Replaces the Firefox New Tab with a local, configurable start page: import a config.json with grouped links, ' +
  'search them locally, and open services only when you click them. Your configuration is stored only in your ' +
  'browser; nothing is sent to any server.';

/** A value is "unset" when absent, blank, or an example placeholder like <owner>. */
const isUnset = (value) =>
  typeof value !== 'string' || value.trim() === '' || /[<>]/.test(value);

/** Derives the repo homepage from the git remote (GitHub only). */
function repoHomepage(appRoot) {
  try {
    const remote = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      cwd: appRoot,
      encoding: 'utf8',
    }).trim();
    const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/i);
    return match ? `https://github.com/${match[1]}` : '';
  } catch {
    return '';
  }
}

/**
 * Resolves AMO submission metadata with zero manual input: explicit values from
 * amo-submission.config.json win, otherwise everything is derived (homepage and
 * support from the git remote, listing from the default text).
 */
export function deriveAmoMeta(appRoot, config = {}) {
  const homepage = isUnset(config.homepageUrl) ? repoHomepage(appRoot) : config.homepageUrl.trim();
  return {
    homepage,
    support: isUnset(config.supportContact)
      ? homepage
        ? `${homepage}/issues`
        : '(set manually)'
      : config.supportContact.trim(),
    listing: isUnset(config.listingDescription) ? DEFAULT_LISTING : config.listingDescription.trim(),
    reviewNotes: isUnset(config.reviewNotes) ? '' : config.reviewNotes.trim(),
  };
}
