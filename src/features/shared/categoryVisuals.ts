import {normalizeQuery} from './matchesLink';

/**
 * Deterministic category accent selection. The app must not hardcode any
 * category configuration: the accent is derived from the category name and
 * picked from the available palette tokens, so user-defined categories get a
 * stable, repeatable colour with no per-category data in the source.
 *
 * The config schema has no category colour/icon field (yet); if user-chosen
 * visuals are wanted later, add optional fields deliberately in a schema task.
 */

const ACCENTS = [
  'var(--accent-blue)',
  'var(--accent-cyan)',
  'var(--accent-green)',
  'var(--accent-violet)',
  'var(--accent-orange)',
  'var(--accent-pink)',
] as const;

const NEUTRAL_ACCENT = 'var(--accent-neutral)';

/** Small deterministic string hash (stable across sessions/platforms). */
function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

/** Returns a palette accent for a category label; empty label is neutral. */
export function getCategoryAccent(label: string): string {
  const key = normalizeQuery(label);
  if (key === '') return NEUTRAL_ACCENT;
  return ACCENTS[hash(key) % ACCENTS.length];
}
