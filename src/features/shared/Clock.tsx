import {useEffect, useState} from 'react';

const PL = 'pl-PL';
const EN = 'en-US';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Month name in the grammatical form used with a day ("28 września"). */
function monthName(date: Date, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, {day: 'numeric', month: 'long'}).formatToParts(date);
  return parts.find((part) => part.type === 'month')?.value ?? '';
}

/**
 * "PONIEDZIAŁEK · 28 WRZEŚNIA · 2026" (Polish) or the English tooltip variant
 * "MONDAY · SEPTEMBER 28 · 2026"; `monthFirst` selects the day/month order.
 */
function formatDate(date: Date, locale: string, monthFirst: boolean): string {
  const weekday = new Intl.DateTimeFormat(locale, {weekday: 'long'})
    .format(date)
    .toLocaleUpperCase(locale);
  const month = monthName(date, locale).toLocaleUpperCase(locale);
  const dayMonth = monthFirst ? `${month} ${date.getDate()}` : `${date.getDate()} ${month}`;

  return `${weekday} · ${dayMonth} · ${date.getFullYear()}`;
}

/** Visible Polish date line. */
export function formatDateLine(date: Date): string {
  return formatDate(date, PL, false);
}

/** English translation shown as the date line's tooltip. */
export function formatDateTitle(date: Date): string {
  return formatDate(date, EN, true);
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Refreshes the returned `Date` every `intervalMs` (default 1s). */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

/**
 * Opens the browser's native calendar for a date input. The picker is purely
 * informational — the visible date never changes — so there is no onChange
 * wiring to state. `showPicker` needs a user gesture and browser support; the
 * transparent input itself stays as the fallback.
 */
function openNativePicker(input: HTMLInputElement): void {
  try {
    input.showPicker?.();
  } catch {
    /* No user activation / unsupported: the native input is the fallback. */
  }
}

/**
 * Strongest element of the header: a compact Polish date line (English
 * translation on hover, native date picker on click) over a 24-hour clock
 * (HH:mm:ss). The seconds are rendered slightly dimmer than the rest.
 */
export function Clock() {
  const now = useNow();
  const date = isoDate(now);

  return (
    <div className="page-header__datetime">
      <div className="page-header__date" data-tooltip={formatDateTitle(now)}>
        <time dateTime={date}>{formatDateLine(now)}</time>
        <input
          aria-label="Pokaż kalendarz"
          className="page-header__date-input"
          onChange={() => undefined}
          onClick={(event) => openNativePicker(event.currentTarget)}
          type="date"
          value={date}
        />
      </div>
      <time className="page-header__clock" dateTime={now.toISOString()}>
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <span className="page-header__clock-seconds">:{pad(now.getSeconds())}</span>
      </time>
    </div>
  );
}
