import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { getBlobs, putBlobs } from '@/lib/scanQueueBlobs';
import {
    clearQueueForUser,
    createScanQueueStore,
    getScanQueueStore,
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
