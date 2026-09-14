import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import '@/styles/tokens.css';
import '@/styles/app.css';
import type {PageId, StarterPageConfig} from '@/models/starter-page';
import {loadStarterPageRuntime} from '@/config/configLoader';
import type {LoadedRuntime} from '@/config/configLoader';
import {PAGE_LOADERS} from './pageRegistry';
import type {PageLoader} from './pageRegistry';
import type {PageProps} from './pageTypes';
import {autoStart} from './autoStart';

function renderText(message: string): void {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.textContent = `starter-page: ${message}`;
    }
}

/**
 * Minimal setup flow for the addon when no configuration is stored yet.
 * Intentionally primitive: a plain link to the options page where the user
 * imports config.json. No fake/default links are invented.
 */
function renderSetupNotice(): void {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    const container = document.createElement('div');
    container.className = 'setup-notice';

    const message = document.createElement('p');
    message.textContent = 'Brak konfiguracji. Zaimportuj plik config.json na stronie ustawień dodatku.';

    const link = document.createElement('a');
    link.href = 'options.html';
    link.textContent = 'Otwórz ustawienia (import config.json)';

    container.replaceChildren(message, link);
    rootElement.replaceChildren(container);
}

/** Dependencies of the bootstrap, overridable by tests. */
export interface BootstrapDependencies {
    loadRuntime: () => Promise<LoadedRuntime>;
    pageLoaders: Record<PageId, PageLoader>;
}

const DEFAULT_DEPENDENCIES: BootstrapDependencies = {
    loadRuntime: loadStarterPageRuntime,
    pageLoaders: PAGE_LOADERS,
};

export async function bootstrap(
    dependencies: BootstrapDependencies = DEFAULT_DEPENDENCIES,
): Promise<void> {
    document.title = 'starter-page';

    let runtime: LoadedRuntime;
    try {
        runtime = await dependencies.loadRuntime();
    } catch (error) {
        renderText(error instanceof Error ? error.message : 'Nieznany błąd konfiguracji.');
        return;
    }

    if (runtime.status === 'unconfigured') {
        // Addon with no stored configuration: minimal setup flow, no fake data.
        renderSetupNotice();
        return;
    }

    const config: StarterPageConfig = runtime.config;
    document.title = config.title;

    let pageModule;
    try {
        pageModule = await dependencies.pageLoaders[runtime.entryPage]();
    } catch (error) {
        renderText(
            `Nie udało się załadować strony "${runtime.entryPage}": ${error instanceof Error ? error.message : 'nieznany błąd'}`,
        );
        return;
    }

    const rootElement = document.getElementById('root');
    if (!rootElement) {
        renderText('Brak elementu #root w dokumencie.');
        return;
    }

    const props: PageProps = {config};
    createRoot(rootElement).render(createElement(pageModule.default, props));
}

autoStart(bootstrap, (error) => {
    renderText(error instanceof Error ? error.message : 'Nieznany błąd konfiguracji.');
});
