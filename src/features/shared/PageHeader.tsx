import type {RefObject} from 'react';
import {Clock} from './Clock';
import {SearchBox} from './SearchBox';

/**
 * Page header: the bilingual date + clock, then the centered search field and
 * an "Okno prywatne" badge pinned to the top-right corner when the add-on page
 * runs in a private/incognito context. The brand name stays in the document as
 * a visually hidden <h1>, so the layout shows no logo/title.
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
      <h1 className="visually-hidden">{title}</h1>
      <Clock/>
      <div className="page-header__search">
        <SearchBox value={query} onChange={onQueryChange} inputRef={searchRef}/>
      </div>
      {incognito ? <span className="page-header__badge">Okno prywatne</span> : null}
    </header>
  );
}
