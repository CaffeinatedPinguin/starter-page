import type {LinkEntry} from '@/models/starter-page';

/**
 * Sorts links for display: links with an explicit `order` come first,
 * ordered by that value (stable); links without `order` keep config order
 * after them. Returns a new array; the input is never mutated.
 */
export function sortLinks(links: LinkEntry[]): LinkEntry[] {
  return links
    .map((link, index) => ({link, index}))
    .sort((a, b) => {
      if (a.link.order === undefined && b.link.order === undefined) return a.index - b.index;
      if (a.link.order === undefined) return 1;
      if (b.link.order === undefined) return -1;
      return a.link.order - b.link.order || a.index - b.index;
    })
    .map((entry) => entry.link);
}
