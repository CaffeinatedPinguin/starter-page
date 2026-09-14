import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {act} from 'react';
import {bootstrap} from './bootstrap';
import type {BootstrapDependencies} from './bootstrap';
import {PAGE_LOADERS} from './pageRegistry';
import type {PageLoader} from './pageRegistry';
import {loadStarterPageRuntime} from '@/config/configLoader';
import {SAFE_FALLBACK_PAGE} from '@/models/starter-page';
import type {PageId, StarterPageConfig} from '@/models/starter-page';
import {stubLocationProtocol} from '@/test/testUtils';

const config: StarterPageConfig = {
    title: 'Test',
    heading: 'Test heading',
    subtitle: 'Test subtitle',
    defaultPage: 'categorized',
    links: [{id: 1, name: 'X', url: '/x'}],
};

/** Real web runtime, with fetch + an in-memory localStorage shim. */
function stubWebRuntime(preferences: unknown): void {
    stubLocationProtocol('https:');

    const backing = new Map<string, string>();
    const shim = {
        get length() {
            return backing.size;
        },
        clear: (): void => backing.clear(),
        getItem: (key: string): string | null => backing.get(key) ?? null,
        key: (index: number): string | null => [...backing.keys()][index] ?? null,
        removeItem: (key: string): void => {
            backing.delete(key);
        },
        setItem: (key: string, value: string): void => {
            backing.set(key, String(value));
        },
    } as unknown as Storage;
    Object.defineProperty(window, 'localStorage', {value: shim, writable: true, configurable: true});

    if (preferences !== undefined) {
        shim.setItem('starter-page-preferences', JSON.stringify(preferences));
    }
    globalThis.fetch = (async () => ({
        ok: true,
        json: async () => config,
    })) as unknown as typeof fetch;
}

const realDeps: BootstrapDependencies = {
    loadRuntime: loadStarterPageRuntime,
    pageLoaders: PAGE_LOADERS,
};

function renderedPage(): string | null {
    return document.querySelector('#root main[data-page]')?.getAttribute('data-page') ?? null;
}

describe('bootstrap page resolution', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'root';
        document.body.appendChild(container);
    });

    afterEach(async () => {
        container.remove();
        delete (globalThis as { fetch?: unknown }).fetch;
    });

    it('renders the "categorized" page when entryPage preference selects it', async () => {
        stubWebRuntime({entryPage: 'categorized'});
        await act(async () => {
            await bootstrap(realDeps);
        });
        // The resolved page must actually be rendered (data-page attribute).
        expect(renderedPage()).toBe('categorized');
        expect(document.title).toBe(config.title);
        // The bootstrap must never mutate the URL.
        expect(window.location.protocol).toBe('https:');
        expect(window.location.href).toBe('https://x.test/');
    });

    it('falls back to the config defaultPage when no preference exists', async () => {
        stubWebRuntime(undefined);
        await act(async () => {
            await bootstrap(realDeps);
        });
        expect(renderedPage()).toBe('categorized');
    });

    it('uses the safe fallback when neither preference nor defaultPage exists', async () => {
        stubWebRuntime(undefined);
        globalThis.fetch = (async () => ({
            ok: true,
            json: async () => ({...config, defaultPage: undefined}),
        })) as unknown as typeof fetch;
        await act(async () => {
            await bootstrap(realDeps);
        });
        expect(renderedPage()).toBe(SAFE_FALLBACK_PAGE);
    });

    it('exposes exactly the registered page loaders (one lazy chunk per page)', () => {
        expect(Object.keys(PAGE_LOADERS).sort()).toEqual(['categorized']);
    });

    it('loads only the selected page loader', async () => {
        stubWebRuntime({entryPage: 'categorized'});
        const calls: PageId[] = [];
        const spiedLoaders = Object.fromEntries(
            (Object.keys(PAGE_LOADERS) as PageId[]).map((id) => [
                id,
                () => {
                    calls.push(id);
                    return PAGE_LOADERS[id]();
                },
            ]),
        ) as Record<PageId, PageLoader>;

        await act(async () => {
            await bootstrap({loadRuntime: loadStarterPageRuntime, pageLoaders: spiedLoaders});
        });

        expect(calls).toEqual(['categorized']);
        expect(renderedPage()).toBe('categorized');
    });

    it('renders exactly one page root per bootstrap run', async () => {
        stubWebRuntime(undefined);
        await act(async () => {
            await bootstrap(realDeps);
        });
        const pages = document.querySelectorAll('#root main[data-page]');
        expect(pages).toHaveLength(1);
    });
});

/**
 * Full addon flow: chrome-extension: runtime, config + preferences read from
 * extension storage, then the selected page actually rendered. This is the
 * end-to-end path the addon uses after importing config.json on options.
 */
describe('bootstrap addon flow', () => {
    const extensionStorage: Record<string, unknown> = {};

    function stubAddonRuntime(): void {
        Object.defineProperty(window, 'location', {
            value: {protocol: 'chrome-extension:', href: 'chrome-extension://abc/index.html'},
            writable: true,
            configurable: true,
        });
        (globalThis as unknown as { chrome: unknown }).chrome = {
            storage: {
                local: {
                    get: async (key: string) => (key in extensionStorage ? {[key]: extensionStorage[key]} : {}),
                    set: async (items: Record<string, unknown>) => {
                        Object.assign(extensionStorage, items);
                    },
                    remove: async (key: string) => {
                        delete extensionStorage[key];
                    },
                },
            },
        };
    }

    beforeEach(() => {
        for (const key of Object.keys(extensionStorage)) delete extensionStorage[key];
        const container = document.createElement('div');
        container.id = 'root';
        document.body.appendChild(container);
        stubAddonRuntime();
    });

    afterEach(() => {
        document.getElementById('root')?.remove();
        delete (globalThis as { browser?: unknown }).browser;
        delete (globalThis as { chrome?: unknown }).chrome;
    });

    it('loads the imported config from extension storage and renders the selected page', async () => {
        // Simulates the options page having imported config.json.
        extensionStorage['starter-page-config'] = config;
        extensionStorage['starter-page-preferences'] = {entryPage: 'categorized'};

        await act(async () => {
            await bootstrap(realDeps);
        });

        expect(renderedPage()).toBe('categorized');
        expect(document.title).toBe(config.title);
        // The addon must never mutate its URL (no hash, no redirect).
        expect(window.location.href).toBe('chrome-extension://abc/index.html');
    });

    it('shows the setup notice when no config is stored', async () => {
        await act(async () => {
            await bootstrap(realDeps);
        });

        expect(renderedPage()).toBeNull();
        expect(document.getElementById('root')?.textContent).toContain('Brak konfiguracji');
    });
});
