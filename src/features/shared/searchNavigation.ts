/**
 * Google fallback for the header search. The local query only highlights
 * matching link rows; pressing Enter hands the query to Google instead, so the
 * field serves both purposes without adding a command palette or extra UI.
 */

export const GOOGLE_SEARCH_BASE = 'https://www.google.com/search?q=';

/** Builds the Google results URL for a raw query. */
export function googleSearchUrl(query: string): string {
  return `${GOOGLE_SEARCH_BASE}${encodeURIComponent(query.trim())}`;
}

/**
 * Navigates to a Google search for `query`. Empty/whitespace queries are
 * ignored. `navigate` is injectable so tests never trigger real navigation.
 */
export function openGoogleSearch(
  query: string,
  navigate: (url: string) => void = (url) => window.location.assign(url),
): void {
  if (query.trim() === '') return;
  navigate(googleSearchUrl(query));
}
