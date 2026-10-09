// Server state for Grimoire: what is fetched, what it is cached under, and how
// each change updates the cache. Components use these hooks, never `fetch`.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import type { CardEntry, CardNameFile } from '@/lib/cardSearch';
import type { CollectionItem } from '@/lib/collection';
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

/** The committed card list. It only changes with a deploy, so never refetch. */
export function useCardNames() {
    return useQuery({
        queryKey: queryKeys.cardNames,
        queryFn: () => apiFetch<CardNameFile>('/data/card-names.json'),
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

/** Read the card name off a JPEG photo. `name` is null when unreadable. */
export function useIdentify() {
    return useMutation({
        mutationFn: (photo: Blob) =>
            apiFetch<{ name: string | null }>('/api/identify', {
                method: 'POST',
                headers: { 'Content-Type': 'image/jpeg' },
                body: photo,
            }),
    });
}
