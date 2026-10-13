// Where the app reads its card list from. In production the weekly workflow
// publishes the list to a public Blob and NEXT_PUBLIC_CARD_NAMES_URL points at
// it. The list committed with the app is the fallback: it is used when the URL
// is unset, the fetch fails, or the response is not a card list.

import { withBasePath } from '@/lib/basePath';
import type { CardNameFile } from '@/lib/cardSearch';

export const COMMITTED_CARD_NAMES_PATH = '/data/card-names.json';

/** True if `value` is a non-empty card list whose count matches its cards. */
export function isCardNameFile(value: unknown): value is CardNameFile {
    if (typeof value !== 'object' || value === null) return false;
    const { version, count, cards } = value as Record<string, unknown>;
    return (
        typeof version === 'string' &&
        Array.isArray(cards) &&
        cards.length > 0 &&
        count === cards.length &&
        cards.every(
            (pair) =>
                Array.isArray(pair) &&
                pair.length === 2 &&
                typeof pair[0] === 'string' &&
                typeof pair[1] === 'string'
        )
    );
}

/**
 * Loads the card list from `remoteUrl` if given, else (or if that fails or
 * returns something invalid) from the committed file.
 */
export async function loadCardNames(
    fetchJson: (url: string) => Promise<unknown>,
    remoteUrl: string | undefined
): Promise<CardNameFile> {
    if (remoteUrl) {
        try {
            const remote = await fetchJson(remoteUrl);
            if (isCardNameFile(remote)) return remote;
        } catch {
            // Fall through to the committed list.
        }
    }
    const committed = await fetchJson(withBasePath(COMMITTED_CARD_NAMES_PATH));
    if (!isCardNameFile(committed)) {
        throw new Error('The card list is not valid.');
    }
    return committed;
}
