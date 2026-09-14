import {afterEach, describe, expect, it} from 'vitest';
import {LocalStorage} from './storageAdapters';
import {getAddonStorage, getRuntimeStorage} from './storage';
import {stubLocationProtocol} from '@/test/testUtils';

function throwOnAccess(property: 'getItem' | 'setItem' | 'removeItem'): void {
    Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: {
            [property]: () => {
                throw new Error('blocked');
            },
        },
    });
}

describe('LocalStorage adapter', () => {
    afterEach(() => {
        // Remove the overridden property so later tests get jsdom's storage back.
        try {
            delete (window as unknown as { localStorage?: unknown }).localStorage;
        } catch {
            // ignore
        }
    });

    it('reports failure instead of faking success when writing is blocked', async () => {
        throwOnAccess('setItem');
        await expect(new LocalStorage().write('k', {a: 1})).rejects.toThrow(/niedost/);
    });

    it('reports failure instead of faking success when removal is blocked', async () => {
        throwOnAccess('removeItem');
        await expect(new LocalStorage().remove('k')).rejects.toThrow(/niedost/);
    });

    it('treats unreadable storage as absent (fail-soft reads)', async () => {
        throwOnAccess('getItem');
        await expect(new LocalStorage().read('k')).resolves.toBeUndefined();
    });
});

describe('runtime storage selection', () => {
    afterEach(() => {
        delete (globalThis as { browser?: unknown }).browser;
        delete (globalThis as { chrome?: unknown }).chrome;
    });

    it('uses localStorage on an http(s) page even when a chrome global exists', () => {
        stubLocationProtocol('https:');
        // Regular Chrome/Brave pages expose `chrome` without storage.local.
        (globalThis as unknown as { chrome: unknown }).chrome = {runtime: {}};

        expect(getRuntimeStorage()).toBeInstanceOf(LocalStorage);
    });

    it('uses extension storage in an addon environment', () => {
        stubLocationProtocol('chrome-extension:');
        (globalThis as unknown as { chrome: unknown }).chrome = {
            storage: {local: {get: async () => ({}), set: async () => undefined, remove: async () => undefined}},
        };

        const storage = getRuntimeStorage();
        expect(storage).not.toBeInstanceOf(LocalStorage);
    });

    it('throws when the addon environment has no storage API', () => {
        stubLocationProtocol('moz-extension:');

        expect(() => getRuntimeStorage()).toThrow(/extension storage/);
    });

    it('refuses addon config storage on the web', () => {
        stubLocationProtocol('https:');

        expect(() => getAddonStorage()).toThrow(/tylko w dodatku/);
    });
});
