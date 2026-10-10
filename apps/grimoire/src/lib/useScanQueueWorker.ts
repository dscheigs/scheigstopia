// Runs the scan queue worker for the scan session and exposes queue counts.

import { useEffect, useMemo, useRef, useState } from 'react';
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
            // Signed out: the worker pauses and keeps every scan queued.
            if (error.status === 401) {
                throw new IdentifyCallError({ kind: 'unauthorized' });
            }
            throw new IdentifyCallError({ kind: 'error' });
        }
        // fetch itself rejected: offline or dropped connection.
        throw new IdentifyCallError({ kind: 'network' });
    }
}

/**
 * Start the background worker for `userId`; returns counts for the UI and
 * whether it is paused because the session expired.
 *
 * Lifetime: the worker lives as long as the component using this hook, which
 * is the Add Cards layout (camera and queue screens). Leaving /add stops it;
 * queued items stay in IndexedDB and resume when the user comes back.
 */
export function useScanQueueWorker(userId: string): {
    counts: QueueCounts;
    sessionExpired: boolean;
} {
    const store = getScanQueueStore(userId);
    const items = useStore(store, (s) => s.items);
    const counts = useMemo(() => countQueue(items), [items]);
    const [sessionExpired, setSessionExpired] = useState(false);

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
            onAuthChange: setSessionExpired,
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

    return { counts, sessionExpired };
}
