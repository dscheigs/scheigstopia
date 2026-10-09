// Pure helpers for keeping the cached collection in step with the server.

import type { CollectionItem } from '@/lib/collection';

function sortItems(items: CollectionItem[]): CollectionItem[] {
    return [...items].sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
}

/** `items` with `item` added or replaced, alphabetical. */
export function withItem(
    items: CollectionItem[],
    item: CollectionItem
): CollectionItem[] {
    return sortItems([
        ...items.filter((existing) => existing.oracleId !== item.oracleId),
        item,
    ]);
}

/** `items` without the card `oracleId`. */
export function withoutItem(
    items: CollectionItem[],
    oracleId: string
): CollectionItem[] {
    return items.filter((existing) => existing.oracleId !== oracleId);
}
