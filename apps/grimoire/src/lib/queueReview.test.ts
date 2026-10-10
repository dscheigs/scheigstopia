import { describe, expect, it } from 'vitest';
import {
    describeProblem,
    groupQueue,
    planCommit,
    confirmPatch,
    renamePatch,
    sortQueue,
} from '@/lib/queueReview';
import type { QueueItem } from '@/lib/scanQueueTypes';

let counter = 0;
function item(patch: Partial<QueueItem> = {}): QueueItem {
    counter += 1;
    return {
        id: `item-${counter}`,
        createdAt: counter,
        status: 'queued',
        readName: null,
        matchedCard: null,
        flagReason: 'none',
        attempts: 0,
        nextAttemptAt: null,
        ...patch,
    };
}

const bolt = { oracleId: 'bolt', name: 'Lightning Bolt' };
const elves = { oracleId: 'elves', name: 'Llanowar Elves' };

describe('ordering', () => {
    it('puts flagged and failed first, then pending, then identified', () => {
        const identified = item({ status: 'identified', matchedCard: bolt });
        const queued = item({ status: 'queued' });
        const flagged = item({ status: 'flagged', flagReason: 'no-match' });
        const failed = item({ status: 'failed', flagReason: 'error' });
        const sorted = sortQueue([identified, queued, flagged, failed]);
        expect(sorted.map((i) => i.id)).toEqual([
            flagged.id,
            failed.id,
            queued.id,
            identified.id,
        ]);
    });

    it('keeps capture order within a group', () => {
        const late = item({ status: 'flagged', createdAt: 900 });
        const early = item({ status: 'failed', createdAt: 100 });
        expect(groupQueue([late, early]).review).toEqual([early, late]);
    });
});

describe('describeProblem', () => {
    it('says why an item was flagged', () => {
        expect(
            describeProblem(
                item({ status: 'flagged', flagReason: 'ambiguous' })
            )
        ).toMatch(/more than one/);
        expect(
            describeProblem(item({ status: 'failed', flagReason: 'error' }))
        ).toBe('Could not be read');
    });
});

describe('rename', () => {
    it('turns an item into an identified one with the chosen card', () => {
        expect(renamePatch({ ...elves, ...{ front: 'x' } })).toEqual({
            status: 'identified',
            matchedCard: elves,
            flagReason: 'none',
        });
    });
});

describe('confirm', () => {
    it('clears the reason, keeps the original and joins identified', () => {
        const flagged = item({
            status: 'flagged',
            flagReason: 'fuzzy-match',
            matchedCard: bolt,
        });
        const patch = confirmPatch(flagged);
        expect(patch).toEqual({
            status: 'identified',
            flagReason: 'none',
            confirmed: true,
            originalFlagReason: 'fuzzy-match',
        });
        const confirmed = { ...flagged, ...patch! };
        const groups = groupQueue([confirmed]);
        expect(groups.identified).toHaveLength(1);
        expect(groups.review).toHaveLength(0);
        expect(planCommit([confirmed]).payload).toEqual([
            { ...bolt, delta: 1 },
        ]);
    });

    it('refuses items that need no review or have no card', () => {
        expect(
            confirmPatch(item({ status: 'identified', matchedCard: bolt }))
        ).toBeNull();
        expect(confirmPatch(item({ status: 'queued' }))).toBeNull();
        expect(
            confirmPatch(item({ status: 'flagged', flagReason: 'no-match' }))
        ).toBeNull();
    });

    it('counts a rename of a flagged item as confirming it', () => {
        const flagged = item({ status: 'flagged', flagReason: 'no-match' });
        expect(renamePatch(elves, flagged)).toMatchObject({
            confirmed: true,
            originalFlagReason: 'no-match',
            matchedCard: elves,
        });
        const done = item({ status: 'identified', matchedCard: bolt });
        expect(renamePatch(elves, done)).not.toHaveProperty('confirmed');
    });
});

describe('planCommit', () => {
    it('merges duplicates into a quantity and lists the items it covers', () => {
        const a = item({ status: 'identified', matchedCard: bolt });
        const b = item({ status: 'identified', matchedCard: bolt });
        const c = item({ status: 'identified', matchedCard: elves });
        const plan = planCommit([a, b, c]);
        expect(plan.payload).toEqual([
            { ...bolt, delta: 2 },
            { ...elves, delta: 1 },
        ]);
        expect(plan.ids).toEqual([a.id, b.id, c.id]);
        expect(plan.count).toBe(3);
    });

    it('skips items that are not identified, and includes fixed ones', () => {
        const flagged = item({
            status: 'flagged',
            flagReason: 'no-match',
            matchedCard: bolt,
        });
        const fixed = item({ status: 'flagged', flagReason: 'no-match' });
        const plan = planCommit([
            flagged,
            { ...fixed, ...renamePatch(elves) },
            item({ status: 'queued' }),
        ]);
        expect(plan.payload).toEqual([{ ...elves, delta: 1 }]);
        expect(plan.ids).toHaveLength(1);
    });
});
