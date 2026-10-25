'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QueueView from '@/components/QueueView';
import ScanCard from '@/components/ScanCard';
import { initialAddView } from '@/lib/addRoutes';
import { queueCounts } from '@/lib/queueReview';
import { useScanQueue } from '@/lib/useScanQueue';

/**
 * Keeps the scanner mounted and switches between the camera and the queue as
 * state, not a route, so no page transition plays when you flip between them.
 */
export default function AddCardsShell({ userId }: { userId: string }) {
    const params = useSearchParams();
    const [view, setView] = useState(() => initialAddView(params.get('view')));
    const onQueue = view === 'queue';
    const { items } = useScanQueue(userId);
    const { total, review } = queueCounts(items);
    const segment =
        'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-button px-3 text-body font-medium transition-colors';
    const on =
        'bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900';
    const off = 'hover:bg-surface-minimal-hover';
    const queueLabel =
        `Queue, ${total} ${total === 1 ? 'card' : 'cards'}` +
        (review > 0 ? `, ${review} need review` : '');
    return (
        <>
            <nav aria-label="Add cards" className="mx-auto max-w-2xl px-4 pt-4">
                <div className="flex w-full gap-1 rounded-button border border-border-minimal bg-surface-minimal p-1">
                    <button
                        type="button"
                        onClick={() => setView('camera')}
                        aria-pressed={!onQueue}
                        className={`${segment} ${onQueue ? off : on}`}
                    >
                        Camera
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('queue')}
                        aria-pressed={onQueue}
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
                    </button>
                </div>
            </nav>
            <ScanCard userId={userId} showCamera={!onQueue} />
            {onQueue && <QueueView userId={userId} />}
        </>
    );
}
