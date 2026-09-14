import {render, cleanup} from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type {ReactNode} from 'react';
import {afterEach, describe, expect, it} from 'vitest';
import {LinkItem} from './LinkItem';
import type {LinkEntry} from '@/models/starter-page';

afterEach(cleanup);

function withProvider(node: ReactNode) {
  return render(<Tooltip.Provider>{node}</Tooltip.Provider>);
}

describe('LinkItem tooltip', () => {
  it('renders a plain <a> for a link without tooltip (no Radix trigger)', () => {
    const link: LinkEntry = {id: 1, name: 'NoTip', url: 'https://x.example/'};
    const {container} = withProvider(<ul><LinkItem link={link} matched={false}/></ul>);
    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('https://x.example/');
    // No tooltip data-state attributes should be added.
    expect(anchor?.getAttribute('data-state')).toBeNull();
  });

  it('keeps the anchor semantic and unchanged for a link with tooltip', () => {
    const link: LinkEntry = {id: 2, name: 'Tip', url: 'https://y.example/', tooltip: 'Opis'};
    const {container} = withProvider(<ul><LinkItem link={link} matched={false}/></ul>);
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://y.example/');
    expect(anchor?.textContent).toContain('Tip');
  });

  it('applies the matched class to the whole row, not the anchor', () => {
    const link: LinkEntry = {id: 3, name: 'Hit', url: 'https://z.example/'};
    const {container} = withProvider(<ul><LinkItem link={link} matched/></ul>);
    expect(container.querySelector('li.link-item--matched')).not.toBeNull();
    expect(container.querySelector('a.link-item--matched')).toBeNull();
  });

  it('applies the dimmed class for a non-matching row while a query is active', () => {
    const link: LinkEntry = {id: 4, name: 'Miss', url: 'https://w.example/'};
    const {container} = withProvider(<ul><LinkItem link={link} dimmed/></ul>);
    expect(container.querySelector('li.link-item--dimmed')).not.toBeNull();
    expect(container.querySelector('li.link-item--matched')).toBeNull();
  });

  it('stays neutral (no matched/dimmed) when neither flag is set', () => {
    const link: LinkEntry = {id: 5, name: 'Neutral', url: 'https://n.example/'};
    const {container} = withProvider(<ul><LinkItem link={link}/></ul>);
    const li = container.querySelector('li');
    expect(li?.className).toBe('link-item');
  });

  it('does not intercept clicks (no onClick on the anchor or row)', () => {
    const link: LinkEntry = {id: 6, name: 'Native', url: 'https://native.example/'};
    const {container} = withProvider(<ul><LinkItem link={link}/></ul>);
    const anchor = container.querySelector('a') as HTMLAnchorElement;
    const li = container.querySelector('li') as HTMLLIElement;

    // No React onClick handler is attached, so a dispatched click is not
    // default-prevented (native navigation/context-menu behavior is intact).
    const event = new MouseEvent('click', {bubbles: true, cancelable: true});
    const notPrevented = anchor.dispatchEvent(event);
    expect(notPrevented).toBe(true);

    // jsdom anchors have no own onclick property set by our code.
    expect(anchor.onclick).toBeNull();
    expect(li.onclick).toBeNull();
  });
});
