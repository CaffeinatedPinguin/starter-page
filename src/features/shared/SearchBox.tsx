import type {RefObject} from 'react';
import {SEARCH_ICON} from './iconRegistry';

/**
 * Shared search field. Typing drives row highlighting in LinkList; submitting
 * (Enter) hands the query to the supplied handler, which opens a Google search.
 * It is purely controlled and never filters or navigates on its own.
 *
 * `inputRef` lets the page focus the field on the `/` or Ctrl/Cmd+F shortcut
 * without autofocusing on load (the New Tab omnibox keeps its native focus).
 */
export function SearchBox({
  value,
  onChange,
  onSubmit,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <span className="search-box__icon" aria-hidden="true">
        <SEARCH_ICON width={18} height={18}/>
      </span>
      <input
        ref={inputRef}
        aria-label="Szukaj linków"
        className="search-box__input"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Szukaj w Google lub filtruj linki…"
        type="search"
        value={value}
      />
      <kbd className="search-box__hint" aria-hidden="true">/</kbd>
    </form>
  );
}
