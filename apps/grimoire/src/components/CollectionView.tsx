'use client';

import { useEffect, useMemo, useState } from 'react';
import AddCardDialog from '@/components/AddCardDialog';
import CardDetailDialog from '@/components/CardDetailDialog';
import CollectionList from '@/components/CollectionList';
import ExportMenu from '@/components/ExportMenu';
import { Button, Search, Spinner } from '@scheigs/sylva-ui';
import { useUrlDialogState } from '@/lib/useUrlDialogState';
import { buildImageIds } from '@/lib/cardImages';
import { buildIndex } from '@/lib/cardSearch';
import type { CollectionItem } from '@/lib/collection';
import { useCardNames, useCollection, useSetQuantity } from '@/lib/queries';

export default function CollectionView() {
    const [filter, setFilter] = useState('');
    const [adding, setAdding] = useState(false);
    const detail = useUrlDialogState('card');

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

    // oracleId -> Scryfall image id; empty until the card list loads.
    const imageIds = useMemo(
        () =>
            cardList === 'loading' || cardList === 'missing'
                ? new Map<string, string>()
                : buildImageIds(cardList),
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
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setAdding(true)}
                            variant="secondary"
                        >
                            Add Cards
                        </Button>
                        <ExportMenu />
                    </div>
                </div>

                <label htmlFor="collection-filter" className="sr-only">
                    Filter your collection
                </label>
                <Search
                    id="collection-filter"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder="Filter your collection"
                />

                {items === null && (
                    <div className="flex justify-center">
                        <Spinner className="text-text-minimal" />
                    </div>
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
                    <CollectionList
                        items={visibleItems}
                        imageIds={imageIds}
                        onOpen={(item) => detail.show(item.oracleId)}
                    />
                )}
            </section>

            <p role="alert" aria-live="polite" className="text-body text-error">
                {error}
            </p>

            <CardDetailDialog
                item={selected}
                imageId={selected && imageIds.get(selected.oracleId)}
                busy={selected !== undefined && busyId === selected.oracleId}
                onSetQuantity={setQuantity}
                onRemove={(item) => setQuantity(item, 0)}
                onClose={detail.close}
            />

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
