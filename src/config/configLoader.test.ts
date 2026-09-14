import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {resolveEntryPage, loadStarterPageRuntime} from './configLoader';
import type {LoadedRuntime} from './configLoader';
import {parsePreferences} from './staticConfig';
import {SAFE_FALLBACK_PAGE} from '@/models/starter-page';
import type {StarterPageConfig} from '@/models/starter-page';
import {stubLocationProtocol} from '@/test/testUtils';

const config = {
    title: 'Example',
    heading: 'Welcome',
    subtitle: 'Pick',
    defaultPage: 'categorized',
    links: [{id: 1, name: 'X', url: '/x'}],
} satisfies StarterPageConfig;

describe('resolveEntryPage', () => {
    it('prefers the local entryPage preference over the config default', () => {
        expect(resolveEntryPage({entryPage: 'categorized'}, config)).toBe('categorized');
    });

    it('falls back to config defaultPage', () => {
        expect(resolveEntryPage({}, config)).toBe('categorized');
    });

    it('uses the safe built-in fallback when defaultPage is absent', () => {
        const withoutDefault: StarterPageConfig = {...config};
        delete withoutDefault.defaultPage;
        expect(resolveEntryPage({}, withoutDefault)).toBe(SAFE_FALLBACK_PAGE);
    });

    it('falls back to config defaultPage when stored preferences are corrupt', () => {
        // Simulates the real flow: corrupt storage -> parsePreferences drops the
        // invalid field -> resolveEntryPage sees no entryPage preference.
        const corrupt = parsePreferences({entryPage: 'nope'});
        expect(corrupt).toEqual({});
        expect(resolveEntryPage(corrupt, config)).toBe('categorized');
    });
});

describe('config loader', () => {
    beforeEach(() => {
        stubLocationProtocol('https:');
        try {
            window.localStorage?.clear();
        } catch {
            // localStorage unavailable in this environment — preferences tests only.
        }
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete (globalThis as unknown as { browser?: unknown }).browser;
        delete (globalThis as unknown as { chrome?: unknown }).chrome;
    });

    it('loads web config from /config.json and preferences from localStorage', async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => config,
        }) as unknown as Response);
        vi.stubGlobal('fetch', fetchMock);

        const runtime = await loadStarterPageRuntime();
        expect(runtime.status).toBe('ready');
        if (runtime.status !== 'ready') return;
        expect(runtime.config).toEqual(config);
        expect(runtime.preferences).toEqual({});
        expect(runtime.entryPage).toBe('categorized');
        // Root-relative: must not resolve against the current page path.
        expect(fetchMock).toHaveBeenCalledWith('/config.json', {cache: 'no-store'});
        vi.unstubAllGlobals();
    });

    it('reports a server error for a failed /config.json fetch', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ok: false, status: 404}) as unknown as Response));

        await expect(loadStarterPageRuntime()).rejects.toThrow(/404/);
        vi.unstubAllGlobals();
    });

    it('reports a network error for an unreachable server', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new TypeError('network down');
        }));

        await expect(loadStarterPageRuntime()).rejects.toThrow(/config\.json/);
        vi.unstubAllGlobals();
    });

    it('validates the fetched config with the common parser', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({title: 42}),
        }) as unknown as Response));

        await expect(loadStarterPageRuntime()).rejects.toThrow(/title/);
        vi.unstubAllGlobals();
    });

    it('reads addon config and preferences from extension storage', async () => {
        stubLocationProtocol('chrome-extension:');
        const stored: Record<string, unknown> = {
            'starter-page-config': config,
            'starter-page-preferences': {entryPage: 'categorized'},
        };
        (globalThis as unknown as { browser: unknown }).browser = {
            storage: {
                local: {
                    get: async (key: string) => (key in stored ? {[key]: stored[key]} : {}),
                    set: async () => undefined,
                    remove: async (key: string) => {
                        delete stored[key];
                    },
                },
            },
        };

        const runtime: LoadedRuntime = await loadStarterPageRuntime();
        expect(runtime.status).toBe('ready');
        if (runtime.status !== 'ready') return;
        expect(runtime.config).toEqual(config);
        expect(runtime.preferences).toEqual({entryPage: 'categorized'});
        expect(runtime.entryPage).toBe('categorized');
    });

    it('returns unconfigured status when the addon has no stored configuration', async () => {
        stubLocationProtocol('moz-extension:');
        (globalThis as unknown as { browser: unknown }).browser = {
            storage: {
                local: {
                    get: async () => ({}),
                    set: async () => undefined,
                    remove: async () => undefined,
                },
            },
        };

        const runtime = await loadStarterPageRuntime();
        expect(runtime.status).toBe('unconfigured');
        expect(runtime.preferences).toEqual({});
    });

    it('fails when the addon environment has no storage API', async () => {
        stubLocationProtocol('chrome-extension:');

        await expect(loadStarterPageRuntime()).rejects.toThrow(/extension storage/);
    });

    it('ignores corrupt localStorage preferences', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => config,
        }) as unknown as Response));
        try {
            window.localStorage.setItem('starter-page-preferences', '{broken json');
        } catch {
            // Unavailable storage — nothing to corrupt, preferences stay empty.
        }

        const runtime = await loadStarterPageRuntime();
        expect(runtime.preferences).toEqual({});
        vi.unstubAllGlobals();
    });
});
