import { describe, expect, it } from 'vitest';
import { loadCardNamesCached, type CardNamesCache } from '@/lib/cardNamesCache';
import type { CardNameFile } from '@/lib/cardSearch';

const list: CardNameFile = {
    version: '2026-10-01',
    count: 1,
    cards: [['oracle-1', 'Sol Ring']],
};

function memoryCache(initial?: unknown): CardNamesCache & { value: unknown } {
    const cache = {
        value: initial,
        async read() {
            return cache.value;
        },
        async write(next: CardNameFile) {
            cache.value = next;
        },
    };
    return cache;
}

describe('loadCardNamesCached', () => {
    it('returns the fresh list and remembers it', async () => {
        const cache = memoryCache();
        expect(await loadCardNamesCached(async () => list, cache)).toBe(list);
        expect(cache.value).toBe(list);
    });

    it('falls back to the remembered list when loading fails', async () => {
        const cache = memoryCache(list);
        const result = await loadCardNamesCached(async () => {
            throw new Error('offline');
        }, cache);
        expect(result).toBe(list);
    });

    it('rethrows when loading fails and nothing valid is remembered', async () => {
        const cache = memoryCache({ nonsense: true });
        await expect(
            loadCardNamesCached(async () => {
                throw new Error('offline');
            }, cache)
        ).rejects.toThrow('offline');
    });

    it('still returns the fresh list when the cache cannot be written', async () => {
        const cache: CardNamesCache = {
            read: async () => undefined,
            write: async () => {
                throw new Error('quota');
            },
        };
        expect(await loadCardNamesCached(async () => list, cache)).toBe(list);
    });
});
