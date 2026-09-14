import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import {fileURLToPath, URL} from 'node:url';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            // Vitest's module mocker cannot handle @iconify/unplugin's virtual
            // ids on Windows (see src/test/iconifyStub.tsx). Unit tests only
            // need an SVG-shaped component; the production build renders the
            // real inline icons.
            {
                find: /^virtual:iconify\/.*$/,
                replacement: fileURLToPath(new URL('./src/test/iconifyStub.tsx', import.meta.url)),
            },
            {
                find: '@',
                replacement: fileURLToPath(new URL('./src', import.meta.url)),
            },
        ],
    },
    test: {
        environment: 'jsdom',
        globals: true,
        // Only the app source is tested; build/ may contain staged copies
        // (AMO source archive) of the same files.
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
});
