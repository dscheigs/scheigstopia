import { describe, expect, it } from 'vitest';
import {
    isLocationKind,
    isRareSafe,
    LOCATION_KINDS,
} from '@/lib/locationKinds';

describe('location kinds', () => {
    it('knows the four kinds', () => {
        expect([...LOCATION_KINDS]).toEqual([
            'unsorted',
            'bulk',
            'keepers',
            'deck',
        ]);
        expect(isLocationKind('keepers')).toBe(true);
        expect(isLocationKind('binder')).toBe(false);
        expect(isLocationKind(undefined)).toBe(false);
    });

    it('flags a rare in unsorted and bulk, but not in keepers or a deck', () => {
        expect(isRareSafe('unsorted')).toBe(false);
        expect(isRareSafe('bulk')).toBe(false);
        expect(isRareSafe('keepers')).toBe(true);
        expect(isRareSafe('deck')).toBe(true);
    });
});
