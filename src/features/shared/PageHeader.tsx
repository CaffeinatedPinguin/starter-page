import type {RefObject} from 'react';
import {SearchBox} from './SearchBox';

/**
 * Page header: brand (logo + title) centered above the search field, plus an
 * "Okno prywatne" badge pinned to the top-right corner when the add-on page
 * runs in a private/incognito context. The visible brand name is the page's
 * semantic <h1>; heading/subtitle from the config are intentionally not
 * rendered in this layout.
 */
export function PageHeader({
  title,
  query,
  onQueryChange,
  searchRef,
  incognito = false,
}: {
  title: string;
  query: string;
  onQueryChange: (value: string) => void;
  searchRef?: RefObject<HTMLInputElement | null>;
  incognito?: boolean;
}) {
  return (
    <header className="page-header">
      <div className="page-header__brand">
        <img
          className="page-header__logo"
          src="/logo/favicon.svg"
          alt=""
          width={56}
          height={56}
        />
        <h1 className="page-header__title">{title}</h1>
        {incognito ? <span className="page-header__badge">Okno prywatne</span> : null}
      </div>
      <div className="page-header__search">
        <SearchBox value={query} onChange={onQueryChange} inputRef={searchRef}/>
      </div>
    </header>
  );
}
