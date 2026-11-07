import { describe, expect, it } from 'vitest';
import type { RarityCode } from '@/lib/cardSearch';
import type { RareCandidate } from '@/lib/locations';
import {
    attentionList,
    flaggedKeys,
    needsAttention,
} from '@/lib/rareAttention';

const rarities = new Map<string, RarityCode>([
    ['rare-1', 'r'],
    ['mythic-1', 'm'],
    ['common-1', 'c'],
    ['other-1', 'o'],
]);

function candidate(overrides: Partial<RareCandidate>): RareCandidate {
    return {
        oracleId: 'rare-1',
        name: 'Rare',
        locationId: 'loc-1',
        kind: 'bulk',
        label: 'Shoebox',
        rareRule: null,
        quantity: 1,
        ...overrides,
    };
}

describe('needsAttention', () => {
    it('flags rares and mythics, not other rarities or unknown cards', () => {
        expect(needsAttention(candidate({}), rarities)).toBe(true);
        expect(
            needsAttention(candidate({ oracleId: 'mythic-1' }), rarities)
        ).toBe(true);
        expect(
            needsAttention(candidate({ oracleId: 'common-1' }), rarities)
        ).toBe(false);
        expect(
            needsAttention(candidate({ oracleId: 'other-1' }), rarities)
        ).toBe(false);
        expect(needsAttention(candidate({ oracleId: 'nope' }), rarities)).toBe(
            false
        );
    });

    it('lets an override of bulk clear it and keep flag any rarity', () => {
        expect(needsAttention(candidate({ rareRule: 'bulk' }), rarities)).toBe(
            false
        );
        expect(
            needsAttention(
                candidate({ oracleId: 'common-1', rareRule: 'keep' }),
                rarities
            )
        ).toBe(true);
    });
});

describe('attentionList', () => {
    it('orders by name, then location label', () => {
        const list = attentionList(
            [
                candidate({
                    oracleId: 'mythic-1',
                    name: 'zebra',
                    label: 'A',
                    locationId: 'a',
                }),
                candidate({ name: 'Apple', label: 'Box', locationId: 'b' }),
                candidate({ name: 'apple', label: 'Bag', locationId: 'c' }),
                candidate({ oracleId: 'common-1', name: 'Bolt' }),
            ],
            rarities
        );
        expect(list.map((c) => `${c.name}/${c.label}`)).toEqual([
            'apple/Bag',
            'Apple/Box',
            'zebra/A',
        ]);
    });

    it('keys flagged groups by card and location', () => {
        expect([...flaggedKeys([candidate({})], rarities)]).toEqual([
            'rare-1:loc-1',
        ]);
    });
});
