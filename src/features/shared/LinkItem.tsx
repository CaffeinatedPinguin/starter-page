import type {LinkEntry} from '@/models/starter-page';
import {AppIcon} from './AppIcon';
import {LinkTooltip} from './LinkTooltip';

/**
 * Single shared link row. The anchor is a real semantic `<a href>`: left
 * click opens in the same tab; middle/Ctrl/Cmd click and the context menu keep
 * their native browser behavior. No click handlers are attached.
 *
 * `matched` highlights the whole row for an active query; `dimmed` softly
 * fades a non-matching row while a query is active. With no active query both
 * are false (neutral state).
 */
export function LinkItem({
  link,
  matched = false,
  dimmed = false,
}: {
  link: LinkEntry;
  matched?: boolean;
  dimmed?: boolean;
}) {
  const className = [
    'link-item',
    matched ? 'link-item--matched' : '',
    dimmed ? 'link-item--dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={className}>
      <LinkTooltip link={link}>
        <a className="link-item__anchor" href={link.url}>
          <AppIcon className="link-item__icon" name={link.icon}/>
          <span className="link-item__name">{link.name}</span>
        </a>
      </LinkTooltip>
    </li>
  );
}
