import { describe, expect, it } from 'vitest';
import {
    bagOptions,
    defaultBagLabel,
    initialChoice,
    readLastBag,
    toDestination,
    writeLastBag,
} from '@/lib/commitBag';
import type { LocationItem } from '@/lib/locations';

function location(overrides: Partial<LocationItem>): LocationItem {
    return {
        id: 'loc-1',
        kind: 'bulk',
        label: 'Bag',
        note: null,
        parentId: null,
        archivedAt: null,
        createdAt: '2026-10-01T00:00:00.000Z',
        cardCount: 0,
        ...overrides,
    };
}

describe('defaultBagLabel', () => {
    it('is the local date, zero padded', () => {
        expect(defaultBagLabel(new Date(2026, 9, 9, 23, 59))).toBe(
            '2026-10-09'
        );
        expect(defaultBagLabel(new Date(2027, 0, 5))).toBe('2027-01-05');
    });
});

describe('bagOptions', () => {
    it('keeps open bulk locations only', () => {
        const bag = location({ id: 'a' });
        const options = bagOptions([
            bag,
            location({ id: 'b', kind: 'unsorted' }),
            location({ id: 'c', kind: 'keepers' }),
            location({ id: 'd', archivedAt: '2026-10-02T00:00:00.000Z' }),
        ]);
        expect(options).toEqual([bag]);
    });
});

describe('initialChoice', () => {
    const today = new Date(2026, 9, 9);
    it('starts with a new bag labelled with today', () => {
        expect(initialChoice(null, [], today)).toEqual({
            mode: 'new',
            label: '2026-10-09',
            note: '',
        });
    });

    it('starts with the last bag when it is still there', () => {
        expect(initialChoice('a', [location({ id: 'a' })], today)).toEqual({
            mode: 'existing',
            locationId: 'a',
        });
    });

    it('falls back to a new bag when the last one is gone', () => {
        expect(initialChoice('gone', [location({ id: 'a' })], today).mode).toBe(
            'new'
        );
    });
});

describe('toDestination', () => {
    it('names an existing bag', () => {
        expect(toDestination({ mode: 'existing', locationId: 'a' })).toEqual({
            ok: true,
            destination: { locationId: 'a' },
        });
    });

    it('trims a new bag and leaves out an empty name', () => {
        expect(
            toDestination({ mode: 'new', label: ' 2026-10-09 ', note: ' ' })
        ).toEqual({
            ok: true,
            destination: { newBag: { label: '2026-10-09' } },
        });
        expect(
            toDestination({ mode: 'new', label: 'L', note: ' Cube night ' })
        ).toEqual({
            ok: true,
            destination: { newBag: { label: 'L', note: 'Cube night' } },
        });
    });

    it('rejects an empty or overlong label', () => {
        expect(toDestination({ mode: 'new', label: '  ', note: '' }).ok).toBe(
            false
        );
        expect(
            toDestination({ mode: 'new', label: 'x'.repeat(101), note: '' }).ok
        ).toBe(false);
    });
});

describe('last bag storage', () => {
    function memoryStorage() {
        const data = new Map<string, string>();
        return {
            getItem: (key: string) => data.get(key) ?? null,
            setItem: (key: string, value: string) => void data.set(key, value),
        };
    }

    it('remembers the bag per user', () => {
        const storage = memoryStorage();
        writeLastBag(storage, 'u1', 'bag-1');
        expect(readLastBag(storage, 'u1')).toBe('bag-1');
        expect(readLastBag(storage, 'u2')).toBeNull();
    });

    it('survives missing or throwing storage', () => {
        const broken = {
            getItem: () => {
                throw new Error('blocked');
            },
            setItem: () => {
                throw new Error('blocked');
            },
        };
        expect(readLastBag(null, 'u1')).toBeNull();
        expect(readLastBag(broken, 'u1')).toBeNull();
        expect(() => writeLastBag(broken, 'u1', 'x')).not.toThrow();
        expect(() => writeLastBag(null, 'u1', 'x')).not.toThrow();
    });
});
