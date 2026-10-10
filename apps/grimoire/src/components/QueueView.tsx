'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    buttonClasses,
    inputClasses,
    secondaryButtonClasses,
} from '@/components/styles';
import {
    buildIndex,
    searchCards,
    type CardEntry,
    type CardIndex,
} from '@/lib/cardSearch';
import { describeProblem, groupQueue, planCommit } from '@/lib/queueReview';
import { discardCopy } from '@/lib/discardMessage';
import { useCardNames, useCommitQueue } from '@/lib/queries';
import { getBlobs } from '@/lib/scanQueueBlobs';
import type { QueueItem } from '@/lib/scanQueueTypes';
import { useScanQueue } from '@/lib/useScanQueue';

function Thumbnail({ id }: { id: string }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;
        void getBlobs(id).then((blobs) => {
            if (cancelled || !blobs?.thumbnail) return;
            objectUrl = URL.createObjectURL(blobs.thumbnail);
            setUrl(objectUrl);
        });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    return (
        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md border border-border-minimal bg-surface-minimal-hover">
            {url && (
                // eslint-disable-next-line @next/next/no-img-element -- a local blob URL
                <img src={url} alt="" className="h-full w-full object-cover" />
            )}
        </div>
    );
}

function RenameSearch({
    index,
    onPick,
    onCancel,
}: {
    index: CardIndex | null;
    onPick: (card: CardEntry) => void;
    onCancel: () => void;
}) {
    const [query, setQuery] = useState('');
    const results = useMemo(
        () => (index ? searchCards(index, query) : []),
        [index, query]
    );
    return (
        <div className="w-full space-y-2">
            <label htmlFor="rename-search" className="sr-only">
                Card name
            </label>
            <input
                id="rename-search"
                type="search"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                    index ? 'Search the card list' : 'Card list unavailable'
                }
                disabled={!index}
                autoComplete="off"
                className={inputClasses}
            />
            {results.length > 0 && (
                <ul className="divide-y divide-border-minimal overflow-hidden rounded-lg border border-border-minimal bg-surface-minimal">
                    {results.map((card) => (
                        <li key={card.oracleId}>
                            <button
                                type="button"
                                onClick={() => onPick(card)}
                                className="flex min-h-11 w-full items-center px-4 py-2 text-left text-body transition-colors hover:bg-surface-minimal-hover"
                            >
                                {card.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <button
                type="button"
                onClick={onCancel}
                className={secondaryButtonClasses}
            >
                Cancel
            </button>
        </div>
    );
}

interface ItemRowProps {
    item: QueueItem;
    index: CardIndex | null;
    renaming: boolean;
    onStartRename: () => void;
    onCancelRename: () => void;
    onRename: (card: CardEntry) => void;
    onRemove: () => void;
    onRetry: () => void;
}

function ItemRow({
    item,
    index,
    renaming,
    onStartRename,
    onCancelRename,
    onRename,
    onRemove,
    onRetry,
}: ItemRowProps) {
    const needsReview = item.status === 'flagged' || item.status === 'failed';
    const title =
        item.matchedCard?.name ??
        item.readName ??
        (item.status === 'queued' || item.status === 'sending'
            ? 'Waiting to be read'
            : 'Unknown card');
    const label = title;

    return (
        <li className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Thumbnail id={item.id} />
            <div className="min-w-0 flex-1">
                <p className="text-body">{label}</p>
                {needsReview && (
                    <p className="text-caption text-text-minimal">
                        {describeProblem(item)}
                    </p>
                )}
            </div>
            {!renaming && (
                <div className="flex items-center gap-2">
                    {item.status === 'failed' && (
                        <button
                            type="button"
                            onClick={onRetry}
                            aria-label={`Retry ${label}`}
                            className={secondaryButtonClasses}
                        >
                            Retry
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onStartRename}
                        aria-label={`Rename ${label}`}
                        className={secondaryButtonClasses}
                    >
                        Rename
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label={`Remove ${label}`}
                        className={secondaryButtonClasses}
                    >
                        Remove
                    </button>
                </div>
            )}
            {renaming && (
                <RenameSearch
                    index={index}
                    onPick={onRename}
                    onCancel={onCancelRename}
                />
            )}
        </li>
    );
}

export default function QueueView({ userId }: { userId: string }) {
    const { items, ready, store } = useScanQueue(userId);
    const cardNames = useCardNames();
    const commit = useCommitQueue();
    const [renamingId, setRenamingId] = useState<string | null>(null);

    const index = useMemo(
        () => (cardNames.data ? buildIndex(cardNames.data) : null),
        [cardNames.data]
    );
    const groups = useMemo(() => groupQueue(items), [items]);
    const plan = useMemo(() => planCommit(items), [items]);

    const rename = (id: string, card: CardEntry) => {
        store.getState().rename(id, card);
        setRenamingId(null);
    };

    const commitAll = () => {
        // Only what was sent leaves the queue, whatever was added meanwhile.
        const sent = plan.ids;
        commit.mutate(plan.payload, {
            onSuccess: () => store.getState().removeMany(sent),
        });
    };

    const discardText = discardCopy(
        items.length,
        groups.review.length + groups.pending.length
    );
    const discard = () => {
        if (window.confirm(discardText.message)) store.getState().clear();
    };

    const rowProps = (item: QueueItem): ItemRowProps => ({
        item,
        index,
        renaming: renamingId === item.id,
        onStartRename: () => setRenamingId(item.id),
        onCancelRename: () => setRenamingId(null),
        onRename: (card) => rename(item.id, card),
        onRemove: () => {
            if (renamingId === item.id) setRenamingId(null);
            store.getState().remove(item.id);
        },
        onRetry: () => store.getState().retry(item.id),
    });

    const listClasses =
        'divide-y divide-border-minimal rounded-lg border border-border-minimal bg-surface-minimal';

    return (
        <div className="mx-auto max-w-2xl space-y-8 px-4 py-6">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <h1 className="text-section-title">Queue</h1>
                    <p className="text-caption text-text-minimal">
                        Scans waiting to be added. Check them, then commit.
                    </p>
                </div>
                <Link href="/" className={secondaryButtonClasses}>
                    Collection
                </Link>
            </div>

            {!ready && (
                <p className="text-body text-text-minimal">Loading...</p>
            )}
            {ready && items.length === 0 && (
                <p className="text-body text-text-minimal">
                    The queue is empty.
                </p>
            )}

            {groups.review.length > 0 && (
                <section aria-labelledby="review-heading" className="space-y-3">
                    <h2 id="review-heading" className="text-subheading">
                        Needs a look ({groups.review.length})
                    </h2>
                    <ul className={listClasses}>
                        {groups.review.map((item) => (
                            <ItemRow key={item.id} {...rowProps(item)} />
                        ))}
                    </ul>
                </section>
            )}

            {groups.pending.length > 0 && (
                <section
                    aria-labelledby="pending-heading"
                    className="space-y-3"
                >
                    <h2 id="pending-heading" className="text-subheading">
                        Being read ({groups.pending.length})
                    </h2>
                    <ul className={listClasses}>
                        {groups.pending.map((item) => (
                            <ItemRow key={item.id} {...rowProps(item)} />
                        ))}
                    </ul>
                </section>
            )}

            {groups.identified.length > 0 && (
                <section
                    aria-labelledby="identified-heading"
                    className="space-y-3"
                >
                    <h2 id="identified-heading" className="text-subheading">
                        Ready to add ({groups.identified.length})
                    </h2>
                    <ul className={listClasses}>
                        {groups.identified.map((item) => (
                            <ItemRow key={item.id} {...rowProps(item)} />
                        ))}
                    </ul>
                </section>
            )}

            {items.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={commitAll}
                        disabled={plan.count === 0 || commit.isPending}
                        className={buttonClasses}
                    >
                        {commit.isPending
                            ? 'Committing...'
                            : `Commit ${plan.count} ${
                                  plan.count === 1 ? 'card' : 'cards'
                              }`}
                    </button>
                    <button
                        type="button"
                        onClick={discard}
                        disabled={commit.isPending}
                        className={secondaryButtonClasses}
                    >
                        {discardText.label}
                    </button>
                </div>
            )}

            <p role="alert" aria-live="polite" className="text-body text-error">
                {commit.error?.message ?? null}
            </p>
        </div>
    );
}
