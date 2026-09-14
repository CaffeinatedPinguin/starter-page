import {render, screen, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import CategorizedPage from './CategorizedPage';
import type {StarterPageConfig} from '@/models/starter-page';

afterEach(cleanup);

const config: StarterPageConfig = {
  title: 'Example',
  heading: 'Heading not rendered here',
  subtitle: 'Subtitle not rendered here',
  links: [
    {id: 1, name: 'Alpha', url: 'https://a.example/', icon: 'home', category: 'First'},
    {id: 2, name: 'Beta', url: 'https://b.example/', icon: 'server', category: 'First'},
    {id: 3, name: 'Gamma', url: 'https://c.example/', icon: 'world', category: 'Second'},
    {id: 4, name: 'Delta', url: 'https://d.example/'},
  ],
};

describe('CategorizedPage', () => {
  it('renders a multi-column category grid with one section per category', () => {
    const {container} = render(<CategorizedPage config={config}/>);
    expect(container.querySelector('.category-grid')).not.toBeNull();
    expect(container.querySelectorAll('.category')).toHaveLength(3);
  });

  it('renders a category header per group plus the uncategorized group', () => {
    render(<CategorizedPage config={config}/>);
    const headings = screen.getAllByRole('heading', {level: 2}).map((h) => h.textContent);
    expect(headings).toEqual(['First', 'Second', '(bez kategorii)']);
  });

  it('renders every link as a real <a href> with no trailing affordance', () => {
    render(<CategorizedPage config={config}/>);
    const anchors = screen.getAllByRole('link');
    expect(anchors).toHaveLength(4);
    expect(anchors[0].getAttribute('href')).toBe('https://a.example/');
    // The row contains only the icon and the name — no arrow/chevron text.
    expect(anchors[0].querySelector('.link-item__icon')).not.toBeNull();
    expect(anchors[0].querySelector('.link-item__name')?.textContent).toBe('Alpha');
  });

  it('renders all rows and category sections inline (no filtering, no regrouping)', () => {
    const {container} = render(<CategorizedPage config={config}/>);
    expect(container.querySelectorAll('.link-item')).toHaveLength(4);
    expect(container.querySelectorAll('.category')).toHaveLength(3);
  });
});
