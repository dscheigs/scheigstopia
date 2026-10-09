import { describe, expect, it } from 'vitest';
import type { CollectionItem } from '@/lib/collection';
import { withItem, withoutItem } from '@/lib/collectionCache';

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

describe('withItem', () => {
    it('adds a new card in alphabetical order', () => {
        const result = withItem(
            [item('a', 'Counterspell'), item('c', 'Sol Ring')],
            item('b', 'Lightning Bolt')
        );
        expect(result.map((i) => i.name)).toEqual([
            'Counterspell',
            'Lightning Bolt',
            'Sol Ring',
        ]);
    });

    it('replaces an existing card instead of duplicating it', () => {
        const result = withItem(
            [item('a', 'Sol Ring', 1)],
            item('a', 'Sol Ring', 3)
        );
        expect(result).toHaveLength(1);
        expect(result[0].quantity).toBe(3);
    });

    it('sorts ignoring case and does not mutate the input', () => {
        const input = [item('a', 'banana')];
        const result = withItem(input, item('b', 'Apple'));
        expect(result.map((i) => i.name)).toEqual(['Apple', 'banana']);
        expect(input).toHaveLength(1);
    });
});

describe('withoutItem', () => {
    it('drops the card with that oracle id', () => {
        const result = withoutItem([item('a', 'A'), item('b', 'B')], 'a');
        expect(result.map((i) => i.oracleId)).toEqual(['b']);
    });
});
