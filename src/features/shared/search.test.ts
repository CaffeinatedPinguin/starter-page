import {describe, expect, it} from 'vitest';
import {normalizeSearchText} from './normalizeSearchText';
import {createLinkMatcher, matchesLink, normalizeQuery} from './matchesLink';
import type {LinkEntry} from '@/models/starter-page';

describe('normalizeSearchText', () => {
  it('is case-insensitive', () => {
    expect(normalizeSearchText('GitHub')).toBe('github');
  });

  it('strips decomposable diacritics', () => {
    expect(normalizeSearchText('Śródek')).toBe('srodek');
    expect(normalizeSearchText('Łódź')).toBe('lodz');
    expect(normalizeSearchText('Café')).toBe('cafe');
  });

  it('maps Polish ł/Ł explicitly (does not decompose under NFD)', () => {
    expect(normalizeSearchText('Ł')).toBe('l');
    expect(normalizeSearchText('ł')).toBe('l');
    expect(normalizeSearchText('Miłosz')).toBe('milosz');
  });
});

describe('matchesLink', () => {
  const link: LinkEntry = {
    id: 'x',
    name: 'Środek',
    url: 'https://lodz.example.com/cafe',
    category: 'Usługi',
    tooltip: 'Łódź Café',
  };

  it('matches accented query against accented name', () => {
    expect(matchesLink(link, 'srodek')).toBe(true);
    expect(matchesLink(link, 'Środek')).toBe(true);
  });

  it('matches lodz against Łódź in the url', () => {
    expect(matchesLink(link, 'lodz')).toBe(true);
  });

  it('matches cafe against Café in the url', () => {
    expect(matchesLink(link, 'cafe')).toBe(true);
  });

  it('matches on category', () => {
    expect(matchesLink(link, 'uslugi')).toBe(true);
  });

  it('matches on tooltip', () => {
    expect(matchesLink(link, 'cafe')).toBe(true);
  });

  it('returns false for an empty query (neutral state)', () => {
    expect(matchesLink(link, '')).toBe(false);
    expect(matchesLink(link, '   ')).toBe(false);
  });

  it('returns false when nothing matches', () => {
    expect(matchesLink(link, 'nonexistent')).toBe(false);
  });
});

describe('createLinkMatcher + normalizeQuery', () => {
  const dashboard: LinkEntry = {id: 'd', name: 'Dashboard', url: 'https://dashboard.example/'};
  const other: LinkEntry = {id: 'o', name: 'Status', url: 'https://status.example/'};

  it('normalizes the query once and reuses it across links', () => {
    expect(normalizeQuery('  DASHBOARD ')).toBe('dashboard');
    const isMatch = createLinkMatcher('DASHBOARD');
    expect(isMatch(dashboard)).toBe(true);
    expect(isMatch(other)).toBe(false);
  });

  it('treats an empty query as neutral (never matches)', () => {
    const isMatch = createLinkMatcher('   ');
    expect(isMatch(dashboard)).toBe(false);
  });
});
