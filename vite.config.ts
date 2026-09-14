import type {Plugin} from 'vite';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import Icons from '@iconify/unplugin/vite';
import {readdir, rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath, URL} from 'node:url';

/**
 * Removes local runtime config overrides (config/runtime.local.js) from the
 * build output. They are a developer convenience for `pnpm dev` only and must
 * never leak into dist/ (the addon package would otherwise ship them).
 */
function excludePrivatePublicConfig(): Plugin {
    return {
        name: 'exclude-private-public-config',
        apply: 'build',
        async closeBundle() {
            const configDirectory = fileURLToPath(new URL('./dist/config/', import.meta.url));

            let entries;
            try {
                entries = await readdir(configDirectory, {withFileTypes: true});
            } catch {
                return;
            }

            await Promise.all(
                entries
                    .filter((entry) => entry.isFile() && /^.+\.local\.[^.]+$/.test(entry.name))
                    .map((entry) => rm(resolve(configDirectory, entry.name), {force: true})),
            );
        },
    };
}

/**
 * @iconify/unplugin caches generated components and their helper assets under
 * node_modules/.iconify-unplugin. If that cache is partially present (e.g. after
 * a package-manager prune), a cached component can reference a missing helper
 * and the build fails with "Asset not found in cache". Wiping the cache at the
 * start of every build/dev run forces a clean regeneration; it is cheap.
 */
function resetIconifyCache(): Plugin {
    const cacheDirectory = fileURLToPath(
        new URL('./node_modules/.iconify-unplugin', import.meta.url),
    );
    const clear = () => rm(cacheDirectory, {recursive: true, force: true});

    return {
        name: 'reset-iconify-cache',
        async buildStart() {
            await clear();
        },
        async configureServer() {
            await clear();
        },
    };
}

export default defineConfig({
    plugins: [
        resetIconifyCache(),
        excludePrivatePublicConfig(),
        react(),
        // Build-time inline SVG from locally installed collections. No runtime
        // fetch: mode 'svg' never emits the Safari fallback, allowAPI is off.
        Icons({
            compiler: 'react',
            mode: 'svg',
            allowAPI: false,
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 3000,
    },
    build: {
        rollupOptions: {
            input: {
                index: fileURLToPath(new URL('./index.html', import.meta.url)),
                options: fileURLToPath(new URL('./options.html', import.meta.url)),
            },
            output: {
                // Stable, human-readable chunk names: one entry chunk per Starter Page.
                chunkFileNames: 'assets/[name]-[hash].js',
            },
        },
    },
});