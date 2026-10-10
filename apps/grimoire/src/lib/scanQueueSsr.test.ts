import { describe, expect, it } from 'vitest';
import { getBlobs, putBlobs } from '@/lib/scanQueueBlobs';
import { createScanQueueStore } from '@/lib/scanQueueStore';

// No fake-indexeddb here: this file runs as the server would, without IndexedDB.
describe('scan queue without IndexedDB (server render)', () => {
    it('works in memory and never touches IndexedDB', async () => {
        expect(typeof indexedDB).toBe('undefined');
        const store = createScanQueueStore('ssr');
        const item = store.getState().add();
        store.getState().remove(item.id);
        await putBlobs('x', { thumbnail: new Blob(['t']) });
        expect(await getBlobs('x')).toBeUndefined();
        expect(store.getState().items).toEqual([]);
    });
});
