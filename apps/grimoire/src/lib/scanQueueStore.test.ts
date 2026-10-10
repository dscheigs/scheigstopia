import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { getBlobs, pickReviewBlob, putBlobs } from '@/lib/scanQueueBlobs';
import {
    clearQueueForUser,
    createScanQueueStore,
    getScanQueueStore,
    QUEUE_ITEM_TTL_MS,
    requestPersistentStorage,
} from '@/lib/scanQueueStore';

const blob = (text: string) => new Blob([text]);

/** A fresh store for the same user, as after a page reload. */
async function reload(userId: string) {
    const store = createScanQueueStore(userId);
    await store.persist.rehydrate();
    return store;
}

describe('scan queue store', () => {
    it('adds items with defaults and updates them', () => {
        const store = createScanQueueStore('defaults');
        const item = store.getState().add();
        expect(item).toMatchObject({
            status: 'queued',
            flagReason: 'none',
            attempts: 0,
            readName: null,
            matchedCard: null,
            nextAttemptAt: null,
        });
        store.getState().update(item.id, { status: 'sending', attempts: 1 });
        expect(store.getState().items[0]).toMatchObject({
            id: item.id,
            status: 'sending',
            attempts: 1,
        });
    });

    it('retry requeues a flagged item and clear empties the queue', () => {
        const store = createScanQueueStore('retry');
        const item = store.getState().add({
            status: 'flagged',
            flagReason: 'no-match',
            nextAttemptAt: 5,
        });
        store.getState().retry(item.id);
        expect(store.getState().items[0]).toMatchObject({
            status: 'queued',
            flagReason: 'none',
            nextAttemptAt: null,
        });
        store.getState().clear();
        expect(store.getState().items).toEqual([]);
    });

    it('survives a reload and requeues items caught mid-send', async () => {
        const first = createScanQueueStore('reload');
        const a = first.getState().add({ readName: 'Llanowar Elves' });
        const b = first.getState().add({ status: 'sending' });
        await vi.waitFor(async () => {
            const again = await reload('reload');
            expect(again.getState().items).toHaveLength(2);
        });
        const again = await reload('reload');
        const items = again.getState().items;
        expect(items.find((i) => i.id === a.id)?.readName).toBe(
            'Llanowar Elves'
        );
        expect(items.find((i) => i.id === b.id)?.status).toBe('queued');
    });

    it('keeps queues separate per user', async () => {
        const mine = createScanQueueStore('user-a');
        mine.getState().add();
        await vi.waitFor(async () => {
            expect((await reload('user-a')).getState().items).toHaveLength(1);
        });
        expect((await reload('user-b')).getState().items).toEqual([]);
    });

    it('deletes blobs when an item is removed or cleared', async () => {
        const store = createScanQueueStore('blobs-remove');
        const a = store.getState().add();
        const b = store.getState().add();
        await putBlobs(a.id, { thumbnail: blob('t'), image: blob('i') });
        await putBlobs(b.id, { thumbnail: blob('t') });

        store.getState().remove(a.id);
        await vi.waitFor(async () =>
            expect(await getBlobs(a.id)).toBeUndefined()
        );
        expect(await getBlobs(b.id)).toBeDefined();

        store.getState().clear();
        await vi.waitFor(async () =>
            expect(await getBlobs(b.id)).toBeUndefined()
        );
    });

    it('drops the full image but keeps the thumbnail once identified', async () => {
        const store = createScanQueueStore('blobs-identified');
        const item = store.getState().add();
        await putBlobs(item.id, { thumbnail: blob('t'), image: blob('i') });

        store.getState().update(item.id, { status: 'identified' });
        await vi.waitFor(async () => {
            const blobs = await getBlobs(item.id);
            expect(blobs?.image).toBeUndefined();
        });
        expect((await getBlobs(item.id))?.thumbnail).toBeDefined();
    });

    it('keeps the review image and drops the full one once identified', async () => {
        const store = createScanQueueStore('blobs-review');
        const item = store.getState().add();
        await putBlobs(item.id, { review: blob('r'), image: blob('i') });

        store.getState().update(item.id, { status: 'identified' });
        await vi.waitFor(async () => {
            expect((await getBlobs(item.id))?.image).toBeUndefined();
        });
        const kept = await getBlobs(item.id);
        expect(kept?.review).toBeDefined();
        expect(pickReviewBlob(kept)).toBe(kept?.review);
    });

    it('removes review images with remove, removeMany and clear', async () => {
        const store = createScanQueueStore('blobs-review-cleanup');
        const a = store.getState().add();
        const b = store.getState().add();
        const c = store.getState().add();
        for (const i of [a, b, c]) await putBlobs(i.id, { review: blob('r') });

        store.getState().remove(a.id);
        store.getState().removeMany([b.id]);
        await vi.waitFor(async () => {
            expect(await getBlobs(a.id)).toBeUndefined();
            expect(await getBlobs(b.id)).toBeUndefined();
        });
        store.getState().clear();
        await vi.waitFor(async () =>
            expect(await getBlobs(c.id)).toBeUndefined()
        );
    });

    it('falls back to the legacy thumbnail when there is no review image', () => {
        const thumbnail = blob('t');
        const review = blob('r');
        expect(pickReviewBlob({ thumbnail })).toBe(thumbnail);
        expect(pickReviewBlob({ thumbnail, review })).toBe(review);
        expect(pickReviewBlob(undefined)).toBeUndefined();
    });

    it('keeps a legacy thumbnail through dropping the full image', async () => {
        const store = createScanQueueStore('blobs-legacy');
        const item = store.getState().add();
        await putBlobs(item.id, { thumbnail: blob('t'), image: blob('i') });
        store.getState().update(item.id, { status: 'identified' });
        await vi.waitFor(async () => {
            expect((await getBlobs(item.id))?.image).toBeUndefined();
        });
        expect(pickReviewBlob(await getBlobs(item.id))).toBeDefined();
    });

    it('clears items, blobs and the persisted copy on sign-out', async () => {
        const store = getScanQueueStore('sign-out');
        const item = store.getState().add();
        await putBlobs(item.id, { thumbnail: blob('t') });
        await vi.waitFor(async () => {
            expect((await reload('sign-out')).getState().items).toHaveLength(1);
        });

        await clearQueueForUser('sign-out');
        expect(await getBlobs(item.id)).toBeUndefined();
        expect((await reload('sign-out')).getState().items).toEqual([]);
    });
});

