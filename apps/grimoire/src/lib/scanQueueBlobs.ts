// Image blobs for queue items, kept apart from the item metadata so the
// persisted queue stays small. Keyed by queue item id.

import { createStore, del, delMany, get, set, type UseStore } from 'idb-keyval';

export interface QueueBlobs {
    /** Medium review image (about 600px); kept after the item is identified. */
    review?: Blob;
    /** Legacy 160px preview from older captures. Only read, never written. */
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

/** The image to show for a row: the review image, else a legacy thumbnail. */
export function pickReviewBlob(
    blobs: QueueBlobs | undefined
): Blob | undefined {
    return blobs?.review ?? blobs?.thumbnail;
}

/** Drop the full image, keeping the review image (or legacy thumbnail). */
export async function dropImage(id: string): Promise<void> {
    const s = blobStore();
    if (!s) return;
    const current = await get<QueueBlobs>(id, s);
    if (!current?.image) return;
    const { review, thumbnail } = current;
    if (review || thumbnail) {
        await set(
            id,
            {
                ...(review ? { review } : {}),
                ...(thumbnail ? { thumbnail } : {}),
            },
            s
        );
    } else await del(id, s);
}

export async function deleteBlobs(ids: string[]): Promise<void> {
    const s = blobStore();
    if (!s || ids.length === 0) return;
    await delMany(ids, s);
}
