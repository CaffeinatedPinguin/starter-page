import type {
    PageId,
    StarterPageConfig,
    StarterPagePreferences,
} from '@/models/starter-page';
import {SAFE_FALLBACK_PAGE} from '@/models/starter-page';
import {isAddonEnvironment} from './environment';
import {ADDON_CONFIG_KEY, PREFERENCES_KEY} from './storageKeys';
import {getRuntimeStorage} from './storage';
import {parseConfig, parsePreferences, StarterPageConfigError} from './staticConfig';

/**
 * What the bootstrap needs before rendering a Starter Page.
 *
 * Discriminated union: `status: 'ready'` carries the loaded application data;
 * `status: 'unconfigured'` signals an addon without stored configuration
 * (bootstrap shows the setup flow). No fake/default data is invented.
 */
export type LoadedRuntime =
    | {
    status: 'ready';
    config: StarterPageConfig;
    preferences: StarterPagePreferences;
    /**
     * The Starter Page that should be rendered first, already resolved:
     * local entryPage preference -> config defaultPage -> safe fallback.
     */
    entryPage: PageId;
}
    | {
    status: 'unconfigured';
    preferences: StarterPagePreferences;
};

/**
 * Resolves the initial Starter Page from preferences and config defaults.
 * Never mutates the URL; the result is purely in-memory.
 */
export function resolveEntryPage(
    preferences: StarterPagePreferences,
    config: StarterPageConfig,
): PageId {
    if (preferences.entryPage !== undefined) {
        return preferences.entryPage;
    }
    if (config.defaultPage !== undefined) {
        return config.defaultPage;
    }
    return SAFE_FALLBACK_PAGE;
}

/**
 * Builds the ready runtime from already parsed config and preferences,
 * resolving the initial page in one place.
 */
function buildReady(
    config: StarterPageConfig,
    preferences: StarterPagePreferences,
): LoadedRuntime {
    return {status: 'ready', config, preferences, entryPage: resolveEntryPage(preferences, config)};
}

/**
 * Web: loads application data from /config.json (server config, NOT baked
 * into the build, same for private/incognito windows) and preferences from
 * localStorage.
 */
async function loadWebRuntime(): Promise<LoadedRuntime> {
    let rawConfig: unknown;

    try {
        // Root-relative path: the app may be opened at any URL; a relative
        // fetch would resolve against the current page path.
        const response = await fetch('/config.json', {cache: 'no-store'});
        if (!response.ok) {
            throw new StarterPageConfigError(
                `Serwer zwrócił status ${response.status} dla /config.json.`,
            );
        }
        rawConfig = await response.json();
    } catch (error) {
        if (error instanceof StarterPageConfigError) throw error;
        throw new StarterPageConfigError('Nie udało się pobrać /config.json.');
    }

    const config = parseConfig(rawConfig);
    const preferences = parsePreferences(await getRuntimeStorage().read(PREFERENCES_KEY));

    return buildReady(config, preferences);
}

/**
 * Addon: loads application data and preferences from extension storage.
 * Missing config is not an error — the bootstrap shows the setup flow and the
 * user imports config.json on the options page.
 */
async function loadAddonRuntime(): Promise<LoadedRuntime> {
    const storage = getRuntimeStorage();
    const [rawConfig, rawPreferences] = await Promise.all([
        storage.read(ADDON_CONFIG_KEY),
        storage.read(PREFERENCES_KEY),
    ]);

    const preferences = parsePreferences(rawPreferences);

    if (rawConfig === undefined || rawConfig === null) {
        // Signal "no configuration" so the bootstrap can show the setup flow.
        return {status: 'unconfigured', preferences};
    }

    return buildReady(parseConfig(rawConfig), preferences);
}

/**
 * Detects the runtime, loads configuration and preferences from the matching
 * storage, and resolves the initial Starter Page.
 *
 * - web:   /config.json + localStorage preferences (always 'ready' or throws)
 * - addon: extension storage (config + preferences); missing config yields
 *          `status: 'unconfigured'` and the caller must show the setup flow
 */
export async function loadStarterPageRuntime(): Promise<LoadedRuntime> {
    return isAddonEnvironment() ? loadAddonRuntime() : loadWebRuntime();
}