import {render, screen, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {PageHeader} from './PageHeader';

afterEach(cleanup);

function renderHeader() {
  return render(<PageHeader title="Example" query="" onQueryChange={() => {}}/>);
}

describe('PageHeader', () => {
  it('renders the config title as the visible page <h1> brand', () => {
    renderHeader();
    const heading = screen.getByRole('heading', {level: 1});
    expect(heading.textContent).toBe('Example');
  });

  it('renders exactly one labeled search field', () => {
    renderHeader();
    expect(screen.getByLabelText('Szukaj linków')).not.toBeNull();
  });

  it('does not autofocus the search field on mount', () => {
    renderHeader();
    expect(document.activeElement).not.toBe(screen.getByLabelText('Szukaj linków'));
  });
});
