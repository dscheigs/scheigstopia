// The scan queue item: the shared contract for the M4 background-scan flow.
// "Queue" is locally staged scans awaiting commit; "collection" is the database.

export type QueueItemStatus =
    | 'queued'
    | 'sending'
    | 'identified'
    | 'flagged'
    | 'failed';

export type FlagReason =
    | 'none'
    | 'fuzzy-match'
    | 'ambiguous'
    | 'no-match'
    | 'unreadable'
    | 'low-confidence'
    | 'error';

export interface MatchedCard {
    oracleId: string;
    name: string;
}

export interface QueueItem {
    id: string;
    /** Epoch milliseconds. */
    createdAt: number;
    status: QueueItemStatus;
    /** The name the model read off the card, before matching. */
    readName: string | null;
    matchedCard: MatchedCard | null;
    flagReason: FlagReason;
    attempts: number;
    /** Epoch milliseconds; null when the item is not waiting on a retry. */
    nextAttemptAt: number | null;
}

/** Fields the caller supplies when adding; the rest get defaults. */
export type NewQueueItem = Partial<QueueItem>;
