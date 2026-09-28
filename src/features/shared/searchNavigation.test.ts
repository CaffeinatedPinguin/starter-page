import {describe, expect, it, vi} from 'vitest';
import {googleSearchUrl, openGoogleSearch} from './searchNavigation';

describe('googleSearchUrl', () => {
  it('encodes the query', () => {
    expect(googleSearchUrl('a b&c')).toBe('https://www.google.com/search?q=a%20b%26c');
  });
});

describe('openGoogleSearch', () => {
  it('navigates to the Google URL for a non-empty query', () => {
    const navigate = vi.fn();
    openGoogleSearch('  github  ', navigate);
    expect(navigate).toHaveBeenCalledWith('https://www.google.com/search?q=github');
  });

  it('ignores empty/whitespace queries', () => {
    const navigate = vi.fn();
    openGoogleSearch('   ', navigate);
    expect(navigate).not.toHaveBeenCalled();
  });
});
