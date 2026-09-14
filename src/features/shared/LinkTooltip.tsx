import * as Tooltip from '@radix-ui/react-tooltip';
import type {ReactNode} from 'react';
import type {LinkEntry} from '@/models/starter-page';

/**
 * Wraps a link trigger with a Radix tooltip only when the link actually has a
 * tooltip. Links without one stay a plain `<a>` — no empty tooltip instances.
 */
export function LinkTooltip({link, children}: {link: LinkEntry; children: ReactNode}) {
  if (!link.tooltip) {
    return <>{children}</>;
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="link-tooltip" sideOffset={6}>
          {link.tooltip}
          <Tooltip.Arrow className="link-tooltip__arrow"/>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
