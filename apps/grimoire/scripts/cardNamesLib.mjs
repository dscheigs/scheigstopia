// Pure helpers for turning Scryfall's "Oracle Cards" bulk file into the slim
// card-name list the app ships. No network access here, so it is easy to test.

// Layouts that are not cards you would catalog from a collection.
const EXCLUDED_LAYOUTS = new Set([
    'art_series',
    'token',
    'double_faced_token',
    'emblem',
    'vanguard',
    'planar',
    'scheme',
]);

/**
 * @param {unknown[]} cards  Parsed contents of Scryfall's oracle-cards file.
 * @param {string} version   Scryfall's `updated_at` for the file, or a label.
 * @returns {{ version: string, count: number, cards: [string, string][] }}
 *   `cards` is [oracleId, name] pairs, sorted by name.
 */
export function slimOracleCards(cards, version) {
    const seen = new Set();
    const pairs = [];
    for (const card of cards) {
        const pair = slimOracleCard(card);
        if (!pair || seen.has(pair[0])) continue;
        seen.add(pair[0]);
        pairs.push(pair);
    }
    pairs.sort((a, b) => a[1].localeCompare(b[1], 'en'));
    return { version, count: pairs.length, cards: pairs };
}

/**
 * One Scryfall card object as an [oracleId, name] pair, or null when it is not
 * a collectible card (excluded layout) or lacks an id or name. The build and
 * the app's live Scryfall lookup share this, so both apply the same rules.
 * @param {unknown} card  A Scryfall card object.
 * @returns {[string, string] | null}
 */
export function slimOracleCard(card) {
    if (typeof card !== 'object' || card === null) return null;
    if (EXCLUDED_LAYOUTS.has(card.layout)) return null;

    // Reversible cards keep their oracle id on the faces, not the card.
    const oracleId = card.oracle_id ?? card.card_faces?.[0]?.oracle_id;
    const name = card.name;
    if (typeof oracleId !== 'string' || typeof name !== 'string') return null;
    return [oracleId, name];
}

// A real Oracle Cards file has tens of thousands of entries. Anything far
// below this is a sample, a failed download, or a bad filter.
export const MIN_REAL_CARD_COUNT = 10000;

/**
 * Throws if `list` is not a card list that is safe to deploy.
 * @param {unknown} list  Parsed contents of card-names.json.
 */
export function assertDeployableCardList(list) {
    if (
        typeof list !== 'object' ||
        list === null ||
        !Array.isArray(list.cards)
    ) {
        throw new Error('card-names.json is not a card list');
    }
    if (list.version === 'fixture') {
        throw new Error(
            'card-names.json was built from the sample fixture, not from Scryfall'
        );
    }
    if (list.cards.length !== list.count) {
        throw new Error('card-names.json count does not match its cards');
    }
    if (list.cards.length < MIN_REAL_CARD_COUNT) {
        throw new Error(
            `card-names.json has only ${list.cards.length} cards ` +
                `(expected at least ${MIN_REAL_CARD_COUNT})`
        );
    }
}

// A refresh may add cards or drop a few, but never lose this share of the list.
export const MAX_REFRESH_SHRINK = 0.05;

/**
 * Throws if `next` should not replace `previous` in an automated refresh: it
 * must be a deployable list and must not be much smaller than the old one.
 * @param {{ count: number }} previous  The committed card list.
 * @param {unknown} next  The freshly built card list.
 */
export function assertSaneRefresh(previous, next) {
    assertDeployableCardList(next);
    const floor = Math.floor(previous.count * (1 - MAX_REFRESH_SHRINK));
    if (next.cards.length < floor) {
        throw new Error(
            `New card list has ${next.cards.length} cards, down from ` +
                `${previous.count} (more than ${MAX_REFRESH_SHRINK * 100}% fewer)`
        );
    }
}

/**
 * Finds the Oracle Cards file in Scryfall's /bulk-data response. Matches on the
 * documented type, then falls back to the display name. Throws an error that
 * shows what Scryfall actually returned, so a changed response is easy to read.
 * @param {unknown} bulk  Parsed /bulk-data response.
 * Scryfall now publishes only a gzipped JSONL file (`jsonl_download_uri`); the
 * plain `download_uri` is accepted too in case it comes back.
 * @returns {{ download_uri?: string, jsonl_download_uri?: string, updated_at?: string }}
 */
export function pickOracleCardsEntry(bulk) {
    const items = Array.isArray(bulk?.data) ? bulk.data : [];
    const entry =
        items.find((item) => item?.type === 'oracle_cards') ??
        items.find((item) => item?.name === 'Oracle Cards');
    if (
        typeof entry?.download_uri === 'string' ||
        typeof entry?.jsonl_download_uri === 'string'
    ) {
        return entry;
    }

    const seen = items.map((item) => `${item?.type} / ${item?.name}`);
    const keys = bulk && typeof bulk === 'object' ? Object.keys(bulk) : [];
    throw new Error(
        'Oracle Cards entry not found in Scryfall bulk-data. ' +
            `Response keys: [${keys.join(', ')}]. ` +
            `Entries (type / name): [${seen.join('; ')}]. ` +
            (entry
                ? 'The matching entry has no download_uri or jsonl_download_uri.'
                : '')
    );
}

/**
 * True if `value` looks like a card list: a count that matches a non-empty
 * array of [oracleId, name] string pairs. This is the shape check only; use
 * `assertDeployableCardList` for the "is it a real Scryfall build" checks.
 * @param {unknown} value
 */
export function isCardList(value) {
    if (typeof value !== 'object' || value === null) return false;
    const { version, count, cards } = /** @type {Record<string, unknown>} */ (
        value
    );
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
 * Decides whether a freshly built list needs uploading. The `version` label
 * is ignored on purpose: Scryfall's timestamp changes daily even when no card
 * was added, and an upload for that would be pointless.
 * @param {unknown} published  The list currently published, or null if none.
 * @param {{ cards: [string, string][] }} next  The freshly built list.
 */
export function shouldUploadCardList(published, next) {
    if (!isCardList(published)) return true;
    if (published.cards.length !== next.cards.length) return true;
    return published.cards.some(
        ([oracleId, name], i) =>
            oracleId !== next.cards[i][0] || name !== next.cards[i][1]
    );
}
