'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/offlineCache';
import { requestPersistentStorage } from '@/lib/persistentStorage';

/**
 * Registers the service worker (offline shell) and asks the browser to keep
 * this app's storage. Renders nothing.
 */
export default function PwaSetup() {
    useEffect(() => {
        void registerServiceWorker(
            '/sw.js',
            '/',
            'serviceWorker' in navigator ? navigator.serviceWorker : undefined
        );
        void requestPersistentStorage(navigator.storage);
    }, []);
    return null;
}
