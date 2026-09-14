import {ADDON_CONFIG_KEY} from '@/config/storageKeys';
import {getAddonStorage} from '@/config/storage';
import {parseConfig, StarterPageConfigError} from '@/config/staticConfig';
import type {JsonStorage} from '@/config/storageAdapters';
import {describeError, fail, ok} from './result';
import type {ActionResult} from './result';

/**
 * Addon-only config.json transfer. Storage defaults to getAddonStorage(), so
 * these operations never touch localStorage on the web; an explicit storage
 * can be injected by tests.
 */

/** Validates and stores an imported config.json. */
export async function importConfig(
    file: File,
    storage?: JsonStorage,
): Promise<ActionResult> {
    let parsed: unknown;

    try {
        parsed = JSON.parse(await file.text());
    } catch {
        return fail('Niepoprawny plik JSON.');
    }

    // Validate with the common parser shared with the app bootstrap. Invalid
    // data is never written to storage.
    let validated: unknown;
    try {
        validated = parseConfig(parsed);
    } catch (error) {
        return fail(
            error instanceof StarterPageConfigError
                ? `Odrzucono konfigurację: ${error.message}`
                : 'Niepoprawna konfiguracja.',
        );
    }

    try {
        await (storage ?? getAddonStorage()).write(ADDON_CONFIG_KEY, validated);
    } catch (error) {
        return fail(`Nie udało się zapisać konfiguracji: ${describeError(error)}.`);
    }

    return ok('Konfiguracja zapisana.');
}

/** Signature of the side-effecting download step, injected by the page. */
export type ConfigDownloader = (raw: unknown) => void;

/**
 * Reads the stored config and hands it to `download`. Success is reported
 * only after the download step completed without throwing, so a failing
 * download is never masked by an earlier "exported" message.
 */
export async function exportConfig(
    download: ConfigDownloader,
    storage?: JsonStorage,
): Promise<ActionResult> {
    let raw: unknown;
    try {
        raw = await (storage ?? getAddonStorage()).read(ADDON_CONFIG_KEY);
    } catch (error) {
        return fail(`Nie udało się odczytać konfiguracji: ${describeError(error)}.`);
    }

    if (raw === undefined || raw === null) {
        return fail('Brak zapisanej konfiguracji do eksportu.');
    }

    try {
        download(raw);
    } catch (error) {
        return fail(`Nie udało się wyeksportować konfiguracji: ${describeError(error)}.`);
    }

    return ok('Konfiguracja wyeksportowana.');
}
