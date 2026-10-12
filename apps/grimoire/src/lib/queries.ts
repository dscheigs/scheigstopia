// Server state for Grimoire: what is fetched, what it is cached under, and how
// each change updates the cache. Components use these hooks, never `fetch`.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import { loadCardNames } from '@/lib/cardNamesSource';
import type { CardEntry } from '@/lib/cardSearch';
import type { CollectionItem } from '@/lib/collection';
import type { IdentifyResult } from '@/lib/identify';
import { withItem, withoutItem } from '@/lib/collectionCache';

export const queryKeys = {
    collection: ['collection'] as const,
    cardNames: ['card-names'] as const,
};

export function useCollection() {
    return useQuery({
        queryKey: queryKeys.collection,
        queryFn: async () =>
            (await apiFetch<{ items: CollectionItem[] }>('/api/collection'))
                .items,
    });
}

/**
 * The card list: the published Blob when NEXT_PUBLIC_CARD_NAMES_URL is set,
 * else (or on any failure) the committed file. Fetched once per page load.
 */
export function useCardNames() {
    return useQuery({
        queryKey: queryKeys.cardNames,
        queryFn: () =>
            loadCardNames(
                (url) => apiFetch<unknown>(url),
                process.env.NEXT_PUBLIC_CARD_NAMES_URL
            ),
        staleTime: Infinity,
        retry: false,
    });
}

/** Add one copy of a card. */
export function useAddCard() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (card: CardEntry) =>
            apiFetch<{ item: CollectionItem }>('/api/collection', {
                method: 'POST',
                json: { oracleId: card.oracleId, name: card.name },
            }),
        onSuccess: ({ item }) => {
            queryClient.setQueryData<CollectionItem[]>(
                queryKeys.collection,
                (current) => withItem(current ?? [], item)
            );
        },
    });
}

/** Commit a list of `{ oracleId, name, delta }` in one all-or-nothing request. */
export function useCommitQueue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            items: { oracleId: string; name: string; delta: number }[]
        ) =>
            apiFetch<{ items: CollectionItem[] }>('/api/collection/bulk', {
                method: 'POST',
                json: { items },
            }),
        onSuccess: ({ items }) => {
            queryClient.setQueryData<CollectionItem[]>(
                queryKeys.collection,
                (current) =>
                    items.reduce(
                        (all, item) => withItem(all, item),
                        current ?? []
                    )
            );
        },
    });
}

/** Set how many copies are owned. Zero removes the card. */
export function useSetQuantity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            item,
            quantity,
        }: {
            item: CollectionItem;
            quantity: number;
        }) =>
            apiFetch<{ item?: CollectionItem; removed?: boolean }>(
                `/api/collection/${item.oracleId}`,
                { method: 'PATCH', json: { quantity } }
            ),
        onSuccess: (body, { item }) => {
            queryClient.setQueryData<CollectionItem[]>(
                queryKeys.collection,
                (current) =>
                    body.item
                        ? withItem(current ?? [], body.item)
                        : withoutItem(current ?? [], item.oracleId)
            );
        },
    });
}

/** Read the card name off a JPEG photo. `name` is null when unreadable;
 * `confidence` is the model's own read quality. */
export function identifyPhoto(photo: Blob) {
    return apiFetch<IdentifyResult>('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: photo,
    });
}
