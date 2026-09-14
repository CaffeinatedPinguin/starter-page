import type {JsonStorage} from '@/config/storageAdapters';

/** Overrides window.location.protocol for runtime-detection tests. */
export function stubLocationProtocol(protocol: string): void {
    Object.defineProperty(window, 'location', {
        value: {protocol, href: `${protocol}//x.test/`},
        writable: true,
        configurable: true,
    });
}

export interface MemoryStorage extends JsonStorage {
    data: Record<string, unknown>;
}

/** In-memory JsonStorage for use-case tests. */
export function memoryStorage(initial: Record<string, unknown> = {}): MemoryStorage {
    const data = {...initial};
    return {
        data,
        read: async (key) => data[key],
        write: async (key, value) => {
            data[key] = value;
        },
        remove: async (key) => {
            delete data[key];
        },
    };
}

/** JsonStorage whose every operation rejects, for failure-path tests. */
export function failingStorage(): JsonStorage {
    return {
        read: async () => {
            throw new Error('blocked');
        },
        write: async () => {
            throw new Error('blocked');
        },
        remove: async () => {
            throw new Error('blocked');
        },
    };
}
