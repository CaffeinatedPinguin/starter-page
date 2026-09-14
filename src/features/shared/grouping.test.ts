import {describe, expect, it} from 'vitest';
import {UNCATEGORIZED_KEY, groupByCategory} from './grouping';
import {sortLinks} from './sortLinks';
import type {LinkEntry} from '@/models/starter-page';

describe('sortLinks', () => {
  it('orders links with explicit order first, stable; unordered links keep config order after', () => {
    const links = [
      {id: 1, name: 'A', url: '/a', order: 2},
      {id: 2, name: 'B', url: '/b'},
      {id: 3, name: 'C', url: '/c', order: 1},
      {id: 4, name: 'D', url: '/d'},
      {id: 5, name: 'E', url: '/e', order: 2},
    ] satisfies LinkEntry[];

    expect(sortLinks(links).map((link) => link.id)).toEqual([3, 1, 5, 2, 4]);
  });

  it('keeps config order when no link has order', () => {
    const links = [
      {id: 1, name: 'A', url: '/a'},
      {id: 2, name: 'B', url: '/b'},
    ] satisfies LinkEntry[];

    expect(sortLinks(links).map((link) => link.id)).toEqual([1, 2]);
  });

  it('does not mutate the input array', () => {
    const links = [{id: 1, name: 'A', url: '/a', order: 5}] satisfies LinkEntry[];
    const copy = [...links];
    sortLinks(links);
    expect(links).toEqual(copy);
  });
});

describe('groupByCategory', () => {
  it('groups links by category and puts uncategorized links last', () => {
    const links = [
      {id: 1, name: 'A', url: '/a', category: 'First'},
      {id: 2, name: 'B', url: '/b'},
      {id: 3, name: 'C', url: '/c', category: 'Second'},
      {id: 4, name: 'D', url: '/d', category: 'First'},
    ] satisfies LinkEntry[];

    const groups = groupByCategory(links);

    expect([...groups.keys()]).toEqual(['First', 'Second', UNCATEGORIZED_KEY]);
    expect(groups.get('First')?.map((link) => link.id)).toEqual([1, 4]);
    expect(groups.get(UNCATEGORIZED_KEY)?.map((link) => link.id)).toEqual([2]);
  });

  it('returns an empty map for links without categories', () => {
    const links = [{id: 1, name: 'A', url: '/a'}] satisfies LinkEntry[];
    const groups = groupByCategory(links);
    expect([...groups.keys()]).toEqual([UNCATEGORIZED_KEY]);
    expect(groups.get(UNCATEGORIZED_KEY)).toHaveLength(1);
  });

  it('does not merge an explicit category named like the fallback label with uncategorized links', () => {
    const links = [
      {id: 1, name: 'A', url: '/a', category: '(bez kategorii)'},
      {id: 2, name: 'B', url: '/b'},
    ] satisfies LinkEntry[];
    const groups = groupByCategory(links);
    expect([...groups.keys()]).toEqual(['(bez kategorii)', UNCATEGORIZED_KEY]);
    expect(groups.get('(bez kategorii)')?.map((link) => link.id)).toEqual([1]);
    expect(groups.get(UNCATEGORIZED_KEY)?.map((link) => link.id)).toEqual([2]);
  });
});
