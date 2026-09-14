import {render, screen, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {PageFrame} from './PageFrame';
import type {StarterPageConfig} from '@/models/starter-page';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const config: StarterPageConfig = {
  title: 'Example',
  heading: 'Heading',
  subtitle: 'Subtitle',
  links: [],
};

function renderFrame() {
  return render(
    <PageFrame page="categorized" config={config}>
      {() => null}
    </PageFrame>,
  );
}

describe('PageFrame search shortcut', () => {
  it('focuses the search field on Ctrl+F', () => {
    renderFrame();
    const input = screen.getByLabelText('Szukaj linków');
    expect(document.activeElement).not.toBe(input);

    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'f', ctrlKey: true, cancelable: true}));

    expect(document.activeElement).toBe(input);
  });

  it('focuses the search field on Cmd+F', () => {
    renderFrame();
    const input = screen.getByLabelText('Szukaj linków');

    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'F', metaKey: true, cancelable: true}));

    expect(document.activeElement).toBe(input);
  });
});

describe('PageFrame incognito badge', () => {
  it('shows the badge when the add-on runs in incognito', () => {
    vi.stubGlobal('browser', {extension: {inIncognitoContext: true}});

    renderFrame();

    expect(screen.getByText('Okno prywatne')).not.toBeNull();
  });

  it('hides the badge in a normal context', () => {
    renderFrame();

    expect(screen.queryByText('Okno prywatne')).toBeNull();
  });
});
