// Server state for Grimoire: what is fetched, what it is cached under, and how
// each change updates the cache. Components use these hooks, never `fetch`.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import { indexedDbCardNames, loadCardNamesCached } from '@/lib/cardNamesCache';
import { loadCardNames } from '@/lib/cardNamesSource';
import type { CardEntry } from '@/lib/cardSearch';
import { normalize } from '@/lib/cardSearch';
import { lookupScryfallCard } from '@/lib/scryfall';
import type { CollectionItem } from '@/lib/collection';
import type { CommitDestination } from '@/lib/commitBag';
import type { IdentifyResult } from '@/lib/identify';
import type { HistoryEntry, LocationItem, Placement } from '@/lib/locations';
import type { LocationKind } from '@/lib/locationKinds';
import { withItem, withoutItem } from '@/lib/collectionCache';

export const queryKeys = {
    collection: ['collection'] as const,
    cardNames: ['card-names'] as const,
    locations: ['locations'] as const,
    placements: (oracleId: string) => ['placements', oracleId] as const,
    history: (oracleId: string) => ['history', oracleId] as const,
    scryfall: (name: string) => ['scryfall', normalize(name)] as const,
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
 * else (or on any failure) the committed file. Fetched once per page load and
 * remembered in IndexedDB, which is what is used when the fetch fails offline.
 */
export function useCardNames() {
    return useQuery({
        queryKey: queryKeys.cardNames,
        queryFn: () =>
            loadCardNamesCached(
                () =>
                    loadCardNames(
                        (url) => apiFetch<unknown>(url),
                        process.env.NEXT_PUBLIC_CARD_NAMES_URL
                    ),
                indexedDbCardNames
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

/**
 * Commit a list of `{ oracleId, name, delta }` into a bag in one
 * all-or-nothing request. Without a destination the cards go to Unsorted.
 */
export function useCommitQueue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            items,
            destination,
        }: {
            items: { oracleId: string; name: string; delta: number }[];
            destination?: CommitDestination;
        }) =>
            apiFetch<{ items: CollectionItem[]; locationId: string }>(
                '/api/collection/bulk',
                { method: 'POST', json: { items, destination } }
            ),
        onSuccess: ({ items }) => {
            // A new bag, and every bag's count, changed.
            queryClient.invalidateQueries({ queryKey: queryKeys.locations });
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

/** Look a name up on Scryfall; null for no card or any failure. */
export function lookupCardByName(name: string) {
    return lookupScryfallCard(name);
}

/**
 * Scryfall's match for a typed name the card list could not find. Runs only
 * when `enabled`, once per distinct name, and is remembered for the session.
 * A failed lookup is just "no match".
 */
export function useScryfallCard(name: string, enabled: boolean) {
    return useQuery({
        queryKey: queryKeys.scryfall(name),
        queryFn: ({ signal }) => lookupScryfallCard(name, fetch, signal),
        enabled: enabled && normalize(name).length >= 2,
        staleTime: Infinity,
        retry: false,
    });
}

/** The user's locations (archived ones too when asked). */
export function useLocations(options: { includeArchived?: boolean } = {}) {
    const includeArchived = options.includeArchived === true;
    return useQuery({
        queryKey: [...queryKeys.locations, { includeArchived }] as const,
        queryFn: async () =>
            (
                await apiFetch<{ items: LocationItem[] }>(
                    includeArchived
                        ? '/api/locations?archived=1'
                        : '/api/locations'
                )
            ).items,
    });
}

/** Create a location (a bag, box, binder or deck). */
export function useCreateLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: {
            kind: Exclude<LocationKind, 'unsorted'>;
            label: string;
            note?: string | null;
            parentId?: string | null;
        }) =>
            apiFetch<{ item: LocationItem }>('/api/locations', {
                method: 'POST',
                json: input,
            }),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: queryKeys.locations }),
    });
}

/** Rename, change the note of, archive or restore a location. */
export function useUpdateLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            ...changes
        }: {
            id: string;
            label?: string;
            note?: string | null;
            archived?: boolean;
        }) =>
            apiFetch<{ item: LocationItem }>(`/api/locations/${id}`, {
                method: 'PATCH',
                json: changes,
            }),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: queryKeys.locations }),
    });
}

/** Move copies between locations, all or nothing. */
export function useMoveCards() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: {
            moves: {
                oracleId: string;
                from: string;
                to: string;
                quantity: number;
            }[];
            note?: string | null;
        }) =>
            apiFetch<{ moved: number }>('/api/moves', {
                method: 'POST',
                json: input,
            }),
        onSuccess: (_result, { moves }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.locations });
            for (const { oracleId } of moves) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.placements(oracleId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.history(oracleId),
                });
            }
        },
    });
}

/** Where the copies of a card are, by location. */
export function useCardPlacements(oracleId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.placements(oracleId),
        queryFn: async () =>
            (
                await apiFetch<{ items: Placement[] }>(
                    `/api/cards/${oracleId}/placements`
                )
            ).items,
        enabled,
    });
}

/** The moves of a card's copies, newest first. */
export function useCardHistory(oracleId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.history(oracleId),
        queryFn: async () =>
            (
                await apiFetch<{ items: HistoryEntry[] }>(
                    `/api/cards/${oracleId}/history`
                )
            ).items,
        enabled,
    });
}
