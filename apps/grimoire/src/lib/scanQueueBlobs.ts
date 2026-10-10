// Image blobs for queue items, kept apart from the item metadata so the
// persisted queue stays small. Keyed by queue item id.

import { createStore, del, delMany, get, set, type UseStore } from 'idb-keyval';

export interface QueueBlobs {
    /** Small preview; kept after the item is identified. */
    thumbnail?: Blob;
    /** Full photo awaiting identification; dropped once identified. */
    image?: Blob;
}

const dbName = 'grimoire-scan-blobs';
const storeName = 'blobs';

let store: UseStore | null = null;

function blobStore(): UseStore | null {
    if (typeof indexedDB === 'undefined') return null;
    store ??= createStore(dbName, storeName);
    return store;
}

export async function putBlobs(id: string, blobs: QueueBlobs): Promise<void> {
    const s = blobStore();
    if (!s) return;
    await set(id, blobs, s);
}

export async function getBlobs(id: string): Promise<QueueBlobs | undefined> {
    const s = blobStore();
    if (!s) return undefined;
    return get<QueueBlobs>(id, s);
}

/** Drop the full image, keeping the thumbnail. */
export async function dropImage(id: string): Promise<void> {
    const s = blobStore();
    if (!s) return;
    const current = await get<QueueBlobs>(id, s);
    if (!current?.image) return;
    const { thumbnail } = current;
    if (thumbnail) await set(id, { thumbnail }, s);
    else await del(id, s);
}

export async function deleteBlobs(ids: string[]): Promise<void> {
    const s = blobStore();
    if (!s || ids.length === 0) return;
    await delMany(ids, s);
}
