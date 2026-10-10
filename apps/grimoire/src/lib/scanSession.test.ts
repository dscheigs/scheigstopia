import { describe, expect, it } from 'vitest';
import type { QueueItem, QueueItemStatus } from '@/lib/scanQueueTypes';
import {
    newlyAttentionIds,
    statusSnapshot,
    summarizeQueue,
} from '@/lib/scanSession';

function item(id: string, status: QueueItemStatus): QueueItem {
    return {
        id,
        createdAt: 0,
        status,
        readName: null,
        matchedCard: null,
        flagReason: 'none',
        attempts: 0,
        nextAttemptAt: null,
    };
}

describe('newlyAttentionIds', () => {
    it('reports an item that becomes flagged or failed', () => {
        const before = statusSnapshot([
            item('a', 'sending'),
            item('b', 'sending'),
        ]);
        const after = [item('a', 'flagged'), item('b', 'failed')];
        expect(newlyAttentionIds(before, after)).toEqual(['a', 'b']);
    });

    it('does not repeat for items already needing attention', () => {
        const before = statusSnapshot([item('a', 'flagged')]);
        expect(newlyAttentionIds(before, [item('a', 'failed')])).toEqual([]);
    });

    it('reports again when a retried item is flagged a second time', () => {
        const before = statusSnapshot([item('a', 'queued')]);
        expect(newlyAttentionIds(before, [item('a', 'flagged')])).toEqual([
            'a',
        ]);
    });

    it('reports a new item that arrives already flagged', () => {
        expect(
            newlyAttentionIds(statusSnapshot([]), [item('a', 'flagged')])
        ).toEqual(['a']);
    });

    it('ignores identified, queued and sending items', () => {
        const before = statusSnapshot([item('a', 'sending')]);
        expect(
            newlyAttentionIds(before, [
                item('a', 'identified'),
                item('b', 'queued'),
            ])
        ).toEqual([]);
    });
});

describe('summarizeQueue', () => {
    it('counts captured, identified, flagged and failed', () => {
        expect(
            summarizeQueue([
                item('a', 'identified'),
                item('b', 'identified'),
                item('c', 'flagged'),
                item('d', 'failed'),
                item('e', 'queued'),
                item('f', 'sending'),
            ])
        ).toEqual({ captured: 6, identified: 2, flagged: 1, failed: 1 });
    });

    it('is all zeros for an empty queue', () => {
        expect(summarizeQueue([])).toEqual({
            captured: 0,
            identified: 0,
            flagged: 0,
            failed: 0,
        });
    });
});
