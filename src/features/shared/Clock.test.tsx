import {act, cleanup, render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {Clock, formatDateLine, formatDateTitle} from './Clock';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('formatDateLine', () => {
  it('formats the visible date as uppercase Polish', () => {
    const line = formatDateLine(new Date(2026, 8, 28, 20, 27, 30));
    expect(line).toBe('PONIEDZIAŁEK · 28 WRZEŚNIA · 2026');
  });

  it('formats the English tooltip translation', () => {
    const title = formatDateTitle(new Date(2026, 8, 28, 20, 27, 30));
    expect(title).toBe('MONDAY · SEPTEMBER 28 · 2026');
  });
});

describe('Clock', () => {
  it('renders a 24-hour HH:mm:ss clock and ticks every second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 28, 20, 27, 30));

    const {container} = render(<Clock/>);
    const clock = container.querySelector('.page-header__clock') as HTMLTimeElement;
    const seconds = container.querySelector('.page-header__clock-seconds');

    expect(clock.textContent).toBe('20:27:30');
    expect(seconds?.textContent).toBe(':30');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(clock.textContent).toBe('20:27:31');
  });

  it('renders the Polish date with an English tooltip and a native date input', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 28, 20, 27, 30));

    const {container} = render(<Clock/>);
    const date = container.querySelector('.page-header__date') as HTMLElement;
    const time = date.querySelector('time') as HTMLTimeElement;
    const input = container.querySelector('.page-header__date-input') as HTMLInputElement;

    expect(time.textContent).toBe('PONIEDZIAŁEK · 28 WRZEŚNIA · 2026');
    expect(time.getAttribute('dateTime')).toBe('2026-09-28');
    expect(date.getAttribute('data-tooltip')).toBe('MONDAY · SEPTEMBER 28 · 2026');
    expect(input.type).toBe('date');
    expect(input.value).toBe('2026-09-28');
  });
});
