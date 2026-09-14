import type {LinkEntry} from '@/models/starter-page';
import {normalizeSearchText} from './normalizeSearchText';

/** Normalizes a raw query into the substring used for matching. */
export function normalizeQuery(query: string): string {
  return normalizeSearchText(query).trim();
}

function linkContains(link: LinkEntry, needle: string): boolean {
  if (needle === '') return false;

  const haystack = [
    link.name,
    link.url,
    link.category ?? '',
    link.tooltip ?? '',
  ];

  return haystack.some((field) => normalizeSearchText(field).includes(needle));
}

/**
 * Builds a predicate for one query, normalizing it a single time. Use this
 * when matching many links (it avoids re-normalizing the query per link).
 */
export function createLinkMatcher(query: string): (link: LinkEntry) => boolean {
  const needle = normalizeQuery(query);
  return (link) => linkContains(link, needle);
}

/**
 * True when the link matches the query as a case- and diacritic-insensitive
 * substring of name, url, category or tooltip. An empty query is neutral
 * (false). Prefer createLinkMatcher when matching multiple links.
 */
export function matchesLink(link: LinkEntry, query: string): boolean {
  return createLinkMatcher(query)(link);
}
