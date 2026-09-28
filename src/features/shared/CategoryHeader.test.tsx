import {render, screen, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {CategoryHeader} from './CategoryHeader';
import {getCategoryAccent} from './categoryVisuals';

afterEach(cleanup);

describe('getCategoryAccent', () => {
  it('is deterministic and case/diacritic-insensitive', () => {
    expect(getCategoryAccent('Usługi')).toBe(getCategoryAccent('uslugi'));
    expect(getCategoryAccent('Żółć')).toBe(getCategoryAccent('zolc'));
    expect(getCategoryAccent('Group')).toBe(getCategoryAccent('Group'));
  });

  it('picks from the available palette tokens', () => {
    const accent = getCategoryAccent('General');
    expect(accent.startsWith('var(--accent-')).toBe(true);
    expect(accent).not.toBe('var(--accent-neutral)');
  });

  it('returns the neutral accent for an empty label', () => {
    expect(getCategoryAccent('')).toBe('var(--accent-neutral)');
  });
});

describe('CategoryHeader', () => {
  it('renders the category label as a heading with an accent dot by default', () => {
    const {container} = render(<CategoryHeader label="Group"/>);
    const heading = screen.getByRole('heading', {level: 2});
    expect(heading.textContent).toContain('Group');
    expect(container.querySelector('.category__dot')).not.toBeNull();
    expect(container.querySelector('.category__dot')?.getAttribute('style')).toContain('--accent');
    expect(container.querySelector('.category__icon')).toBeNull();
  });

  it('renders a configured icon in place of the dot', () => {
    const {container} = render(<CategoryHeader label="Group" icon="home"/>);
    expect(container.querySelector('.category__icon svg')).not.toBeNull();
    expect(container.querySelector('.category__dot')).toBeNull();
  });
});
