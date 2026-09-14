import {useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type {PageId, StarterPageConfig} from '@/models/starter-page';
import {isIncognitoContext} from '@/config/environment';
import {PageHeader} from './PageHeader';

/** Formats a date as dd/mm/yyyy (zero-padded, locale-independent). */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * Shared frame for every Starter Page: brand + search header, the page body
 * and a small footer with the date, plus one Tooltip.Provider for the whole
 * page (never per link). The search query is in-memory UI state; all links and
 * categories always stay rendered.
 *
 * Ctrl/Cmd+F focuses the search field within the page. It never autofocuses on
 * load, so the New Tab omnibox keeps its native focus behavior.
 */
export function PageFrame({
  page,
  config,
  children,
}: {
  page: PageId;
  config: StarterPageConfig;
  children: (query: string) => ReactNode;
}) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Tooltip.Provider delayDuration={200}>
      <main data-page={page}>
        <PageHeader
          title={config.title}
          query={query}
          onQueryChange={setQuery}
          searchRef={searchRef}
          incognito={isIncognitoContext()}
        />
        <div className="page-body">{children(query)}</div>
        <footer className="page-footer">{formatDate(new Date())}</footer>
      </main>
    </Tooltip.Provider>
  );
}
