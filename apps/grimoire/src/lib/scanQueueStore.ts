// Client-side scan queue: a Zustand store persisted to IndexedDB, one per user.
// Nothing here touches IndexedDB on the server.

import { createStore as createIdbStore, del, get, set } from 'idb-keyval';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { deleteBlobs, dropImage } from '@/lib/scanQueueBlobs';
import { confirmPatch, renamePatch } from '@/lib/queueReview';
import type { NewQueueItem, QueueItem } from '@/lib/scanQueueTypes';

export interface ScanQueueState {
    items: QueueItem[];
    add: (input?: NewQueueItem) => QueueItem;
    update: (id: string, patch: Partial<Omit<QueueItem, 'id'>>) => void;
    remove: (id: string) => void;
    removeMany: (ids: string[]) => void;
    /** Put an item back in line for another attempt. */
    retry: (id: string) => void;
    /**
     * Mark a flagged item as right: it moves to identified. Does nothing for
     * items that do not need review or have no matched card.
     */
    confirm: (id: string) => void;
    /** Set an item's card by hand; confirms it if it needed review. */
    rename: (id: string, card: { oracleId: string; name: string }) => void;
    clear: () => void;
}

/** Queue items older than this are dropped when the queue loads (12 hours). */
export const QUEUE_ITEM_TTL_MS = 12 * 60 * 60 * 1000;

export type ScanQueueStore = ReturnType<typeof createScanQueueStore>;

const metaDbName = 'grimoire-scan-queue';
const metaStoreName = 'meta';
const keyPrefix = 'queue:';

/** The persist key for one user's queue. */
export function queueStorageKey(userId: string): string {
    return `${keyPrefix}${userId}`;
}

/** IndexedDB-backed string storage; inert where there is no IndexedDB (server). */
function idbStorage() {
    if (typeof indexedDB === 'undefined') {
        return {
            getItem: async () => null,
            setItem: async () => {},
            removeItem: async () => {},
        };
    }
    const idb = createIdbStore(metaDbName, metaStoreName);
    return {
        getItem: async (name: string) => (await get<string>(name, idb)) ?? null,
        setItem: (name: string, value: string) => set(name, value, idb),
        removeItem: (name: string) => del(name, idb),
    };
}

export function createScanQueueStore(userId: string) {
    return createStore<ScanQueueState>()(
        persist(
            (setState, getState) => ({
                items: [],
                add: (input = {}) => {
                    const item: QueueItem = {
                        id: crypto.randomUUID(),
                        createdAt: Date.now(),
                        status: 'queued',
                        readName: null,
                        matchedCard: null,
                        flagReason: 'none',
                        attempts: 0,
                        nextAttemptAt: null,
                        ...input,
                    };
                    setState((s) => ({ items: [...s.items, item] }));
                    return item;
                },
                update: (id, patch) => {
                    setState((s) => ({
                        items: s.items.map((item) =>
                            item.id === id ? { ...item, ...patch, id } : item
                        ),
                    }));
                    if (patch.status === 'identified') void dropImage(id);
                },
                remove: (id) => {
                    setState((s) => ({
                        items: s.items.filter((item) => item.id !== id),
                    }));
                    void deleteBlobs([id]);
                },
                removeMany: (ids) => {
                    const gone = new Set(ids);
                    setState((s) => ({
                        items: s.items.filter((item) => !gone.has(item.id)),
                    }));
                    void deleteBlobs(ids);
                },
                retry: (id) =>
                    getState().update(id, {
                        status: 'queued',
                        flagReason: 'none',
                        nextAttemptAt: null,
                    }),
                confirm: (id) => {
                    const item = getState().items.find((i) => i.id === id);
                    const patch = item && confirmPatch(item);
                    if (patch) getState().update(id, patch);
                },
                rename: (id, card) => {
                    const item = getState().items.find((i) => i.id === id);
                    if (item) getState().update(id, renamePatch(card, item));
                },
                clear: () => {
                    const ids = getState().items.map((item) => item.id);
                    setState({ items: [] });
                    void deleteBlobs(ids);
                },
            }),
            {
                name: queueStorageKey(userId),
                storage: createJSONStorage(idbStorage),
                partialize: (s) => ({ items: s.items }),
                // Hydration is async, so items added before it lands are kept.
                // Items caught mid-send by a reload go back in line.
                merge: (persisted, current) => {
                    const saved =
                        (persisted as Pick<ScanQueueState, 'items'> | undefined)
                            ?.items ?? [];
                    const live = new Set(current.items.map((item) => item.id));
                    // Items past the TTL are dropped, with their blobs.
                    const cutoff = Date.now() - QUEUE_ITEM_TTL_MS;
                    const expired = saved.filter(
                        (item) => item.createdAt < cutoff
                    );
                    if (expired.length > 0) {
                        void deleteBlobs(expired.map((item) => item.id));
                    }
                    const restored = saved
                        .filter(
                            (item) =>
                                !live.has(item.id) && item.createdAt >= cutoff
                        )
                        .map((item) =>
                            item.status === 'sending'
                                ? { ...item, status: 'queued' as const }
                                : item
                        );
                    return {
                        ...current,
                        items: [...restored, ...current.items],
                    };
                },
            }
        )
    );
}

const stores = new Map<string, ScanQueueStore>();

/** The shared queue store for `userId`, created on first use. */
export function getScanQueueStore(userId: string): ScanQueueStore {
    let store = stores.get(userId);
    if (!store) {
        store = createScanQueueStore(userId);
        stores.set(userId, store);
    }
    return store;
}

/** Wipe a user's queue, its persisted copy and its blobs. Call on sign-out. */
export async function clearQueueForUser(userId: string): Promise<void> {
    const store = getScanQueueStore(userId);
    await store.persist.rehydrate();
    const ids = store.getState().items.map((item) => item.id);
    store.setState({ items: [] });
    await deleteBlobs(ids);
    await store.persist.clearStorage();
    stores.delete(userId);
}

/**
 * Ask the browser not to evict our IndexedDB data. Resolves to whether storage
 * is persistent (already granted or granted now); false where unsupported.
 */
export async function requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
        return false;
    }
    try {
        if (await navigator.storage.persisted?.()) return true;
        return await navigator.storage.persist();
    } catch {
        return false;
    }
}
