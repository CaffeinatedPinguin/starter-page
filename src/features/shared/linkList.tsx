import type {LinkEntry} from '@/models/starter-page';
import {LinkItem} from './LinkItem';
import {createLinkMatcher} from './matchesLink';
import {sortLinks} from './sortLinks';

/**
 * Shared link list rendering the common link data. It never filters links or
 * categories: the full layout is always rendered. An active query only
 * highlights matching rows and slightly dims the rest; an empty query leaves
 * every row in the neutral state.
 */
export function LinkList({links, query = ''}: {links: LinkEntry[]; query?: string}) {
  const isMatch = createLinkMatcher(query);
  const active = query.trim() !== '';

  return (
    <ul className="link-list">
      {sortLinks(links).map((link) => {
        const matched = active && isMatch(link);
        return (
          <LinkItem
            key={String(link.id)}
            link={link}
            matched={matched}
            dimmed={active && !matched}
          />
        );
      })}
    </ul>
  );
}
