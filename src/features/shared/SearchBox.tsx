import type {RefObject} from 'react';
import {SEARCH_ICON} from './iconRegistry';

/**
 * Shared search field. Typing drives row highlighting in LinkList; it is
 * purely controlled and never filters, navigates or leaves the page.
 *
 * `inputRef` lets the page focus the field on the `/` or Ctrl/Cmd+F shortcut
 * without autofocusing on load (the New Tab omnibox keeps its native focus).
 */
export function SearchBox({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="search-box" role="search">
      <span className="search-box__icon" aria-hidden="true">
        <SEARCH_ICON width={18} height={18}/>
      </span>
      <input
        ref={inputRef}
        aria-label="Szukaj linków"
        className="search-box__input"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Szukaj wśród linków…"
        type="search"
        value={value}
      />
      <kbd className="search-box__hint" aria-hidden="true">/</kbd>
    </div>
  );
}
