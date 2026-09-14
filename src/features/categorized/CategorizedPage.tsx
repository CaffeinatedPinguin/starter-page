import type {PageProps} from '@/app/pageTypes';
import {CategoryHeader} from '@/features/shared/CategoryHeader';
import {LinkList} from '@/features/shared/linkList';
import {UNCATEGORIZED_KEY, UNCATEGORIZED_LABEL, groupByCategory} from '@/features/shared/grouping';
import {PageFrame} from '@/features/shared/PageFrame';

/**
 * Categorized Starter Page. Categories flow column-first via CSS multi-column
 * (`column-count` + `break-inside: avoid`): 4 columns on wide screens,
 * narrowing responsively. Nothing is regrouped or reordered by the search
 * query — groups stay in place and matching links highlight.
 */
export default function CategorizedPage({config}: PageProps) {
  return (
    <PageFrame page="categorized" config={config}>
      {(query) => (
        <div className="category-grid">
          {[...groupByCategory(config.links).entries()].map(([key, links]) => {
            const label = key === UNCATEGORIZED_KEY ? UNCATEGORIZED_LABEL : key;
            const presentation = config.categories?.[label];
            return (
              <section className="category" key={key === UNCATEGORIZED_KEY ? 'group:uncategorized' : `category:${key}`}>
                <CategoryHeader label={label} icon={presentation?.icon} accent={presentation?.color}/>
                <LinkList links={links} query={query}/>
              </section>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}
