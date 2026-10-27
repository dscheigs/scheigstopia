import { describe, expect, it } from 'vitest';
import {
    buildIndexFromEntries,
    searchCards,
    toCardEntry,
} from '@/lib/cardSearch';
import type { CollectionItem } from '@/lib/collection';
import {
    buildCollectionIndex,
    collectionIndexKey,
    searchCollection,
} from '@/lib/collectionSearch';

const item = (
    oracleId: string,
    name: string,
    quantity = 1
): CollectionItem => ({
    oracleId,
    name,
    quantity,
    updatedAt: '2026-01-01T00:00:00.000Z',
});

const owned = [
    item('o-bolt', 'Lightning Bolt', 4),
    item('o-delver', 'Delver of Secrets // Insectile Aberration', 2),
    item('o-ring', 'Sol Ring'),
];

describe('buildCollectionIndex', () => {
    it('finds a misspelled name the same way the catalog index does', () => {
        const catalog = buildIndexFromEntries(
            owned.map((card) => toCardEntry(card.oracleId, card.name))
        );
        const collection = buildCollectionIndex(owned);
        for (const typo of ['lightnig bolt', 'sol rng', 'DELVER']) {
            expect(
                searchCards(collection, typo).map((c) => c.oracleId)
            ).toEqual(searchCards(catalog, typo).map((c) => c.oracleId));
        }
        expect(searchCards(collection, 'lightnig bolt')[0]?.oracleId).toBe(
            'o-bolt'
        );
    });

    it('matches a double-faced card on its front face', () => {
        const index = buildCollectionIndex(owned);
        const hit = searchCards(index, 'Delver of Secrets')[0];
        expect(hit?.oracleId).toBe('o-delver');
        expect(hit?.front).toBe('Delver of Secrets');
    });
});

describe('searchCollection', () => {
    const index = buildCollectionIndex(owned);

    it('returns every card, in the given order, for a query too short to search', () => {
        expect(searchCollection(index, owned, '')).toBe(owned);
        expect(searchCollection(index, owned, ' l ')).toBe(owned);
    });

    it('filters from two characters, best match first, with the current quantity', () => {
        const results = searchCollection(index, owned, 'so');
        expect(results.map((card) => card.oracleId)).toContain('o-ring');
        expect(results.every((card) => owned.includes(card))).toBe(true);

        const updated = [{ ...owned[0], quantity: 9 }, owned[1], owned[2]];
        expect(searchCollection(index, updated, 'lightning')[0]?.quantity).toBe(
            9
        );
    });

    it('returns nothing when no owned card matches', () => {
        expect(searchCollection(index, owned, 'zzzzzz')).toEqual([]);
    });
});

describe('collectionIndexKey', () => {
    it('ignores quantities', () => {
        const changed = owned.map((card) => ({ ...card, quantity: 99 }));
        expect(collectionIndexKey(changed)).toBe(collectionIndexKey(owned));
    });

    it('changes when a card is added, removed or renamed', () => {
        const base = collectionIndexKey(owned);
        expect(collectionIndexKey([...owned, item('o-new', 'New')])).not.toBe(
            base
        );
        expect(collectionIndexKey(owned.slice(1))).not.toBe(base);
        expect(
            collectionIndexKey([
                { ...owned[0], name: 'Bolt' },
                ...owned.slice(1),
            ])
        ).not.toBe(base);
    });
});
