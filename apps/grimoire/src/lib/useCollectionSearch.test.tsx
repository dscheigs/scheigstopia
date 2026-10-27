import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CollectionItem } from '@/lib/collection';
import { useCollectionSearch } from '@/lib/useCollectionSearch';

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

const owned = [item('o-bolt', 'Lightning Bolt', 4), item('o-ring', 'Sol Ring')];

describe('useCollectionSearch', () => {
    it('shows everything for a short query and filters from two characters', () => {
        const { result, rerender } = renderHook(
            ({ query }) => useCollectionSearch(owned, query),
            { initialProps: { query: 'l' } }
        );
        expect(result.current.searching).toBe(false);
        expect(result.current.results).toEqual(owned);

        rerender({ query: 'lightnig' });
        expect(result.current.searching).toBe(true);
        expect(result.current.results.map((c) => c.oracleId)).toEqual([
            'o-bolt',
        ]);
    });

    it('does not rebuild the index for a quantity-only change or a new query', () => {
        const { result, rerender } = renderHook(
            ({ items, query }) => useCollectionSearch(items, query),
            { initialProps: { items: owned, query: 'sol' } }
        );
        const first = result.current.index;

        rerender({
            items: owned.map((card) => ({
                ...card,
                quantity: card.quantity + 1,
            })),
            query: 'sol',
        });
        expect(result.current.index).toBe(first);

        rerender({ items: owned, query: 'sol r' });
        expect(result.current.index).toBe(first);
    });

    it('rebuilds when a card is added, and finds it', () => {
        const { result, rerender } = renderHook(
            ({ items }) => useCollectionSearch(items, 'island'),
            { initialProps: { items: owned } }
        );
        const first = result.current.index;
        expect(result.current.results).toEqual([]);

        rerender({ items: [...owned, item('o-island', 'Island')] });
        expect(result.current.index).not.toBe(first);
        expect(result.current.results.map((c) => c.oracleId)).toEqual([
            'o-island',
        ]);
    });
});
