import {describe, expect, it} from 'vitest';
import {
    readPreferences,
    resetPreferences,
    savePreferences,
    showCurrentPreferences,
} from './preferences';
import {failingStorage, memoryStorage} from '@/test/testUtils';
import {renderMessage} from './dom';

describe('preferences use-cases (no DOM)', () => {
    it('reads stored preferences', async () => {
        const storage = memoryStorage({'starter-page-preferences': {entryPage: 'categorized', theme: 'dark'}});
        const result = await readPreferences(storage);
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error('expected success');
        // Unknown/legacy keys (e.g. theme) are ignored.
        expect(result.value).toEqual({entryPage: 'categorized'});
    });

    it('reports an unreadable store as a failure instead of hiding it', async () => {
        const result = await readPreferences(failingStorage());
        expect(result.ok).toBe(false);
        expect(result.message).toContain('Nie udało się odczytać');
    });

    it('reports success only when the write actually happened', async () => {
        const storage = memoryStorage();
        const result = await savePreferences('categorized', storage);
        expect(result.ok).toBe(true);
        expect(storage.data['starter-page-preferences']).toEqual({entryPage: 'categorized'});
    });

    it('reports failure when storage rejects the write', async () => {
        const result = await savePreferences('categorized', failingStorage());
        expect(result.ok).toBe(false);
        expect(result.message).toContain('Nie udało się zapisać');
    });

    it('reports failure when reset is rejected', async () => {
        const result = await resetPreferences(failingStorage());
        expect(result.ok).toBe(false);
        expect(result.message).toContain('Nie udało się wyczyścić');
    });

    it('removes an empty selection instead of storing an empty object', async () => {
        const storage = memoryStorage({'starter-page-preferences': {entryPage: 'categorized'}});
        const result = await savePreferences('', storage);
        expect(result.ok).toBe(true);
        expect(storage.data['starter-page-preferences']).toBeUndefined();
    });

    it('rejects an unknown page without writing', async () => {
        const storage = memoryStorage();
        const result = await savePreferences('bogus', storage);
        expect(result.ok).toBe(false);
        expect(result.message).toContain('Nieznana strona');
        expect(storage.data['starter-page-preferences']).toBeUndefined();
    });

    it('returns the current preferences as a value', async () => {
        const storage = memoryStorage({'starter-page-preferences': {entryPage: 'categorized'}});
        const result = await showCurrentPreferences(storage);
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error('expected success');
        expect(result.value).toEqual({entryPage: 'categorized'});
    });

    it('reports failure when current preferences cannot be read', async () => {
        const result = await showCurrentPreferences(failingStorage());
        expect(result.ok).toBe(false);
    });
});

describe('renderMessage', () => {
    const cleanup = (): void => {
        document.getElementById('options-status')?.remove();
        document.getElementById('options-root')?.remove();
    };

    it('updates the dedicated status element without touching the form', () => {
        cleanup();
        const root = document.createElement('div');
        root.id = 'options-root';
        const control = document.createElement('button');
        control.textContent = 'keep me';
        root.appendChild(control);
        const status = document.createElement('div');
        status.id = 'options-status';
        root.appendChild(status);
        document.body.appendChild(root);

        renderMessage('hello');

        expect(root.querySelector('button')?.textContent).toBe('keep me');
        expect(document.getElementById('options-status')?.textContent).toBe('hello');
        cleanup();
    });
});
