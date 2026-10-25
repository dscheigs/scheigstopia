'use client';

import { useEffect } from 'react';
import {
    clearOfflineCaches,
    registerServiceWorker,
    unregisterServiceWorkers,
} from '@/lib/offlineCache';
import { requestPersistentStorage } from '@/lib/persistentStorage';

/**
 * Registers the service worker (offline shell) and asks the browser to keep
 * this app's storage. Renders nothing.
 *
 * Only in a production build: under `next dev` the build file URLs stay the
 * same while their contents change, so the worker's saved copies would break
 * the page ("module factory is not available"). In development this removes
 * any worker and copies an earlier run left behind instead.
 */
export default function PwaSetup() {
    useEffect(() => {
        const worker =
            'serviceWorker' in navigator ? navigator.serviceWorker : undefined;
        if (process.env.NODE_ENV === 'production') {
            void registerServiceWorker('/sw.js', '/', worker);
        } else {
            void unregisterServiceWorkers(worker);
            void clearOfflineCaches(
                typeof caches === 'undefined' ? undefined : caches
            );
        }
        void requestPersistentStorage(navigator.storage);
    }, []);
    return null;
}
