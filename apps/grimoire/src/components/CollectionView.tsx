'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ScanCard from '@/components/ScanCard';
import { buttonClasses, inputClasses } from '@/components/styles';
import { readError } from '@/lib/api-client';
import {
    buildIndex,
    searchCards,
    type CardEntry,
    type CardNameFile,
} from '@/lib/card-search';
import type { CollectionItem } from '@/lib/collection';

type CardListState = 'loading' | 'missing' | CardNameFile;

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

function sortItems(items: CollectionItem[]): CollectionItem[] {
    return [...items].sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
}

function withItem(
    items: CollectionItem[],
    item: CollectionItem
): CollectionItem[] {
    return sortItems([
        ...items.filter((existing) => existing.oracleId !== item.oracleId),
        item,
    ]);
}

export default function CollectionView() {
    const [items, setItems] = useState<CollectionItem[] | null>(null);
    const [cardList, setCardList] = useState<CardListState>('loading');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadCollection() {
            const response = await fetch('/api/collection');
            if (response.status === 401) {
                window.location.href = '/signin';
                return;
            }
            if (!response.ok) {
                throw new Error(await readError(response));
            }
            const body = (await response.json()) as { items: CollectionItem[] };
            if (!cancelled) setItems(body.items);
        }

        async function loadCardList() {
            const response = await fetch('/data/card-names.json');
            if (!response.ok) {
                if (!cancelled) setCardList('missing');
                return;
            }
            const file = (await response.json()) as CardNameFile;
            if (!cancelled) setCardList(file);
        }

        loadCollection().catch((e: unknown) => {
            if (!cancelled) {
                setError(
                    e instanceof Error
                        ? e.message
                        : 'Could not load collection.'
                );
                setItems([]);
            }
        });
        loadCardList().catch(() => {
            if (!cancelled) setCardList('missing');
        });

        return () => {
            cancelled = true;
        };
    }, []);

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

    /** Add one copy. Returns whether it worked; failures show in the alert below. */
    const addCard = useCallback(
        async (
            card: CardEntry,
            options: { focusSearch?: boolean } = {}
        ): Promise<boolean> => {
            const { focusSearch = true } = options;
            setBusyId(card.oracleId);
            setError(null);
            try {
                const response = await fetch('/api/collection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        oracleId: card.oracleId,
                        name: card.name,
                    }),
                });
                if (!response.ok) throw new Error(await readError(response));
                const body = (await response.json()) as {
                    item: CollectionItem;
                };
                setItems((current) => withItem(current ?? [], body.item));
                setQuery('');
                if (focusSearch) searchRef.current?.focus();
                return true;
            } catch (e) {
                setError(
                    e instanceof Error ? e.message : 'Could not add card.'
                );
                return false;
            } finally {
                setBusyId(null);
            }
        },
        []
    );

    // Scanning must not pop the keyboard up between cards.
    const addScannedCard = useCallback(
        (card: CardEntry) => addCard(card, { focusSearch: false }),
        [addCard]
    );

    const setQuantity = useCallback(
        async (item: CollectionItem, quantity: number) => {
            setBusyId(item.oracleId);
            setError(null);
            try {
                const response = await fetch(
                    `/api/collection/${item.oracleId}`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quantity }),
                    }
                );
                if (!response.ok) throw new Error(await readError(response));
                const body = (await response.json()) as {
                    item?: CollectionItem;
                    removed?: boolean;
                };
                setItems((current) =>
                    body.item
                        ? withItem(current ?? [], body.item)
                        : (current ?? []).filter(
                              (existing) => existing.oracleId !== item.oracleId
                          )
                );
            } catch (e) {
                setError(
                    e instanceof Error ? e.message : 'Could not update card.'
                );
            } finally {
                setBusyId(null);
            }
        },
        []
    );

    const removeCard = useCallback(
        (item: CollectionItem) => {
            if (window.confirm(`Remove ${item.name} from your collection?`)) {
                void setQuantity(item, 0);
            }
        },
        [setQuantity]
    );

    return (
        <div className="mx-auto max-w-2xl space-y-10 px-4 py-6">
            <section aria-labelledby="add-heading" className="space-y-3">
                <h2 id="add-heading" className="text-subheading">
                    Add a card
                </h2>
                <ScanCard index={index} onAdd={addScannedCard} />
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
                                    onClick={() => void addCard(card)}
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
                                                void setQuantity(
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
                                                void setQuantity(
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
