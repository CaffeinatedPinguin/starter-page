import {render, screen, cleanup, fireEvent} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {PageHeader} from './PageHeader';

afterEach(cleanup);

function renderHeader(incognito = false, onSearchSubmit = vi.fn()) {
  render(
    <PageHeader
      title="Example"
      query=""
      onQueryChange={() => {}}
      onSearchSubmit={onSearchSubmit}
      incognito={incognito}
    />,
  );
  return onSearchSubmit;
}

describe('PageHeader', () => {
  it('keeps the config title as a visually hidden page <h1>', () => {
    renderHeader();
    const heading = screen.getByRole('heading', {level: 1});
    expect(heading.textContent).toBe('Example');
    expect(heading.className).toContain('visually-hidden');
  });

  it('renders the clock and search field', () => {
    const {container} = render(
      <PageHeader title="Example" query="" onQueryChange={() => {}} onSearchSubmit={() => {}}/>,
    );
    expect(container.querySelector('.page-header__clock')).not.toBeNull();
    expect(screen.getByLabelText('Szukaj linków')).not.toBeNull();
  });

  it('submits the current query through the form', () => {
    const onSubmit = vi.fn();
    render(
      <PageHeader
        title="Example"
        query="github"
        onQueryChange={() => {}}
        onSearchSubmit={onSubmit}
      />,
    );
    fireEvent.submit(screen.getByLabelText('Szukaj linków').closest('form') as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledWith('github');
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
