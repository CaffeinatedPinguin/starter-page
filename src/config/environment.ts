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
