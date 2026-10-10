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
    /**
     * The top card-list matches for the read name, best first, capped. Offered
     * as suggestions in the edit modal. Absent on items saved before this
     * field existed, and when the read matched nothing.
     */
    candidates?: MatchedCard[];
    /**
     * The model's own confidence in the read. Kept next to `flagReason` (the
     * card-list match quality) so the M5 accuracy test can compare the two.
     * Absent on items scanned before this field existed.
     */
    modelConfidence?: 'high' | 'low';
    /**
     * The user vouched for this item (confirmed it, or fixed its name) while it
     * was flagged. Absent on items saved before this field existed.
     */
    confirmed?: boolean;
    /**
     * The flag reason the item had when it was confirmed, kept because
     * `flagReason` is cleared then. For the M5 accuracy check.
     */
    originalFlagReason?: FlagReason;
    attempts: number;
    /** Epoch milliseconds; null when the item is not waiting on a retry. */
    nextAttemptAt: number | null;
}

/** Fields the caller supplies when adding; the rest get defaults. */
export type NewQueueItem = Partial<QueueItem>;