describe('confirming', () => {
    const bolt = { oracleId: 'bolt', name: 'Lightning Bolt' };
    const elves = { oracleId: 'elves', name: 'Llanowar Elves' };

    it('moves a flagged item to identified and keeps the reason', () => {
        const store = createScanQueueStore('confirm');
        const item = store.getState().add({
            status: 'flagged',
            flagReason: 'fuzzy-match',
            matchedCard: bolt,
        });
        store.getState().confirm(item.id);
        expect(store.getState().items[0]).toMatchObject({
            status: 'identified',
            flagReason: 'none',
            confirmed: true,
            originalFlagReason: 'fuzzy-match',
        });
    });

    it('ignores items that do not need review or have no card', () => {
        const store = createScanQueueStore('confirm-ignored');
        const ok = store
            .getState()
            .add({ status: 'identified', matchedCard: bolt });
        const noCard = store
            .getState()
            .add({ status: 'flagged', flagReason: 'no-match' });
        store.getState().confirm(ok.id);
        store.getState().confirm(noCard.id);
        const [a, b] = store.getState().items;
        expect(a.confirmed).toBeUndefined();
        expect(b).toMatchObject({ status: 'flagged', flagReason: 'no-match' });
        expect(b.confirmed).toBeUndefined();
    });

    it('treats editing the name of a flagged item as confirming', () => {
        const store = createScanQueueStore('rename-confirms');
        const item = store
            .getState()
            .add({ status: 'flagged', flagReason: 'no-match' });
        store.getState().rename(item.id, elves);
        expect(store.getState().items[0]).toMatchObject({
            status: 'identified',
            matchedCard: elves,
            confirmed: true,
            originalFlagReason: 'no-match',
        });
    });

    it('persists, and loads items saved without the new fields', async () => {
        const store = createScanQueueStore('confirm-persist');
        const old = store
            .getState()
            .add({ status: 'identified', matchedCard: bolt });
        const flagged = store.getState().add({
            status: 'flagged',
            flagReason: 'ambiguous',
            matchedCard: elves,
        });
        store.getState().confirm(flagged.id);
        await vi.waitFor(async () => {
            const items = (await reload('confirm-persist')).getState().items;
            expect(items.find((i) => i.id === flagged.id)?.confirmed).toBe(
                true
            );
        });
        const items = (await reload('confirm-persist')).getState().items;
        expect(items.find((i) => i.id === old.id)).toMatchObject({
            status: 'identified',
        });
        expect(items.find((i) => i.id === old.id)?.confirmed).toBeUndefined();
    });
});

describe('queue expiry', () => {
    it('drops items older than the TTL when the queue loads', async () => {
        const now = Date.now();
        const store = createScanQueueStore('ttl');
        const stale = store
            .getState()
            .add({ createdAt: now - QUEUE_ITEM_TTL_MS - 1000 });
        const fresh = store
            .getState()
            .add({ createdAt: now - QUEUE_ITEM_TTL_MS + 60_000 });
        await putBlobs(stale.id, { thumbnail: blob('t') });
        await vi.waitFor(async () => {
            expect((await reload('ttl')).getState().items).toHaveLength(1);
        });
        const items = (await reload('ttl')).getState().items;
        expect(items.map((i) => i.id)).toEqual([fresh.id]);
        await vi.waitFor(async () =>
            expect(await getBlobs(stale.id)).toBeUndefined()
        );
    });

    it('removeMany drops several items and their blobs', async () => {
        const store = createScanQueueStore('remove-many');
        const a = store.getState().add();
        const b = store.getState().add();
        const c = store.getState().add();
        await putBlobs(a.id, { thumbnail: blob('t') });
        store.getState().removeMany([a.id, b.id]);
        expect(store.getState().items.map((i) => i.id)).toEqual([c.id]);
        await vi.waitFor(async () =>
            expect(await getBlobs(a.id)).toBeUndefined()
        );
    });
});

describe('requestPersistentStorage', () => {
    it('reports false where the API is missing', async () => {
        expect(await requestPersistentStorage()).toBe(false);
    });

    it('reports whether the browser granted persistence', async () => {
        const persist = vi.fn().mockResolvedValue(true);
        vi.stubGlobal('navigator', {
            storage: { persisted: async () => false, persist },
        });
        expect(await requestPersistentStorage()).toBe(true);
        expect(persist).toHaveBeenCalled();
        vi.unstubAllGlobals();
    });
});
