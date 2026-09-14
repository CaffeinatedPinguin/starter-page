/**
 * Runs `start` automatically in the browser, but not under test where the
 * caller imports and drives it manually. Import.meta.env is defined by Vite
 * in every build; a bare `process` access would throw in browser builds.
 */
export function autoStart(start: () => Promise<void>, onError: (error: unknown) => void): void {
    if (import.meta.env.MODE !== 'test') {
        void start().catch(onError);
    }
}
