import {render, screen, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {LinkItem} from './LinkItem';
import type {LinkEntry} from '@/models/starter-page';

afterEach(cleanup);

function renderItem(link: LinkEntry, props: {matched?: boolean; dimmed?: boolean} = {}) {
  return render(
    <ul>
      <LinkItem link={link} {...props}/>
    </ul>,
  );
}

describe('LinkItem', () => {
  it('renders a semantic <a href> with the icon tile and name', () => {
    const link: LinkEntry = {id: 1, name: 'Docs', url: 'https://x.example/', icon: 'notes'};
    const {container} = renderItem(link);

    const anchor = screen.getByRole('link');
    expect(anchor.getAttribute('href')).toBe('https://x.example/');
    expect(anchor.querySelector('.link-item__icon-tile')).not.toBeNull();
    expect(anchor.querySelector('.link-item__icon')).not.toBeNull();
    expect(anchor.querySelector('.link-item__name')?.textContent).toBe('Docs');
    expect(container.querySelector('.link-item__description')).toBeNull();
  });

  it('renders the optional one-line description under the name', () => {
    const link: LinkEntry = {
      id: 2,
      name: 'Gmail',
      url: 'https://mail.example/',
      description: 'Poczta',
    };
    const {container} = renderItem(link);

    expect(container.querySelector('.link-item__description')?.textContent).toBe('Poczta');
  });

  it('applies the matched class to the whole row, not the anchor', () => {
    const {container} = renderItem({id: 3, name: 'Hit', url: 'https://z.example/'}, {matched: true});
    expect(container.querySelector('li.link-item--matched')).not.toBeNull();
    expect(container.querySelector('a.link-item--matched')).toBeNull();
  });

  it('applies the dimmed class for a non-matching row while a query is active', () => {
    const {container} = renderItem({id: 4, name: 'Miss', url: 'https://w.example/'}, {dimmed: true});
    expect(container.querySelector('li.link-item--dimmed')).not.toBeNull();
    expect(container.querySelector('li.link-item--matched')).toBeNull();
  });

  it('stays neutral (no matched/dimmed) when neither flag is set', () => {
    const {container} = renderItem({id: 5, name: 'Neutral', url: 'https://n.example/'});
    expect(container.querySelector('li')?.className).toBe('link-item');
  });

  it('does not intercept clicks (no onClick on the anchor or row)', () => {
    const {container} = renderItem({id: 6, name: 'Native', url: 'https://native.example/'});
    const anchor = container.querySelector('a') as HTMLAnchorElement;
    const li = container.querySelector('li') as HTMLLIElement;

    const event = new MouseEvent('click', {bubbles: true, cancelable: true});
    expect(anchor.dispatchEvent(event)).toBe(true);
    expect(anchor.onclick).toBeNull();
    expect(li.onclick).toBeNull();
  });
});
