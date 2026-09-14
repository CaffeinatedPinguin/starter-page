import type {RefObject} from 'react';
import {SearchBox} from './SearchBox';

/**
 * Page header: compact brand (logo + title) on the left, a lightweight search
 * field in the middle. On mobile it reflows to brand row + full-width search.
 * The visible brand name is the page's semantic <h1>; heading/subtitle from
 * the config are intentionally not rendered in this layout.
 */
export function PageHeader({
  title,
  query,
  onQueryChange,
  searchRef,
}: {
  title: string;
  query: string;
  onQueryChange: (value: string) => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <header className="page-header">
      <div className="page-header__brand">
        <img
          className="page-header__logo"
          src="/logo/favicon.svg"
          alt=""
          width={36}
          height={36}
        />
        <h1 className="page-header__title">{title}</h1>
      </div>
      <div className="page-header__search">
        <SearchBox value={query} onChange={onQueryChange} inputRef={searchRef}/>
      </div>
    </header>
  );
}
