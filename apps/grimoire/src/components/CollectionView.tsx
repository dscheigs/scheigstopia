'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import CardDetailDialog from '@/components/CardDetailDialog';
import CatalogResults from '@/components/CatalogResults';
import CollectionList from '@/components/CollectionList';
import ExportMenu from '@/components/ExportMenu';
import { Search, Spinner } from '@scheigs/sylva-ui';
import { useCollectionSearch } from '@/lib/useCollectionSearch';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useUrlDialogState } from '@/lib/useUrlDialogState';
import { buildImageIds } from '@/lib/cardImages';
import { buildIndex } from '@/lib/cardSearch';
import type { CollectionItem } from '@/lib/collection';
import { useCardNames, useCollection, useSetQuantity } from '@/lib/queries';

/** The same settle time as the card-list search used before. */
const SEARCH_DEBOUNCE_MS = 150;

export default function CollectionView() {
    const [query, setQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);
    const detail = useUrlDialogState('card');

    const collection = useCollection();
    const cardNames = useCardNames();
    // Two mutations so a failed quantity save is reported in the sheet (by
    // its counter) and a failed Remove is reported by the global toast.
    const saveQuantityMutation = useSetQuantity({ reportInline: true });
    const removeMutation = useSetQuantity();

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

    // Mutation errors are toasts; a failed load stays on the page.
    const error = collection.error?.message ?? null;

    const index = useMemo(
        () =>
            cardList === 'loading' || cardList === 'missing'
                ? null
                : buildIndex(cardList),
        [cardList]
    );

    // oracleId -> Scryfall image id; empty until the card list loads.
    const imageIds = useMemo(
        () =>
            cardList === 'loading' || cardList === 'missing'
                ? new Map<string, string>()
                : buildImageIds(cardList),
        [cardList]
    );

    // One debounced query feeds both searches: the owned cards (with their own
    // index, so it works before the card list loads) and the catalog below.
    const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
    const search = useCollectionSearch(items ?? [], debouncedQuery);
    const visibleItems = search.results;
    const ownedIds = useMemo(
        () => new Set((items ?? []).map((item) => item.oracleId)),
        [items]
    );
    const cardListState =
        cardList === 'loading' || cardList === 'missing' ? cardList : 'ready';

    const totalCards = useMemo(
        () => (items ?? []).reduce((sum, item) => sum + item.quantity, 0),
        [items]
    );

    const saveQuantity = (item: CollectionItem, quantity: number) =>
        saveQuantityMutation.mutateAsync({ item, quantity });

    // Only the id is kept; the card is looked up on each render, so a quantity
    // change shows in the open sheet at once and a removed card closes it.
    const selected =
        detail.value === null
            ? undefined
            : items?.find((item) => item.oracleId === detail.value);

    // A card that is gone (removed, or from a stale link) leaves nothing to
    // show, so drop the selection and its address parameter.
    const { value: selectedId, close: closeDetail } = detail;
    const missing = items !== null && selectedId !== null && !selected;
    useEffect(() => {
        if (missing) closeDetail();
    }, [missing, closeDetail]);

    return (
        <div className="mx-auto max-w-5xl space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
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
                    <ExportMenu />
                </div>

                <label htmlFor="collection-search" className="sr-only">
                    Search your collection and all cards
                </label>
                <Search
                    id="collection-search"
                    ref={searchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search"
                />

                {items === null && (
                    <div className="flex justify-center">
                        <Spinner className="text-text-minimal" />
                    </div>
                )}
                {items !== null && items.length === 0 && (
                    <p className="text-body text-text-minimal">
                        Nothing here yet. Search for a card to add it.
                    </p>
                )}
                {items !== null &&
                    items.length > 0 &&
                    visibleItems.length === 0 && (
                        <p className="text-body text-text-minimal">
                            No cards in your collection match.
                        </p>
                    )}

                {visibleItems.length > 0 && (
                    <CollectionList
                        items={visibleItems}
                        imageIds={imageIds}
                        onOpen={(item) => detail.show(item.oracleId)}
                    />
                )}

                {/* Below the list, never above it: the list measures its offset
                    from the page top once, so nothing above may change height. */}
                <CatalogResults
                    query={debouncedQuery}
                    index={index}
                    cardListState={cardListState}
                    ownedIds={ownedIds}
                    imageIds={imageIds}
                    onAdded={() => searchRef.current?.focus()}
                />
            </section>

            <p role="alert" aria-live="polite" className="text-body text-error">
                {error}
            </p>

            <CardDetailDialog
                item={selected}
                imageId={selected && imageIds.get(selected.oracleId)}
                onSaveQuantity={saveQuantity}
                onRemove={(item) =>
                    removeMutation.mutate({ item, quantity: 0 })
                }
                onClose={detail.close}
            />
        </div>
    );
}
