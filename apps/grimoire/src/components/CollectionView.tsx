'use client';

import { useMemo, useState } from 'react';
import AddCardDialog from '@/components/AddCardDialog';
import {
    buttonClasses,
    inputClasses,
    secondaryButtonClasses,
} from '@/components/styles';
import { buildIndex } from '@/lib/cardSearch';
import type { CollectionItem } from '@/lib/collection';
import { useCardNames, useCollection, useSetQuantity } from '@/lib/queries';

export default function CollectionView() {
    const [filter, setFilter] = useState('');
    const [adding, setAdding] = useState(false);

    const collection = useCollection();
    const cardNames = useCardNames();
    const setQuantityMutation = useSetQuantity();

    // null while loading; a failed load shows the error and an empty list.
    const items = useMemo(
        () => collection.data ?? (collection.isError ? [] : null),
        [collection.data, collection.isError]
    );
    const cardList = cardNames.isError
        ? 'missing'
        : cardNames.isPending
          ? 'loading'
          : cardNames.data;

    const error =
        setQuantityMutation.error?.message ?? collection.error?.message ?? null;

    const busyId =
        (setQuantityMutation.isPending &&
            setQuantityMutation.variables.item.oracleId) ||
        null;

    const index = useMemo(
        () =>
            cardList === 'loading' || cardList === 'missing'
                ? null
                : buildIndex(cardList),
        [cardList]
    );

    const visibleItems = useMemo(() => {
        const needle = filter.trim().toLowerCase();
        if (!items) return [];
        return needle
            ? items.filter((item) => item.name.toLowerCase().includes(needle))
            : items;
    }, [items, filter]);

    const totalCards = useMemo(
        () => (items ?? []).reduce((sum, item) => sum + item.quantity, 0),
        [items]
    );

    const setQuantity = (item: CollectionItem, quantity: number) => {
        setQuantityMutation.mutate({ item, quantity });
    };

    const removeCard = (item: CollectionItem) => {
        if (window.confirm(`Remove ${item.name} from your collection?`)) {
            setQuantity(item, 0);
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-10 px-4 py-6">
            <section aria-labelledby="collection-heading" className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h2 id="collection-heading" className="text-subheading">
                            Your collection
                        </h2>
                        {items && (
                            <p className="text-caption text-text-minimal">
                                {items.length} unique, {totalCards} total
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setAdding(true)}
                            className={secondaryButtonClasses}
                        >
                            Add Cards
                        </button>
                        <a
                            href="/api/export"
                            download="grimoire-collection.txt"
                            className={buttonClasses}
                        >
                            Export
                        </a>
                    </div>
                </div>

                <label htmlFor="collection-filter" className="sr-only">
                    Filter your collection
                </label>
                <input
                    id="collection-filter"
                    type="search"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder="Filter your collection"
                    autoComplete="off"
                    className={inputClasses}
                />

                {items === null && (
                    <p className="text-body text-text-minimal">Loading...</p>
                )}
                {items !== null && items.length === 0 && (
                    <p className="text-body text-text-minimal">
                        Nothing here yet. Use Add Cards to add your first card.
                    </p>
                )}
                {items !== null &&
                    items.length > 0 &&
                    visibleItems.length === 0 && (
                        <p className="text-body text-text-minimal">
                            No cards match that filter.
                        </p>
                    )}

                {visibleItems.length > 0 && (
                    <ul className="divide-y divide-border-minimal rounded-lg border border-border-minimal bg-surface-minimal">
                        {visibleItems.map((item) => {
                            const busy = busyId === item.oracleId;
                            return (
                                <li
                                    key={item.oracleId}
                                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                                >
                                    <span className="min-w-0 flex-1 text-body">
                                        {item.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            aria-label={`Remove one ${item.name}`}
                                            disabled={
                                                busy || item.quantity <= 1
                                            }
                                            onClick={() =>
                                                setQuantity(
                                                    item,
                                                    item.quantity - 1
                                                )
                                            }
                                            className={buttonClasses}
                                        >
                                            −
                                        </button>
                                        <span
                                            className="min-w-8 text-center text-body font-medium"
                                            aria-label={`${item.quantity} owned`}
                                        >
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Add one ${item.name}`}
                                            disabled={busy}
                                            onClick={() =>
                                                setQuantity(
                                                    item,
                                                    item.quantity + 1
                                                )
                                            }
                                            className={buttonClasses}
                                        >
                                            +
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${item.name} from collection`}
                                            disabled={busy}
                                            onClick={() => removeCard(item)}
                                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-minimal px-3 text-caption transition-colors hover:bg-surface-minimal-hover disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <p role="alert" aria-live="polite" className="text-body text-error">
                {error}
            </p>

            {adding && (
                <AddCardDialog
                    index={index}
                    missing={cardList === 'missing'}
                    onClose={() => setAdding(false)}
                />
            )}
        </div>
    );
}
