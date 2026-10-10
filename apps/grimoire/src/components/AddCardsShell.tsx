'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ScanCard from '@/components/ScanCard';
import { ADD_PATH, ADD_QUEUE_PATH, isQueueRoute } from '@/lib/addRoutes';
import { queueCounts } from '@/lib/queueReview';
import { useScanQueue } from '@/lib/useScanQueue';

/** Keeps the scanner mounted; the active child route renders beneath it. */
export default function AddCardsShell({
    userId,
    children,
}: {
    userId: string;
    children: React.ReactNode;
}) {
    const onQueue = isQueueRoute(usePathname());
    const { items } = useScanQueue(userId);
    const { total, review } = queueCounts(items);
    const segment =
        'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-body font-medium transition-colors';
    const on =
        'bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900';
    const off = 'hover:bg-surface-minimal-hover';
    const queueLabel =
        `Queue, ${total} ${total === 1 ? 'card' : 'cards'}` +
        (review > 0 ? `, ${review} need review` : '');
    return (
        <>
            <nav aria-label="Add cards" className="mx-auto max-w-2xl px-4 pt-4">
                <div className="flex w-full gap-1 rounded-lg border border-border-minimal bg-surface-minimal p-1">
                    <Link
                        href={ADD_PATH}
                        aria-current={onQueue ? undefined : 'page'}
                        className={`${segment} ${onQueue ? off : on}`}
                    >
                        Camera
                    </Link>
                    <Link
                        href={ADD_QUEUE_PATH}
                        aria-current={onQueue ? 'page' : undefined}
                        aria-label={queueLabel}
                        className={`${segment} ${onQueue ? on : off}`}
                    >
                        Queue
                        <span aria-hidden="true">{total}</span>
                        {review > 0 && (
                            <span
                                aria-hidden="true"
                                className="text-caption font-medium"
                            >
                                ({review} to review)
                            </span>
                        )}
                    </Link>
                </div>
            </nav>
            <ScanCard userId={userId} showCamera={!onQueue} />
            {children}
        </>
    );
}
