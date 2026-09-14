import type {StarterPageConfig} from '@/models/starter-page';

/**
 * Props passed to every Starter Page root. Each page renders the shared link
 * data with its own layout, but never owns configuration of its own.
 */
export interface PageProps {
    config: StarterPageConfig;
}

export interface PageModule {
    default: (props: PageProps) => ReactElementLike;
}

type ReactElementLike = ReturnType<typeof import('react').createElement>;
