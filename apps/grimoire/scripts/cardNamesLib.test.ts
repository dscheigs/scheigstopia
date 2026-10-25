import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    MIN_REAL_CARD_COUNT,
    assertDeployableCardList,
    assertSaneRefresh,
    isCardList,
    pickOracleCardsEntry,
    scryfallImageId,
    shouldUploadCardList,
    slimOracleCards,
} from './cardNamesLib.mjs';

async function loadFixture(): Promise<unknown[]> {
    const file = path.join(
        __dirname,
        '..',
        'fixtures',
        'oracle-cards.sample.json'
    );
    return JSON.parse(await readFile(file, 'utf8'));
}

describe('slimOracleCards', () => {
    it('keeps real cards, sorted by name, as [oracleId, name] pairs', async () => {
        const slim = slimOracleCards(await loadFixture(), 'test');
        const names = slim.cards.map(([, name]) => name);

        expect(slim.version).toBe('test');
        expect(slim.count).toBe(slim.cards.length);
        expect(names).toEqual(
            [...names].sort((a, b) => a.localeCompare(b, 'en'))
        );
        expect(names).toContain('Lightning Bolt');
        expect(names).toContain('Delver of Secrets // Insectile Aberration');
    });

    it('drops tokens, art series and other non-collectible layouts', async () => {
        const names = slimOracleCards(await loadFixture(), 'test').cards.map(
            ([, name]) => name
        );
        expect(names).not.toContain('Goblin');
        expect(names).not.toContain('Lightning Bolt Art Card');
        expect(names).not.toContain('Sample Vanguard');
        expect(names).not.toContain('Sample Plane');
        expect(names).not.toContain('Sample Scheme');
    });

    it('dedupes by oracle id and skips cards without one', async () => {
        const slim = slimOracleCards(await loadFixture(), 'test');
        const ids = slim.cards.map(([id]) => id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(
            slim.cards.filter(([, name]) => name === 'Lightning Bolt')
        ).toHaveLength(1);
        expect(slim.cards.map(([, name]) => name)).not.toContain(
            'Card Without An Oracle Id'
        );
    });

    it('reads the oracle id from the faces of reversible cards', async () => {
        const slim = slimOracleCards(await loadFixture(), 'test');
        expect(slim.cards).toContainEqual([
            '00000000-0000-4000-8000-00000000000d',
            'Reversible Example // Reversible Example',
        ]);
    });

    it('adds the front image id, from the card or its first face', async () => {
        const cards = (await import('./cardNamesLib.mjs')).slimOracleCards(
            await loadFixture(),
            'test'
        ).cards;
        const bolt = cards.find(([, name]) => name === 'Lightning Bolt');
        const delver = cards.find(([, name]) => name.startsWith('Delver'));
        expect(bolt?.[2]).toBe('e3285e6b-3e79-4d7c-bf96-d920f973b122');
        expect(delver?.[2]).toBe('11bf83bb-c95b-4b4f-9a56-ce7a1816307a');
    });

    it('leaves the image id off cards without an image', async () => {
        const cards = slimOracleCards(await loadFixture(), 'test').cards;
        const reversible = cards.find(([, name]) =>
            name.startsWith('Reversible')
        );
        expect(reversible).toHaveLength(2);
    });

    it('ignores junk entries', () => {
        expect(slimOracleCards([null, 5, 'x', {}], 'v').count).toBe(0);
    });
});

describe('assertDeployableCardList', () => {
    function listOf(count: number, version = '2026-10-07T00:00:00Z') {
        const cards = Array.from({ length: count }, (_, i) => [
            `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
            `Card ${i}`,
        ]);
        return { version, count, cards };
    }

    it('accepts a full-size list', () => {
        expect(() =>
            assertDeployableCardList(listOf(MIN_REAL_CARD_COUNT))
        ).not.toThrow();
    });

    it('rejects a list built from the sample fixture', async () => {
        const sample = slimOracleCards(await loadFixture(), 'fixture');
        expect(() => assertDeployableCardList(sample)).toThrow(/fixture/);
    });

    it('rejects a list that is too small', () => {
        expect(() =>
            assertDeployableCardList(listOf(MIN_REAL_CARD_COUNT - 1))
        ).toThrow(/only/);
    });

    it('rejects a list whose count does not match its cards', () => {
        const list = listOf(MIN_REAL_CARD_COUNT);
        list.count = list.count + 1;
        expect(() => assertDeployableCardList(list)).toThrow(/count/);
    });

    it('rejects things that are not a card list', () => {
        expect(() => assertDeployableCardList(null)).toThrow(/not a card list/);
        expect(() => assertDeployableCardList({ cards: 'x' })).toThrow(
            /not a card list/
        );
    });
});

describe('pickOracleCardsEntry', () => {
    const oracle = {
        type: 'oracle_cards',
        name: 'Oracle Cards',
        download_uri: 'https://data.scryfall.io/oracle-cards/x.json',
    };
    const other = {
        type: 'default_cards',
        name: 'Default Cards',
        download_uri: 'https://data.scryfall.io/default-cards/y.json',
    };

    it('finds the entry by type', () => {
        expect(pickOracleCardsEntry({ data: [other, oracle] })).toBe(oracle);
    });

    it('falls back to the display name when the type differs', () => {
        const renamed = { ...oracle, type: 'oracle-cards' };
        expect(pickOracleCardsEntry({ data: [other, renamed] })).toBe(renamed);
    });

    it('shows what it received when nothing matches', () => {
        expect(() =>
            pickOracleCardsEntry({ object: 'list', data: [other] })
        ).toThrow(/default_cards \/ Default Cards/);
        expect(() => pickOracleCardsEntry({ object: 'error' })).toThrow(
            /Response keys: \[object\]/
        );
    });

    it('accepts an entry that only has a jsonl_download_uri', () => {
        const jsonl = {
            ...oracle,
            download_uri: undefined,
            jsonl_download_uri:
                'https://data.scryfall.io/oracle-cards/x.jsonl.gz',
        };
        expect(pickOracleCardsEntry({ data: [jsonl] })).toBe(jsonl);
    });

    it('rejects a matching entry that has no download_uri', () => {
        expect(() =>
            pickOracleCardsEntry({
                data: [{ ...oracle, download_uri: undefined }],
            })
        ).toThrow(/no download_uri/);
    });
});

describe('assertSaneRefresh', () => {
    const list = (count: number, version = 'v') => ({
        version,
        count,
        cards: Array.from({ length: count }, (_, i) => [`id${i}`, `Card ${i}`]),
    });
    const previous = list(MIN_REAL_CARD_COUNT * 2);

    it('accepts a list that grew or shrank slightly', () => {
        expect(() =>
            assertSaneRefresh(previous, list(previous.count + 100))
        ).not.toThrow();
        expect(() =>
            assertSaneRefresh(previous, list(previous.count - 100))
        ).not.toThrow();
    });

    it('rejects a list that shrank sharply', () => {
        expect(() =>
            assertSaneRefresh(previous, list(MIN_REAL_CARD_COUNT))
        ).toThrow(/down from/);
    });

    it('rejects an empty or fixture list', () => {
        expect(() => assertSaneRefresh(previous, list(0))).toThrow();
        expect(() =>
            assertSaneRefresh(previous, list(previous.count, 'fixture'))
        ).toThrow(/fixture/);
    });
});

describe('scryfallImageId', () => {
    it('reads the uuid from a small or normal image url', () => {
        const id = '11bf83bb-c95b-4b4f-9a56-ce7a1816307a';
        expect(
            scryfallImageId({
                image_uris: {
                    normal: `https://cards.scryfall.io/normal/front/1/1/${id}.jpg?1`,
                },
            })
        ).toBe(id);
    });

    it('is null for missing or unexpected urls', () => {
        expect(scryfallImageId({})).toBeNull();
        expect(
            scryfallImageId({ image_uris: { small: 'https://x.test/a.jpg' } })
        ).toBeNull();
        expect(scryfallImageId(null)).toBeNull();
    });
});

describe('card list entries with image ids', () => {
    const id = '11bf83bb-c95b-4b4f-9a56-ce7a1816307a';
    const base = { version: 'v', count: 1 };

    it('accepts two- and three-element entries, but not other shapes', () => {
        expect(isCardList({ ...base, cards: [['a', 'A']] })).toBe(true);
        expect(isCardList({ ...base, cards: [['a', 'A', id]] })).toBe(true);
        expect(isCardList({ ...base, cards: [['a', 'A', 5]] })).toBe(false);
        expect(isCardList({ ...base, cards: [['a', 'A', id, 'x']] })).toBe(
            false
        );
    });

    it('uploads when only an image id changed', () => {
        const published = { ...base, cards: [['a', 'A']] };
        expect(
            shouldUploadCardList(published, { cards: [['a', 'A', id]] })
        ).toBe(true);
        expect(
            shouldUploadCardList(
                { ...base, cards: [['a', 'A', id]] },
                { cards: [['a', 'A', id]] }
            )
        ).toBe(false);
    });
});
