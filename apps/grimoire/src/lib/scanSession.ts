// Pure logic for the hands-free scan screen: which queue items just need the
// user's attention, and the running counts shown while scanning. Free of React
// and the browser so it can be tested without a DOM.

import type { QueueItem, QueueItemStatus } from '@/lib/scanQueueTypes';
import { countQueue } from '@/lib/scanQueueWorker';

const NEEDS_ATTENTION: ReadonlySet<QueueItemStatus> = new Set([
    'flagged',
    'failed',
]);

/** The status of each item by id, to compare against the next snapshot. */
export function statusSnapshot(
    items: QueueItem[]
): ReadonlyMap<string, QueueItemStatus> {
    return new Map(items.map((item) => [item.id, item.status]));
}

/**
 * Ids of items that are flagged or failed now but were not before. An item
 * that is new to the queue and already flagged counts; one that was already
 * flagged or failed does not, so the tone plays once per item.
 */
export function newlyAttentionIds(
    previous: ReadonlyMap<string, QueueItemStatus>,
    items: QueueItem[]
): string[] {
    return items
        .filter((item) => {
            if (!NEEDS_ATTENTION.has(item.status)) return false;
            const before = previous.get(item.id);
            return before === undefined || !NEEDS_ATTENTION.has(before);
        })
        .map((item) => item.id);
}

export interface SessionSummary {
    /** Every item in the queue. */
    captured: number;
    identified: number;
    flagged: number;
    failed: number;
}

/** The numbers shown on the scan screen. */
export function summarizeQueue(items: QueueItem[]): SessionSummary {
    const counts = countQueue(items);
    return {
        captured: items.length,
        identified: counts.identified,
        flagged: counts.flagged,
        failed: counts.failed,
    };
}
