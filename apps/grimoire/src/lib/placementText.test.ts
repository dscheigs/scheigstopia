import { describe, expect, it } from 'vitest';
import type { CardPlacement, HistoryEntry } from '@/lib/locations';
import {
    describeMove,
    formatMoveDate,
    formatPlacements,
    groupPlacements,
} from '@/lib/placementText';

const place = (
    oracleId: string,
    label: string,
    quantity: number
): CardPlacement => ({
    oracleId,
    locationId: label,
    kind: 'bulk',
    label,
    quantity,
});

const move = (over: Partial<HistoryEntry>): HistoryEntry => ({
    id: 1,
    fromId: 'a',
    fromLabel: 'A',
    toId: 'b',
    toLabel: 'B',
    quantity: 2,
    note: null,
    createdAt: '2026-10-09T12:00:00.000Z',
    ...over,
});

describe('groupPlacements', () => {
    it('groups by card and keeps the order', () => {
        const grouped = groupPlacements([
            place('x', 'Bag', 2),
            place('y', 'Box', 1),
            place('x', 'Binder A', 1),
        ]);
        expect([...grouped.keys()]).toEqual(['x', 'y']);
        expect(grouped.get('x')?.map((p) => p.label)).toEqual([
            'Bag',
            'Binder A',
        ]);
        expect(grouped.get('x')?.[0]).not.toHaveProperty('oracleId');
    });
});

describe('formatPlacements', () => {
    it('joins quantity and place', () => {
        expect(
            formatPlacements([
                place('x', 'Bag 2026-10-09', 2),
                place('x', 'Binder A', 1),
            ])
        ).toBe('2 in Bag 2026-10-09, 1 in Binder A');
    });
    it('is empty for no placements', () => {
        expect(formatPlacements([])).toBe('');
    });
});

describe('formatMoveDate', () => {
    it('formats in UTC', () => {
        expect(formatMoveDate('2026-10-09T23:30:00.000Z')).toBe('9 Oct 2026');
    });
    it('is empty for a bad date', () => {
        expect(formatMoveDate('nope')).toBe('');
    });
});

describe('describeMove', () => {
    it('describes a move between locations', () => {
        expect(describeMove(move({}))).toBe('2 from A to B');
    });
    it('describes copies arriving from outside', () => {
        expect(describeMove(move({ fromLabel: null, fromId: null }))).toBe(
            '2 added to B'
        );
    });
    it('describes copies leaving the collection', () => {
        expect(describeMove(move({ toLabel: null, toId: null }))).toBe(
            '2 removed from A'
        );
    });
    it('falls back when both ends are unknown', () => {
        expect(
            describeMove(
                move({
                    fromLabel: null,
                    toLabel: null,
                    fromId: null,
                    toId: null,
                })
            )
        ).toBe('2 moved');
    });
});
