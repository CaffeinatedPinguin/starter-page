import {render, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {PageFooter} from './PageFooter';

afterEach(cleanup);

describe('PageFooter', () => {
  it('renders the logo mark and the author handle', () => {
    const {container} = render(<PageFooter/>);
    const logo = container.querySelector('.page-footer__logo') as HTMLImageElement;

    expect(logo.getAttribute('src')).toBe('/logo/favicon.svg');
    expect(logo.getAttribute('alt')).toBe('');
    expect(container.querySelector('.page-footer__name')?.textContent).toBe('smrodek');
  });
});
