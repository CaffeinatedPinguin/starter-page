export type RuntimeEnvironment = 'web' | 'addon';

const ADDON_PROTOCOLS = ['chrome-extension:', 'moz-extension:', 'safari-web-extension:'];

/**
 * Detects the runtime environment from the page protocol alone.
 *
 * - `chrome-extension:` / `moz-extension:` / `safari-web-extension:` URLs
 *   mean the app runs as a browser addon (New Tab / options page).
 * - Anything else (http:, https:, file: during local preview) is `web`.
 *
 * The detection is synchronous and never touches location, hash or history.
 */
export function getRuntimeEnvironment(): RuntimeEnvironment {
    return ADDON_PROTOCOLS.includes(window.location.protocol) ? 'addon' : 'web';
}

export function isAddonEnvironment(): boolean {
    return getRuntimeEnvironment() === 'addon';
}

interface ExtensionIncognitoApi {
    inIncognitoContext?: boolean;
}

interface IncognitoGlobal {
    extension?: ExtensionIncognitoApi;
}

/**
 * Whether the current add-on page runs in an incognito / private context.
 *
 * Reads `extension.inIncognitoContext`, which is available in add-on pages
 * without any extra permission. Returns false on the web and whenever the API
 * is unavailable, so it is always safe to call.
 *
 * Browser notes:
 * - Firefox reports the real value for private windows (the user must allow the
 *   add-on to run in private windows).
 * - Chromium reports `true` for an extension page only when manifest.json uses
 *   `"incognito": "split"`. With the default `"spanning"`, Chrome never loads an
 *   extension page into an incognito tab, so the value stays `false`.
 */
export function isIncognitoContext(): boolean {
    const scope = globalThis as unknown as { browser?: IncognitoGlobal; chrome?: IncognitoGlobal };

    for (const candidate of [scope.browser, scope.chrome]) {
        const value = candidate?.extension?.inIncognitoContext;
        if (typeof value === 'boolean') return value;
    }

    return false;
}
