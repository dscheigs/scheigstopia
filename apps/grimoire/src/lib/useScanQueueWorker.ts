// Runs the scan queue worker for the scan session and exposes queue counts.

import { useEffect, useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import { ApiError } from '@/lib/apiClient';
import { buildIndex } from '@/lib/cardSearch';
import { identifyPhoto, useCardNames } from '@/lib/queries';
import { getBlobs } from '@/lib/scanQueueBlobs';
import { getScanQueueStore } from '@/lib/scanQueueStore';
import {
    countQueue,
    createScanQueueWorker,
    IdentifyCallError,
    type QueueCounts,
    type ScanQueueWorker,
} from '@/lib/scanQueueWorker';

async function identifyForQueue(photo: Blob) {
    try {
        return await identifyPhoto(photo);
    } catch (error) {
        if (error instanceof ApiError) {
            if (error.status === 429) {
                throw new IdentifyCallError({
                    kind: 'rate-limit',
                    retryAfterMs: error.retryAfterMs,
                });
            }
            // Signed out: keep the scan and retry once signed back in.
            if (error.status === 401) {
                throw new IdentifyCallError({ kind: 'network' });
            }
            throw new IdentifyCallError({ kind: 'error' });
        }
        // fetch itself rejected: offline or dropped connection.
        throw new IdentifyCallError({ kind: 'network' });
    }
}

/** Start the background worker for `userId`; returns counts for the UI. */
export function useScanQueueWorker(userId: string): QueueCounts {
    const store = getScanQueueStore(userId);
    const items = useStore(store, (s) => s.items);
    const counts = useMemo(() => countQueue(items), [items]);

    const { data: cardNames } = useCardNames();
    const index = useMemo(
        () => (cardNames ? buildIndex(cardNames) : null),
        [cardNames]
    );
    const indexRef = useRef(index);
    const workerRef = useRef<ScanQueueWorker | null>(null);

    useEffect(() => {
        indexRef.current = index;
        workerRef.current?.poke();
    }, [index]);

    useEffect(() => {
        const worker = createScanQueueWorker({
            store,
            identify: identifyForQueue,
            getImage: async (id) => (await getBlobs(id))?.image,
            getIndex: () => indexRef.current,
            isOnline: () => navigator.onLine,
        });
        workerRef.current = worker;
        worker.start();
        const onOnline = () => worker.poke();
        window.addEventListener('online', onOnline);
        return () => {
            window.removeEventListener('online', onOnline);
            worker.stop();
            workerRef.current = null;
        };
    }, [store]);

    return counts;
}
