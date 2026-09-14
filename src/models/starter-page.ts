/**
 * One common configuration schema shared by all Starter Pages.
 *
 * `StarterPageConfig` is the application/link data. Every Starter Page renders
 * the same `links` collection differently; a link is defined once and must not
 * be duplicated just because multiple pages display it.
 *
 * `StarterPagePreferences` is user-specific UI state (chosen initial page).
 * It travels separately: web uses localStorage, the addon uses extension
 * storage, and both are independent from the link data.
 */

export type ConfigIdentifier = string | number;

/**
 * Stable identifier of a top-level Starter Page. Each page is a separate
 * feature root with its own layout — not a rendering mode of another page.
 *
 * The union grows as new, independently-designed pages are added; register the
 * new id in PAGE_IDS and PAGE_LOADERS together.
 */
export type PageId = 'categorized';

/** Safe built-in fallback when no preference and no config default exist. */
export const SAFE_FALLBACK_PAGE: PageId = 'categorized';

export const PAGE_IDS: readonly PageId[] = ['categorized'] as const;

export function isPageId(value: unknown): value is PageId {
    return typeof value === 'string' && (PAGE_IDS as readonly string[]).includes(value);
}

export const STARTER_PAGE_ICON_NAMES = [
    'activity',
    'audioteka',
    'bell',
    'bookmark',
    'box',
    'calendar',
    'chart-bar',
    'chart-histogram',
    'chart-line',
    'cloud',
    'cloudflare',
    'cpu',
    'database',
    'debian',
    'device-tv',
    'discord',
    'docker',
    'dropbox',
    'file-description',
    'flame',
    'folder',
    'gauge',
    'git',
    'github',
    'gitlab',
    'gmail',
    'google',
    'google-calendar',
    'google-drive',
    'google-maps',
    'google-photos',
    'grafana',
    'headphones',
    'home',
    'jaeger',
    'key',
    'kick',
    'layout-dashboard',
    'linkedin',
    'lock',
    'mail',
    'map-pin',
    'music',
    'nextcloud',
    'news',
    'notes',
    'notion',
    'openvpn',
    'printables',
    'proxmox',
    'reddit',
    'redhat',
    'route',
    'router',
    'server',
    'server-2',
    'settings',
    'shield',
    'shopping-cart',
    'slack',
    'soundcloud',
    'spotify',
    'steam',
    'telegram',
    'timeline',
    'tools',
    'truenas',
    'twitch',
    'ubuntu',
    'video',
    'vlc',
    'world',
    'youtube',
] as const;

export type StarterPageIconName = (typeof STARTER_PAGE_ICON_NAMES)[number];

export function isStarterPageIcon(value: string): value is StarterPageIconName {
    return STARTER_PAGE_ICON_NAMES.includes(value as StarterPageIconName);
}

/**
 * A single link in the shared data set. The same link is rendered by any
 * number of Starter Pages; it is declared exactly once in the config.
 */
export interface LinkEntry {
    /** Stable identifier, unique across the whole links collection. */
    id: ConfigIdentifier;
    name: string;
    /** Absolute http(s) URL or an app-relative path starting with "/". */
    url: string;
    /** Optional icon; when absent pages render a neutral placeholder. */
    icon?: StarterPageIconName;
    /** Optional tooltip. */
    tooltip?: string;
    /** Optional category/group. Absent means uncategorized. */
    category?: string;
    /**
     * Optional explicit ordering within a category. When absent, config order
     * is preserved.
     */
    order?: number;
}

/**
 * Optional, config-provided presentation overrides for a category. The app
 * never hardcodes category names; when absent, the accent is derived from the
 * name and the icon falls back to a neutral marker.
 */
export interface CategoryPresentation {
    /** Category icon from the shared icon set; optional. */
    icon?: StarterPageIconName;
    /** Category accent color (any CSS color); optional. */
    color?: string;
}

/**
 * The common configuration schema. Every Starter Page reads its data from
 * here; `defaultPage` is a data-level default (not a user preference). It is
 * optional: when absent, the safe built-in fallback applies.
 */
export interface StarterPageConfig {
    /** Document title / brand. */
    title: string;
    /** Page-level texts passed to the page. */
    heading: string;
    subtitle: string;
    /** Page opened when no local preference exists; optional. */
    defaultPage?: PageId;
    /** Optional per-category presentation (icon / accent color). */
    categories?: Record<string, CategoryPresentation>;
    /** Shared link data for all pages. */
    links: LinkEntry[];
}

/**
 * User preferences, resolved independently from application data:
 * 1. local entryPage preference (extension/local storage),
 * 2. config defaultPage,
 * 3. safe built-in fallback.
 */
export interface StarterPagePreferences {
    entryPage?: PageId;
}
