/**
 * Thin browser compatibility wrapper over extension storage
 * (browser.storage.local for Firefox, chrome.storage.local for Chromium).
 *
 * React components must never call extension storage directly; they consume
 * this adapter (or higher-level loaders built on it) instead.
 */
export interface ExtensionStorageArea {
    get(keys?: string | string[] | null): Promise<Record<string, unknown>>;

    set(items: Record<string, unknown>): Promise<void>;

    remove(keys: string | string[]): Promise<void>;
}

export interface ExtensionGlobal {
    storage: {
        local: ExtensionStorageArea;
    };
}

/**
 * One explicit key/value boundary shared by config and preferences. Both
 * runtimes implement it, so callers never branch on the environment.
 */
export interface JsonStorage {
    read(key: string): Promise<unknown>;

    write(key: string, value: unknown): Promise<void>;

    remove(key: string): Promise<void>;
}

/**
 * Returns the extension global (`browser` first, `chrome` second), or null
 * when no usable extension storage exists. Never throws.
 *
 * Presence of a `chrome` global alone is not sufficient: regular Chrome/Brave
 * pages expose `chrome` (with no `storage.local`), so the shape is verified.
 */
export function getExtensionGlobal(): ExtensionGlobal | null {
    const scope = globalThis as unknown as { browser?: unknown; chrome?: unknown };
    for (const candidate of [scope.browser, scope.chrome]) {
        const area = (candidate as ExtensionGlobal | undefined)?.storage?.local;
        if (area && typeof area.get === 'function' && typeof area.set === 'function' && typeof area.remove === 'function') {
            return candidate as ExtensionGlobal;
        }
    }
    return null;
}

/**
 * Extension-storage-backed JSON object adapter. Used for application config
 * and preferences in the addon deployment form.
 */
export class ExtensionStorage implements JsonStorage {
    constructor(private readonly area: ExtensionStorageArea) {
    }

    async read(key: string): Promise<unknown> {
        const result = await this.area.get(key);
        return result[key];
    }

    async write(key: string, value: unknown): Promise<void> {
        await this.area.set({[key]: value});
    }

    async remove(key: string): Promise<void> {
        await this.area.remove(key);
    }
}

/**
 * localStorage-backed JSON object adapter. Used for web preferences only;
 * application config on the web always comes from /config.json so that
 * private/incognito windows receive the same server config.
 *
 * Reads are fail-soft (unavailable/corrupt storage is treated as "absent"),
 * but writes and removals report failure instead of faking success, so the
 * UI never claims a preference was saved when it was not.
 */
export class LocalStorage implements JsonStorage {
    async read(key: string): Promise<unknown> {
        let raw: string | null;
        try {
            raw = window.localStorage.getItem(key);
        } catch {
            return undefined;
        }

        if (raw === null) return undefined;

        try {
            return JSON.parse(raw) as unknown;
        } catch {
            // Corrupt entry: treat as missing, don't break the app on bad JSON.
            return undefined;
        }
    }

    async write(key: string, value: unknown): Promise<void> {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            throw new Error('localStorage jest niedostępny (zablokowany).');
        }
    }

    async remove(key: string): Promise<void> {
        try {
            window.localStorage.removeItem(key);
        } catch {
            throw new Error('localStorage jest niedostępny (zablokowany).');
        }
    }
}