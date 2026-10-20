// The card list kept in IndexedDB, so search and matching still work offline
// and the ~MB file is not parsed from the network on every launch.

import { createStore, get, set, type UseStore } from 'idb-keyval';
import { isCardNameFile } from '@/lib/cardNamesSource';
import type { CardNameFile } from '@/lib/cardSearch';

export interface CardNamesCache {
    read(): Promise<unknown>;
    write(list: CardNameFile): Promise<void>;
}

const key = 'card-names';
let store: UseStore | null = null;

function cardNamesStore(): UseStore | null {
    if (typeof indexedDB === 'undefined') return null;
    store ??= createStore('grimoire-card-names', 'lists');
    return store;
}

/** The IndexedDB-backed cache; does nothing where IndexedDB is missing. */
export const indexedDbCardNames: CardNamesCache = {
    async read() {
        const s = cardNamesStore();
        return s ? get(key, s) : undefined;
    },
    async write(list) {
        const s = cardNamesStore();
        if (s) await set(key, list, s);
    },
};

/**
 * Loads the card list with `load`, remembering it in `cache`. If `load` fails
 * (offline, say), the remembered list is used instead. Cache problems never
 * break loading.
 */
export async function loadCardNamesCached(
    load: () => Promise<CardNameFile>,
    cache: CardNamesCache
): Promise<CardNameFile> {
    try {
        const list = await load();
        try {
            await cache.write(list);
        } catch {
            // Storage full or unavailable: the fresh list is still good.
        }
        return list;
    } catch (error) {
        try {
            const remembered = await cache.read();
            if (isCardNameFile(remembered)) return remembered;
        } catch {
            // Fall through to the original error.
        }
        throw error;
    }
}
