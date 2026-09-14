import {isAddonEnvironment} from './environment';
import {ExtensionStorage, LocalStorage, getExtensionGlobal} from './storageAdapters';
import type {JsonStorage} from './storageAdapters';

/** Extension storage or an explicit failure when the addon API is missing. */
function addonStorageOrThrow(): JsonStorage {
    const extension = getExtensionGlobal();
    if (!extension) {
        throw new Error('Brak dostępu do extension storage.');
    }
    return new ExtensionStorage(extension.storage.local);
}

/**
 * The runtime storage boundary used for user preferences:
 *
 * - addon (`chrome-extension:` / `moz-extension:`): extension storage,
 * - web: localStorage (preferences only; config is /config.json).
 *
 * Selection is driven by the detected runtime, never by the mere presence of
 * a `chrome` global, which regular Chrome/Brave pages also expose.
 */
export function getRuntimeStorage(): JsonStorage {
    return isAddonEnvironment() ? addonStorageOrThrow() : new LocalStorage();
}

/**
 * Addon-only application-config storage. Web configuration comes exclusively
 * from /config.json and is never stored, so this throws on the web.
 */
export function getAddonStorage(): JsonStorage {
    if (!isAddonEnvironment()) {
        throw new Error('Konfiguracja jest dostępna tylko w dodatku przeglądarki.');
    }
    return addonStorageOrThrow();
}
