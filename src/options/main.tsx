import {isAddonEnvironment} from '@/config/environment';
import {autoStart} from '@/app/autoStart';
import '@/styles/tokens.css';
import '@/styles/options.css';
import {
    applySelectValue,
    getButton,
    getInput,
    getSection,
    getSelect,
    renderMessage,
    show,
} from './dom';
import {exportConfig, importConfig} from './configTransfer';
import {readPreferences, resetPreferences, savePreferences, showCurrentPreferences} from './preferences';
import type {ActionResult} from './result';

/** Runs an action and renders its message; returns the result for follow-ups. */
async function run<T>(action: Promise<ActionResult<T>>): Promise<ActionResult<T>> {
    const result = await action;
    renderMessage(result.message);
    return result;
}

function downloadConfig(raw: unknown): void {
    const blob = new Blob([JSON.stringify(raw, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'config.json';
    link.click();
    URL.revokeObjectURL(url);
}

function wireConfigTransfer(): void {
    // Config import/export applies only to the addon: on the web the app data
    // comes from /config.json and is never stored client-side.
    if (!isAddonEnvironment()) {
        show(getSection('web-config-note'));
        return;
    }
    show(getSection('config-section'));

    const fileInput = getInput('config-file');
    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) {
            void run(importConfig(file));
        }
    });

    getButton('config-export').addEventListener('click', () => {
        void run(exportConfig(downloadConfig));
    });
}

async function wirePreferences(): Promise<void> {
    const entryPageSelect = getSelect('pref-entry-page');

    // Prefill so the form always shows the current state before saving.
    const prefsResult = await readPreferences();
    if (prefsResult.ok) {
        applySelectValue(entryPageSelect, prefsResult.value.entryPage);
    } else {
        // Surface the storage problem now, instead of hiding it until save/reset.
        renderMessage(prefsResult.message);
    }

    getButton('pref-save').addEventListener('click', () => {
        void run(savePreferences(entryPageSelect.value));
    });

    getButton('pref-show').addEventListener('click', async () => {
        const result = await run(showCurrentPreferences());
        if (!result.ok) return;
        applySelectValue(entryPageSelect, result.value.entryPage);
    });

    getButton('pref-reset').addEventListener('click', async () => {
        const result = await run(resetPreferences());
        if (result.ok) {
            applySelectValue(entryPageSelect, undefined);
        }
    });
}

export async function main(): Promise<void> {
    if (!document.getElementById('options-root')) return;

    wireConfigTransfer();
    await wirePreferences();
}

autoStart(main, (error) => {
    renderMessage(
        `Nie udało się zainicjować ustawień: ${error instanceof Error ? error.message : 'nieznany błąd'}.`,
    );
});
