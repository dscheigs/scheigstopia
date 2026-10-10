'use client';

// React binding for one user's scan queue store.

import { useCallback, useSyncExternalStore } from 'react';
import { getScanQueueStore, type ScanQueueStore } from '@/lib/scanQueueStore';
import type { QueueItem } from '@/lib/scanQueueTypes';

const NO_ITEMS: QueueItem[] = [];

export interface UseScanQueue {
    items: QueueItem[];
    /** False until the saved queue has loaded from IndexedDB. */
    ready: boolean;
    store: ScanQueueStore;
}

export function useScanQueue(userId: string): UseScanQueue {
    // Only ever called in the browser: the server snapshots below never touch it.
    const store = getScanQueueStore(userId);

    const items = useSyncExternalStore(
        useCallback((notify) => store.subscribe(notify), [store]),
        () => store.getState().items,
        () => NO_ITEMS
    );
    const ready = useSyncExternalStore(
        useCallback(
            (notify) => store.persist.onFinishHydration(notify),
            [store]
        ),
        () => store.persist.hasHydrated(),
        () => false
    );
    return { items, ready, store };
}

/** Just the number of items in the queue, for the header badge. */
export function useQueueCount(userId: string): number {
    return useScanQueue(userId).items.length;
}
