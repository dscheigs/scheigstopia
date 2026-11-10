import { describe, expect, it } from 'vitest';
import type { LocationItem } from '@/lib/locations';
import {
    archiveBlocker,
    cardCountText,
    groupByKind,
    isLocationsRoute,
    locationPath,
} from '@/lib/locationsPage';

function item(overrides: Partial<LocationItem>): LocationItem {
    return {
        id: 'id',
        kind: 'bulk',
        label: 'Bag',
        note: null,
        parentId: null,
        archivedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        cardCount: 0,
        ...overrides,
    };
}

describe('groupByKind', () => {
    it('groups in a fixed order and drops empty groups', () => {
        const groups = groupByKind([
            item({ id: 'd', kind: 'deck' }),
            item({ id: 'b1' }),
            item({ id: 'u', kind: 'unsorted' }),
            item({ id: 'b2' }),
        ]);
        expect(groups.map((g) => g.heading)).toEqual([
            'Unsorted',
            'Bulk',
            'Decks',
        ]);
        expect(groups[1].items.map((i) => i.id)).toEqual(['b1', 'b2']);
    });
});

describe('archiveBlocker', () => {
    it('allows an empty location', () => {
        expect(archiveBlocker(item({ cardCount: 0 }))).toBeNull();
    });
    it('refuses a location that holds cards', () => {
        expect(archiveBlocker(item({ cardCount: 3 }))).toBe(
            'Move its 3 cards out before archiving.'
        );
        expect(archiveBlocker(item({ cardCount: 1 }))).toBe(
            'Move its 1 card out before archiving.'
        );
    });
    it('never allows Unsorted', () => {
        expect(archiveBlocker(item({ kind: 'unsorted' }))).toBe(
            'Unsorted cannot be archived.'
        );
    });
});

describe('paths and counts', () => {
    it('builds paths and recognises the routes', () => {
        expect(locationPath('x')).toBe('/locations/x');
        expect(isLocationsRoute('/locations')).toBe(true);
        expect(isLocationsRoute('/locations/x')).toBe(true);
        expect(isLocationsRoute('/')).toBe(false);
        expect(isLocationsRoute(null)).toBe(false);
    });
    it('pluralises', () => {
        expect(cardCountText(1)).toBe('1 card');
        expect(cardCountText(0)).toBe('0 cards');
    });
});
