// Live lookup of one card on Scryfall, for names the committed card list does
// not have yet (cards released since the last refresh). Scryfall serves CORS
// headers (Access-Control-Allow-Origin: *), so the browser calls it directly.
// Any failure resolves to null, which callers treat as "no match".

import { slimOracleCard } from '../../scripts/cardNamesLib.mjs';
import type { MatchedCard } from '@/lib/scanQueueTypes';

const NAMED_URL = 'https://api.scryfall.com/cards/named';

/**
 * The collectible card Scryfall's fuzzy search finds for `name`, or null for
 * no match, a non-collectible layout (token, emblem, ...) or any failure. One
 * request, no retries.
 */
export async function lookupScryfallCard(
    name: string,
    fetchImpl: typeof fetch = fetch,
    signal?: AbortSignal
): Promise<MatchedCard | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    try {
        // Accept is a safelisted header, so this stays a simple request with
        // no CORS preflight. Browsers do not let a page set User-Agent.
        const response = await fetchImpl(
            `${NAMED_URL}?${new URLSearchParams({ fuzzy: trimmed })}`,
            { headers: { Accept: 'application/json' }, signal }
        );
        if (!response.ok) return null;
        const pair = slimOracleCard(await response.json());
        return pair ? { oracleId: pair[0], name: pair[1] } : null;
    } catch {
        return null;
    }
}
