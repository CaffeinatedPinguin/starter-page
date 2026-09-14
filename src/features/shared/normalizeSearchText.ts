/**
 * Normalizes text for case- and diacritic-insensitive substring matching.
 *
 * NFD + stripping combining marks handles most accents (Ć, Ó, Ü, Ç, …), but
 * some letters do not decompose: notably Polish Ł/ł. Those are mapped
 * explicitly before normalization.
 *
 * No search/fuzzy dependency — a single deterministic normalization.
 */

const EXPLICIT_MAP: Record<string, string> = {
  ł: 'l',
  Ł: 'l',
};

export function normalizeSearchText(value: string): string {
  const mapped = value.replace(/[łŁ]/g, (char) => EXPLICIT_MAP[char] ?? char);
  return mapped
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
