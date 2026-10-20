import { describe, expect, it, vi } from 'vitest';
import { requestPersistentStorage } from '@/lib/persistentStorage';

describe('requestPersistentStorage', () => {
    it('is false where the API is missing', async () => {
        expect(await requestPersistentStorage(undefined)).toBe(false);
    });

    it('does not ask again when storage is already persistent', async () => {
        const persist = vi.fn().mockResolvedValue(true);
        const persisted = vi.fn().mockResolvedValue(true);
        expect(await requestPersistentStorage({ persist, persisted })).toBe(
            true
        );
        expect(persist).not.toHaveBeenCalled();
    });

    it('asks and reports the answer', async () => {
        const persist = vi.fn().mockResolvedValue(false);
        const persisted = vi.fn().mockResolvedValue(false);
        expect(await requestPersistentStorage({ persist, persisted })).toBe(
            false
        );
        expect(persist).toHaveBeenCalledOnce();
    });

    it('is false when the browser throws', async () => {
        const persist = vi.fn().mockRejectedValue(new Error('denied'));
        const persisted = vi.fn().mockResolvedValue(false);
        expect(await requestPersistentStorage({ persist, persisted })).toBe(
            false
        );
    });
});
