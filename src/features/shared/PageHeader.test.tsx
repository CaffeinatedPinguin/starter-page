import {render, screen, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {PageHeader} from './PageHeader';

afterEach(cleanup);

function renderHeader(incognito = false) {
  return render(
    <PageHeader
      title="Example"
      query=""
      onQueryChange={() => {}}
      incognito={incognito}
    />,
  );
}

describe('PageHeader', () => {
  it('keeps the config title as a visually hidden page <h1>', () => {
    renderHeader();
    const heading = screen.getByRole('heading', {level: 1});
    expect(heading.textContent).toBe('Example');
    expect(heading.className).toContain('visually-hidden');
  });

  it('renders the clock and search field', () => {
    const {container} = renderHeader();
    expect(container.querySelector('.page-header__clock')).not.toBeNull();
    expect(screen.getByLabelText('Szukaj linków')).not.toBeNull();
  });

  it('does not autofocus the search field on mount', () => {
    renderHeader();
    expect(document.activeElement).not.toBe(screen.getByLabelText('Szukaj linków'));
  });

  it('shows no incognito badge by default', () => {
    renderHeader();
    expect(screen.queryByText('Okno prywatne')).toBeNull();
  });

  it('shows the incognito badge in a private context', () => {
    renderHeader(true);
    expect(screen.getByText('Okno prywatne')).not.toBeNull();
  });
});
