'use client';

import { usePathname } from 'next/navigation';
import ScanCard from '@/components/ScanCard';
import { isQueueRoute } from '@/lib/addRoutes';

/** Keeps the scanner mounted; the active child route renders beneath it. */
export default function AddCardsShell({
    userId,
    children,
}: {
    userId: string;
    children: React.ReactNode;
}) {
    const onQueue = isQueueRoute(usePathname());
    return (
        <>
            <ScanCard userId={userId} showCamera={!onQueue} />
            {children}
        </>
    );
}
