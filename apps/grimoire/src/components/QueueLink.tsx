'use client';

import Link from 'next/link';
import { useQueueCount } from '@/lib/useScanQueue';

/** Header link to the queue screen, with the number of waiting items. */
export default function QueueLink({ userId }: { userId: string }) {
    const count = useQueueCount(userId);
    return (
        <Link
            href="/queue"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-body font-medium transition-colors hover:bg-surface-hover"
        >
            Queue
            {count > 0 && (
                <span
                    aria-label={`${count} in queue`}
                    className="rounded-full bg-neutral-800 px-2 text-caption text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900"
                >
                    {count}
                </span>
            )}
        </Link>
    );
}
