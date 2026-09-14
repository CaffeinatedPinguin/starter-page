import type {PageId} from '@/models/starter-page';
import type {PageModule} from './pageTypes';

export type PageLoader = () => Promise<PageModule>;

/**
 * Static map of Starter Page id -> dynamic import. This is the ONLY place that
 * references the page feature roots; the bootstrap loads exactly one page.
 * Because the imports are dynamic, Vite emits one chunk per page.
 *
 * New, independently-designed pages register here (and in PAGE_IDS) once their
 * stable id and design exist.
 */
export const PAGE_LOADERS: Record<PageId, PageLoader> = {
    categorized: () => import('@/features/categorized'),
};
