import type {LinkEntry} from '@/models/starter-page';

/**
 * Internal map key for uncategorized links. A symbol cannot collide with any
 * category name coming from user configuration.
 */
export const UNCATEGORIZED_KEY: unique symbol = Symbol('uncategorized');

/** Display label for the uncategorized group. */
export const UNCATEGORIZED_LABEL = '(bez kategorii)';

export type CategoryGroupKey = string | typeof UNCATEGORIZED_KEY;

/** Groups links by their optional category; uncategorized links go last. */
export function groupByCategory(links: LinkEntry[]): Map<CategoryGroupKey, LinkEntry[]> {
  const groups = new Map<CategoryGroupKey, LinkEntry[]>();
  const uncategorized: LinkEntry[] = [];

  for (const link of links) {
    if (link.category === undefined) {
      uncategorized.push(link);
    } else {
      const group = groups.get(link.category) ?? [];
      group.push(link);
      groups.set(link.category, group);
    }
  }

  if (uncategorized.length > 0) {
    groups.set(UNCATEGORIZED_KEY, uncategorized);
  }

  return groups;
}
