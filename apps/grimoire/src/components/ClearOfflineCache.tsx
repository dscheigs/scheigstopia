'use client';

import { useEffect } from 'react';
import { clearOfflineCaches } from '@/lib/offlineCache';

/** On the sign-in page: drops the offline copies left by the last session. */
export default function ClearOfflineCache() {
    useEffect(() => {
        void clearOfflineCaches('caches' in window ? caches : undefined);
    }, []);
    return null;
}
