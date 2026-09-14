import {render, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {AppIcon} from './AppIcon';

afterEach(cleanup);

function slotOf(markup: Parameters<typeof render>[0]): HTMLElement {
  return render(markup).container.querySelector('.app-icon') as HTMLElement;
}

describe('AppIcon', () => {
  it('renders a generic Tabler icon for a generic name', () => {
    const slot = slotOf(<AppIcon name="home"/>);
    expect(slot.classList.contains('app-icon--generic')).toBe(true);
    expect(slot.querySelector('svg')).not.toBeNull();
  });

  it('renders a full-color brand icon through the brand path', () => {
    const slot = slotOf(<AppIcon name="github"/>);
    expect(slot.classList.contains('app-icon--brand')).toBe(true);
    expect(slot.querySelector('svg')).not.toBeNull();
  });

  it('tints a monochrome Simple Icons brand, but not a generic or full-color logo', () => {
    expect(slotOf(<AppIcon name="proxmox"/>).style.color).not.toBe('');
    expect(slotOf(<AppIcon name="github"/>).style.color).toBe('');
    expect(slotOf(<AppIcon name="home"/>).style.color).toBe('');
  });

  it('renders the neutral fallback when the icon is absent or unknown', () => {
    expect(slotOf(<AppIcon/>).querySelector('svg')).not.toBeNull();
    expect(slotOf(<AppIcon name={'nope' as never}/>).querySelector('svg')).not.toBeNull();
  });
});
