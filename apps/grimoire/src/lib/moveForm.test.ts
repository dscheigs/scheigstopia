import { describe, expect, it } from 'vitest';
import { checkMove, recentMoveText } from '@/lib/moveForm';

const base = { from: 'a', to: 'b', quantityText: '2', max: 3 };

describe('checkMove', () => {
    it('accepts a count that the source holds', () => {
        expect(checkMove(base)).toEqual({ ok: true, quantity: 2 });
        expect(checkMove({ ...base, quantityText: ' 3 ' })).toEqual({
            ok: true,
            quantity: 3,
        });
    });

    it('rejects more copies than the source holds', () => {
        expect(checkMove({ ...base, quantityText: '4' })).toEqual({
            ok: false,
            error: 'Only 3 copies are there.',
        });
        expect(checkMove({ ...base, quantityText: '2', max: 1 })).toEqual({
            ok: false,
            error: 'Only 1 copy is there.',
        });
    });

    it('rejects blank, zero, negative and fractional counts', () => {
        for (const quantityText of ['', '0', '-1', '1.5', 'x']) {
            expect(checkMove({ ...base, quantityText }).ok).toBe(false);
        }
    });

    it('needs two different places', () => {
        expect(checkMove({ ...base, from: '' }).ok).toBe(false);
        expect(checkMove({ ...base, to: '' }).ok).toBe(false);
        expect(checkMove({ ...base, to: 'a' }).ok).toBe(false);
    });
});

describe('recentMoveText', () => {
    it('reads as a sentence', () => {
        expect(
            recentMoveText({
                quantity: 2,
                name: 'Lightning Bolt',
                fromLabel: 'Unsorted',
                toLabel: 'Bag',
            })
        ).toBe('2 Lightning Bolt from Unsorted to Bag');
    });
});
