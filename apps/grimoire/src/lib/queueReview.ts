// Pure helpers for the queue review screen: ordering, labels and what a
// commit sends. Kept free of React and the store so they are easy to test.

import type { CardEntry } from '@/lib/cardSearch';
import type {
    FlagReason,
    QueueItem,
    QueueItemStatus,
} from '@/lib/scanQueueTypes';

export interface QueueGroups {
    /** Flagged and failed items, which need the user's attention. */
    review: QueueItem[];
    /** Items still waiting to be read. */
    pending: QueueItem[];
    /** Identified items, ready to commit. */
    identified: QueueItem[];
}

const groupOf: Record<QueueItemStatus, keyof QueueGroups> = {
    flagged: 'review',
    failed: 'review',
    queued: 'pending',
    sending: 'pending',
    identified: 'identified',
};

/** Split the queue into review / pending / identified, oldest first in each. */
export function groupQueue(items: QueueItem[]): QueueGroups {
    const groups: QueueGroups = { review: [], pending: [], identified: [] };
    for (const item of items) groups[groupOf[item.status]].push(item);
    for (const list of Object.values(groups) as QueueItem[][]) {
        list.sort((a, b) => a.createdAt - b.createdAt);
    }
    return groups;
}

/** Items in screen order: review first, then pending, then identified. */
export function sortQueue(items: QueueItem[]): QueueItem[] {
    const { review, pending, identified } = groupQueue(items);
    return [...review, ...pending, ...identified];
}

const flagLabels: Record<FlagReason, string> = {
    none: 'Needs a look',
    'fuzzy-match': 'Not an exact match',
    ambiguous: 'Could be more than one card',
    'no-match': 'No matching card found',
    unreadable: 'Could not read the name',
    'low-confidence': 'Low confidence',
    error: 'Something went wrong while reading it',
};

/** Why an item needs review, in words. */
export function describeProblem(item: QueueItem): string {
    if (item.status === 'failed') {
        return item.flagReason === 'none' || item.flagReason === 'error'
            ? 'Could not be read'
            : flagLabels[item.flagReason];
    }
    return flagLabels[item.flagReason];
}

/** What fixing an item by hand sets: the chosen card, and identified. */
export function renamePatch(card: Pick<CardEntry, 'oracleId' | 'name'>) {
    return {
        status: 'identified' as const,
        matchedCard: { oracleId: card.oracleId, name: card.name },
        flagReason: 'none' as const,
    };
}

export interface CommitPlan {
    /** The request body for the bulk endpoint; duplicates merged into delta. */
    payload: { oracleId: string; name: string; delta: number }[];
    /** Queue items the payload covers, to remove once the commit succeeds. */
    ids: string[];
    /** Number of cards (queue items), counting duplicates. */
    count: number;
}

/** The identified items with a matched card, merged by card. */
export function planCommit(items: QueueItem[]): CommitPlan {
    const byCard = new Map<
        string,
        { oracleId: string; name: string; delta: number }
    >();
    const ids: string[] = [];
    for (const item of items) {
        if (item.status !== 'identified' || !item.matchedCard) continue;
        ids.push(item.id);
        const { oracleId, name } = item.matchedCard;
        const entry = byCard.get(oracleId);
        if (entry) entry.delta += 1;
        else byCard.set(oracleId, { oracleId, name, delta: 1 });
    }
    return { payload: [...byCard.values()], ids, count: ids.length };
}
