import {describe, expect, it} from 'vitest';
import {exportConfig, importConfig} from './configTransfer';
import {failingStorage, memoryStorage} from '@/test/testUtils';

function fileWith(content: string): File {
    return {text: async () => content} as unknown as File;
}

const validConfig = JSON.stringify({
    title: 'T',
    heading: 'H',
    subtitle: 'S',
    links: [{id: 1, name: 'X', url: '/x'}],
});

describe('config transfer use-cases (no DOM)', () => {
    it('validates and stores an imported config', async () => {
        const storage = memoryStorage();
        const result = await importConfig(fileWith(validConfig), storage);
        expect(result.ok).toBe(true);
        expect(storage.data['starter-page-config']).toMatchObject({title: 'T'});
    });

    it('rejects invalid JSON without writing', async () => {
        const storage = memoryStorage();
        const result = await importConfig(fileWith('{broken'), storage);
        expect(result.ok).toBe(false);
        expect(storage.data['starter-page-config']).toBeUndefined();
    });

    it('rejects schema-invalid config without writing', async () => {
        const storage = memoryStorage();
        const result = await importConfig(fileWith(JSON.stringify({title: 1})), storage);
        expect(result.ok).toBe(false);
        expect(storage.data['starter-page-config']).toBeUndefined();
    });

    it('reports failure when the write is rejected', async () => {
        const result = await importConfig(fileWith(validConfig), failingStorage());
        expect(result.ok).toBe(false);
    });

    it('downloads the stored config', async () => {
        const storage = memoryStorage({'starter-page-config': {title: 'kept'}});
        let downloaded: unknown;
        const result = await exportConfig((raw) => {
            downloaded = raw;
        }, storage);
        expect(result.ok).toBe(true);
        expect(downloaded).toEqual({title: 'kept'});
    });

    it('reports "nothing to export" for empty storage', async () => {
        const result = await exportConfig(() => undefined, memoryStorage());
        expect(result.ok).toBe(false);
        expect(result.message).toContain('Brak zapisanej konfiguracji');
    });

    it('reports failure when the download step throws', async () => {
        const storage = memoryStorage({'starter-page-config': {title: 'kept'}});
        const result = await exportConfig(() => {
            throw new Error('blob failed');
        }, storage);
        expect(result.ok).toBe(false);
        expect(result.message).toContain('Nie udało się wyeksportować');
    });
});
