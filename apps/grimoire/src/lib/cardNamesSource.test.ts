import { describe, expect, it, vi } from 'vitest';
import {
    COMMITTED_CARD_NAMES_PATH,
    isCardNameFile,
    loadCardNames,
} from './cardNamesSource';

const file = (name: string) => ({
    version: name,
    count: 1,
    cards: [['id', name]],
});
const URL = 'https://blob.example/card-names.json';

describe('isCardNameFile', () => {
    it('accepts a good list and rejects bad shapes', () => {
        expect(isCardNameFile(file('a'))).toBe(true);
        expect(isCardNameFile(null)).toBe(false);
        expect(isCardNameFile({ version: 'x', count: 0, cards: [] })).toBe(
            false
        );
        expect(
            isCardNameFile({ version: 'x', count: 2, cards: [['a', 'b']] })
        ).toBe(false);
        expect(isCardNameFile({ version: 'x', count: 1, cards: ['a'] })).toBe(
            false
        );
    });
});

describe('loadCardNames', () => {
    it('reads the committed file when no URL is set', async () => {
        const fetchJson = vi.fn(async () => file('committed'));
        const result = await loadCardNames(fetchJson, undefined);
        expect(result.version).toBe('committed');
        expect(fetchJson).toHaveBeenCalledTimes(1);
        expect(fetchJson).toHaveBeenCalledWith(COMMITTED_CARD_NAMES_PATH);
    });

    it('treats an empty URL as unset', async () => {
        const fetchJson = vi.fn(async () => file('committed'));
        await loadCardNames(fetchJson, '');
        expect(fetchJson).toHaveBeenCalledTimes(1);
    });

    it('prefers the remote list when it is valid', async () => {
        const fetchJson = vi.fn(async (url: string) =>
            file(url === URL ? 'remote' : 'committed')
        );
        expect((await loadCardNames(fetchJson, URL)).version).toBe('remote');
        expect(fetchJson).toHaveBeenCalledTimes(1);
    });

    it('falls back when the remote fetch fails', async () => {
        const fetchJson = vi.fn(async (url: string) => {
            if (url === URL) throw new Error('offline');
            return file('committed');
        });
        expect((await loadCardNames(fetchJson, URL)).version).toBe('committed');
    });

    it('falls back when the remote returns something invalid', async () => {
        const fetchJson = vi.fn(async (url: string) =>
            url === URL ? { cards: 'nope' } : file('committed')
        );
        expect((await loadCardNames(fetchJson, URL)).version).toBe('committed');
    });

    it('throws when the committed file is invalid too', async () => {
        await expect(
            loadCardNames(async () => ({ bad: true }), URL)
        ).rejects.toThrow();
    });
});
