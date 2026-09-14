import {PREFERENCES_KEY} from '@/config/storageKeys';
import {getRuntimeStorage} from '@/config/storage';
import {parsePreferences} from '@/config/staticConfig';
import type {StarterPagePreferences} from '@/models/starter-page';
import type {JsonStorage} from '@/config/storageAdapters';
import {describeError, fail, ok, okValue} from './result';
import type {ActionResult} from './result';

/**
 * Preferences use-cases. They never touch the DOM (no #options-root needed):
 * every outcome is returned as an ActionResult for the caller to render.
 */

/**
 * Runs a storage action, resolving the runtime storage lazily and converting
 * any thrown error (including a missing extension API from the factory) into
 * a failure result with the given message prefix.
 */
async function guard<T>(
    action: (storage: JsonStorage) => Promise<ActionResult<T>>,
    prefix: string,
    storage?: JsonStorage,
): Promise<ActionResult<T>> {
    try {
        return await action(storage ?? getRuntimeStorage());
    } catch (error) {
        return fail(`${prefix}: ${describeError(error)}.`);
    }
}

/** Reads and validates stored preferences. Corrupt/absent entries parse to {}. */
export function readPreferences(
    storage?: JsonStorage,
): Promise<ActionResult<StarterPagePreferences>> {
    return guard(
        async (store) => okValue('', parsePreferences(await store.read(PREFERENCES_KEY))),
        'Nie udało się odczytać preferencji',
        storage,
    );
}

/**
 * Persists the chosen initial Starter Page. An empty selection means "no local
 * preference" and removes the stored entry instead.
 */
export async function savePreferences(
    entryPage: string,
    storage?: JsonStorage,
): Promise<ActionResult> {
    const preferences: Record<string, string> = {};
    if (entryPage !== '') preferences.entryPage = entryPage;

    const validated = parsePreferences(preferences);
    if (entryPage !== '' && validated.entryPage === undefined) {
        return fail(`Nieznana strona "${entryPage}".`);
    }

    return guard(
        async (store) => {
            if (Object.keys(validated).length === 0) {
                await store.remove(PREFERENCES_KEY);
                return ok('Preferencje wyczyszczone (brak lokalnego wyboru).');
            }
            await store.write(PREFERENCES_KEY, validated);
            return ok('Preferencje zapisane.');
        },
        'Nie udało się zapisać preferencji',
        storage,
    );
}

/** Removes stored preferences. */
export function resetPreferences(storage?: JsonStorage): Promise<ActionResult> {
    return guard(
        async (store) => {
            await store.remove(PREFERENCES_KEY);
            return ok('Preferencje wyczyszczone.');
        },
        'Nie udało się wyczyścić preferencji',
        storage,
    );
}

/** Reads stored preferences for display. */
export function showCurrentPreferences(
    storage?: JsonStorage,
): Promise<ActionResult<StarterPagePreferences>> {
    return guard(
        async (store) => {
            const prefs = parsePreferences(await store.read(PREFERENCES_KEY));
            return okValue(
                `Aktualne preferencje: entryPage=${prefs.entryPage ?? '(domyślny z konfiguracji)'}`,
                prefs,
            );
        },
        'Nie udało się odczytać preferencji',
        storage,
    );
}
