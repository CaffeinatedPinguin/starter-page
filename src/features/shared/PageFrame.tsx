import {useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import type {PageId, StarterPageConfig} from '@/models/starter-page';
import {isIncognitoContext} from '@/config/environment';
import {PageHeader} from './PageHeader';
import {PageFooter} from './PageFooter';
import {openGoogleSearch} from './searchNavigation';

function isEditable(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}

/**
 * Shared frame for every Starter Page: date + clock header with the search
 * field (filter local links, Enter hands the query to Google), the page body
 * and a quiet footer signature. The search query is in-memory UI state; all
 * links and categories always stay rendered.
 *
 * `/` and Ctrl/Cmd+F focus the search field within the page. It never
 * autofocuses on load, so the New Tab omnibox keeps its native focus behavior.
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
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (event.key === '/' && !modifier && !event.altKey && !isEditable(event.target)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <main data-page={page}>
      <PageHeader
        title={config.title}
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={openGoogleSearch}
        searchRef={searchRef}
        incognito={isIncognitoContext()}
      />
      <div className="page-body">{children(query)}</div>
      <PageFooter/>
    </main>
  );
}
