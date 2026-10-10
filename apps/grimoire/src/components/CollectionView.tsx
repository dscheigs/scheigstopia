'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ScanCard from '@/components/ScanCard';
import { buttonClasses, inputClasses } from '@/components/styles';
import { buildIndex, searchCards, type CardEntry } from '@/lib/cardSearch';
import type { CollectionItem } from '@/lib/collection';
import {
    useAddCard,
    useCardNames,
    useCollection,
    useSetQuantity,
} from '@/lib/queries';

const SEARCH_DEBOUNCE_MS = 150;

/** `value`, but only after it has stopped changing for `delayMs`. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return debounced;
}

export default function CollectionView({ userId }: { userId: string }) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const collection = useCollection();
    const cardNames = useCardNames();
    const addCardMutation = useAddCard();
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
        addCardMutation.error?.message ??
        setQuantityMutation.error?.message ??
        collection.error?.message ??
        null;

    const busyId =
        (addCardMutation.isPending && addCardMutation.variables.oracleId) ||
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
    const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
    const results = useMemo(
        () => (index ? searchCards(index, debouncedQuery) : []),
        [index, debouncedQuery]
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

    // A new action clears the last one's error.
    const addCard = (card: CardEntry) => {
        setQuantityMutation.reset();
        addCardMutation.mutate(card, {
            onSuccess: () => {
                setQuery('');
                searchRef.current?.focus();
            },
        });
    };

    const setQuantity = (item: CollectionItem, quantity: number) => {
        addCardMutation.reset();
        setQuantityMutation.mutate({ item, quantity });
    };

    const removeCard = (item: CollectionItem) => {
        if (window.confirm(`Remove ${item.name} from your collection?`)) {
            setQuantity(item, 0);
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-10 px-4 py-6">
            <section aria-labelledby="add-heading" className="space-y-3">
                <h2 id="add-heading" className="text-subheading">
                    Add a card
                </h2>
                <ScanCard userId={userId} />
                <label htmlFor="card-search" className="sr-only">
                    Card name
                </label>
                <input
                    id="card-search"
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Start typing a card name"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={cardList === 'loading' || cardList === 'missing'}
                    className={inputClasses}
                />
                {cardList === 'missing' && (
                    <p className="text-caption text-text-minimal">
                        The card list has not been built yet. Run{' '}
                        <code className="font-mono">
                            pnpm nx run grimoire:card-names
                        </code>{' '}
                        and reload.
                    </p>
                )}
                {results.length > 0 && (
                    <ul className="divide-y divide-border-minimal overflow-hidden rounded-lg border border-border-minimal bg-surface-minimal">
                        {results.map((card) => (
                            <li key={card.oracleId}>
                                <button
                                    type="button"
                                    onClick={() => addCard(card)}
                                    disabled={busyId === card.oracleId}
                                    className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-body transition-colors hover:bg-surface-minimal-hover disabled:opacity-50"
                                >
                                    <span>{card.name}</span>
                                    <span className="text-caption text-text-minimal">
                                        Add
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {index &&
                    debouncedQuery.trim().length >= 2 &&
                    results.length === 0 && (
                        <p className="text-caption text-text-minimal">
                            No matching cards.
                        </p>
                    )}
            </section>

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
                    <a
                        href="/api/export"
                        download="grimoire-collection.txt"
                        className={buttonClasses}
                    >
                        Export
                    </a>
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
                        Nothing here yet. Search above to add your first card.
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
        </div>
    );
}
