import {render, screen, cleanup} from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type {ReactElement} from 'react';
import {afterEach, describe, expect, it} from 'vitest';
import {LinkList} from './linkList';
import type {LinkEntry} from '@/models/starter-page';

afterEach(cleanup);

const links: LinkEntry[] = [
  {id: 1, name: 'Środek', url: 'https://a.example/', tooltip: 'opis'},
  {id: 2, name: 'Beta', url: 'https://b.example/'},
  {id: 3, name: 'Café', url: 'https://c.example/', category: 'Łódź'},
];

function renderList(node: ReactElement) {
  return render(<Tooltip.Provider>{node}</Tooltip.Provider>);
}

describe('LinkList', () => {
  it('renders every link as a real <a href> with no query', () => {
    renderList(<LinkList links={links}/>);
    const anchors = screen.getAllByRole('link');
    expect(anchors).toHaveLength(3);
    expect(anchors.map((a) => a.getAttribute('href'))).toEqual([
      'https://a.example/',
      'https://b.example/',
      'https://c.example/',
    ]);
  });

  it('does not remove any link when a query is active', () => {
    renderList(<LinkList links={links} query="beta"/>);
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('highlights only matching rows, accent-insensitively', () => {
    const {container} = renderList(<LinkList links={links} query="srodek"/>);
    const matched = container.querySelectorAll('.link-item--matched');
    expect(matched).toHaveLength(1);
    expect(matched[0].textContent).toContain('Środek');
  });

  it('dims non-matching rows while a query is active, keeping all links', () => {
    const {container} = renderList(<LinkList links={links} query="beta"/>);
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(container.querySelectorAll('.link-item--matched')).toHaveLength(1);
    expect(container.querySelectorAll('.link-item--dimmed')).toHaveLength(2);
  });

  it('highlights nothing for an empty query', () => {
    const {container} = renderList(<LinkList links={links} query=""/>);
    expect(container.querySelectorAll('.link-item--matched')).toHaveLength(0);
  });

  it('keeps every row neutral (no highlight, no dim) for an empty query', () => {
    const {container} = renderList(<LinkList links={links} query=""/>);
    expect(container.querySelectorAll('.link-item--matched')).toHaveLength(0);
    expect(container.querySelectorAll('.link-item--dimmed')).toHaveLength(0);
  });

  it('dims every row when the query matches nothing', () => {
    const {container} = renderList(<LinkList links={links} query="zzz-no-match"/>);
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(container.querySelectorAll('.link-item--dimmed')).toHaveLength(3);
  });

  it('matches lodz against Łódź category', () => {
    const {container} = renderList(<LinkList links={links} query="lodz"/>);
    const matched = container.querySelectorAll('.link-item--matched');
    expect(matched).toHaveLength(1);
    expect(matched[0].textContent).toContain('Café');
  });
});
