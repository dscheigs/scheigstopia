'use client';

import { useMemo } from 'react';
import type { CollectionItem } from '@/lib/collection';
import {
    buildCollectionIndex,
    collectionIndexKey,
    searchCollection,
} from '@/lib/collectionSearch';
import { COLLECTION_MIN_QUERY_LENGTH } from '@/lib/cardSearch';

/**
 * The owned cards that match `query`, best first, or all of them when the query
 * is too short to search. The index is rebuilt only when the set of owned cards
 * or their names changes, never for a quantity edit or a keystroke.
 */
export function useCollectionSearch(items: CollectionItem[], query: string) {
    const key = collectionIndexKey(items);
    const index = useMemo(
        () => buildCollectionIndex(items),
        // The key stands for ids and names; a quantity change keeps it, so the
        // index (and its Fuse build over thousands of cards) is kept too.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [key]
    );
    const searching = query.trim().length >= COLLECTION_MIN_QUERY_LENGTH;
    const results = useMemo(
        () => searchCollection(index, items, query),
        [index, items, query]
    );
    return { results, searching, index };
}
