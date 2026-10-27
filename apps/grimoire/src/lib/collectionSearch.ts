import type { CollectionItem } from '@/lib/collection';
import {
    COLLECTION_MIN_QUERY_LENGTH,
    buildIndexFromEntries,
    searchCards,
    toCardEntry,
    type CardIndex,
} from '@/lib/cardSearch';

/**
 * A search index over the cards the user owns, built with the same options as
 * the catalog's. It does not need the card list, so searching the collection
 * works while that list is loading or missing.
 */
export function buildCollectionIndex(
    items: Pick<CollectionItem, 'oracleId' | 'name'>[]
): CardIndex {
    return buildIndexFromEntries(
        items.map((item) => toCardEntry(item.oracleId, item.name))
    );
}

/**
 * A string that changes when the set of owned cards or their names changes,
 * and not when only a quantity does. Quantity edits replace `items` often, and
 * the index should not be rebuilt for them.
 */
export function collectionIndexKey(
    items: Pick<CollectionItem, 'oracleId' | 'name'>[]
): string {
    return items.map((item) => `${item.oracleId}\t${item.name}`).join('\n');
}

/**
 * Owned cards matching `query`, best match first. A query too short to search
 * (under `COLLECTION_MIN_QUERY_LENGTH`) returns every card, unfiltered, in the
 * order given.
 */
export function searchCollection(
    index: CardIndex,
    items: CollectionItem[],
    query: string
): CollectionItem[] {
    if (query.trim().length < COLLECTION_MIN_QUERY_LENGTH) return items;
    const byId = new Map(items.map((item) => [item.oracleId, item]));
    return searchCards(index, query, items.length).flatMap((entry) => {
        const item = byId.get(entry.oracleId);
        return item ? [item] : [];
    });
}
