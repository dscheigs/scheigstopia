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

// Rarity is stored as one letter per card to keep the file small. Scryfall's
// special and bonus rarities (and anything unknown) are "o": not a rare.
export const RARITY_CODES = ['c', 'u', 'r', 'm', 'o'];
const RARITY_BY_NAME = { common: 'c', uncommon: 'u', rare: 'r', mythic: 'm' };
// Higher wins when a card has been printed at several rarities.
const RARITY_RANK = { o: 0, c: 1, u: 2, r: 3, m: 4 };

/**
 * One-letter code for a Scryfall rarity string: c, u, r or m, and "o" for
 * special, bonus or anything else. Only rare (r) and mythic (m) count as rares.
 * @param {unknown} rarity  A Scryfall `rarity` value.
 * @returns {string}
 */
export function rarityCode(rarity) {
    return (typeof rarity === 'string' && RARITY_BY_NAME[rarity]) || 'o';
}

/**
 * Folds one printing into a running oracleId -> rarity code map, keeping the
 * highest rarity seen (mythic over rare over uncommon over common). Tokens and
 * other excluded layouts are ignored. Call it per line of the Default Cards
 * file so the whole ~500 MB file never has to sit in memory.
 * @param {Map<string, string>} rarities  Mutated in place.
 * @param {unknown} printing  A Scryfall card object (one printing).
 */
export function addPrintingRarity(rarities, printing) {
    if (typeof printing !== 'object' || printing === null) return;
    if (EXCLUDED_LAYOUTS.has(printing.layout)) return;
    const oracleId = oracleIdOf(printing);
    if (typeof oracleId !== 'string') return;
    const code = rarityCode(printing.rarity);
    const seen = rarities.get(oracleId);
    if (seen === undefined || RARITY_RANK[code] > RARITY_RANK[seen]) {
        rarities.set(oracleId, code);
    }
}

/**
 * The rarest rarity code per oracle id across all printings.
 * @param {Iterable<unknown>} printings
 * @returns {Map<string, string>}
 */
export function reduceRarities(printings) {
    const rarities = new Map();
    for (const printing of printings) addPrintingRarity(rarities, printing);
    return rarities;
}

function oracleIdOf(card) {
    return card?.oracle_id ?? card?.card_faces?.[0]?.oracle_id;
}

/**
 * @param {unknown[]} cards  Parsed contents of Scryfall's oracle-cards file.
 * @param {string} version   Scryfall's `updated_at` for the file, or a label.
 * @param {Map<string, string>} [rarities]  oracleId -> rarity code from
 *   `reduceRarities`. When given, every entry is [oracleId, name, imageId,
 *   rarity] (imageId is "" for a card with no image); without it entries stay
 *   [oracleId, name] or [oracleId, name, imageId].
 * @returns {{ version: string, count: number, cards: string[][] }}
 *   `cards` is sorted by name. The image id is left off when Scryfall has no
 *   image for the card (unless a rarity follows it).
 */
export function slimOracleCards(cards, version, rarities) {
    const seen = new Set();
    const pairs = [];
    for (const card of cards) {
        const pair = slimOracleCard(
            card,
            rarities?.get(oracleIdOf(card)) ?? (rarities ? 'o' : undefined)
        );
        if (!pair || seen.has(pair[0])) continue;
        seen.add(pair[0]);
        pairs.push(pair);
    }
    pairs.sort((a, b) => a[1].localeCompare(b[1], 'en'));
    return { version, count: pairs.length, cards: pairs };
}

const IMAGE_ID = /\/front\/[0-9a-f]\/[0-9a-f]\/([0-9a-f-]{36})\.[a-z]+(?:\?|$)/;

/**
 * The id Scryfall's CDN uses for a card's front image, or null. It is the
 * uuid in `image_uris.small`; double-faced cards keep their images on the
 * faces, and the front face is the first one. Every size of the same image
 * shares this id (see cardImageUrl in the app).
 * @param {unknown} card  A Scryfall card object.
 * @returns {string | null}
 */
export function scryfallImageId(card) {
    const uris = card?.image_uris ?? card?.card_faces?.[0]?.image_uris;
    const url = uris?.small ?? uris?.normal;
    if (typeof url !== 'string') return null;
    return IMAGE_ID.exec(url)?.[1] ?? null;
}

/**
 * One Scryfall card object as an [oracleId, name] or [oracleId, name, imageId]
 * entry, or null when it is not a collectible card (excluded layout) or lacks
 * an id or name. The build and the app's live Scryfall lookup share this, so
 * both apply the same rules.
 * With `rarity` (a code from `rarityCode`) the entry is always four long:
 * [oracleId, name, imageId or "", rarity].
 * @param {unknown} card  A Scryfall card object.
 * @param {string} [rarity]  Rarity code to store; omit for a two/three-entry.
 * @returns {string[] | null}
 */
export function slimOracleCard(card, rarity) {
    if (typeof card !== 'object' || card === null) return null;
    if (EXCLUDED_LAYOUTS.has(card.layout)) return null;

    // Reversible cards keep their oracle id on the faces, not the card.
    const oracleId = oracleIdOf(card);
    const name = card.name;
    if (typeof oracleId !== 'string' || typeof name !== 'string') return null;
    const imageId = scryfallImageId(card);
    if (rarity !== undefined) return [oracleId, name, imageId ?? '', rarity];
    return imageId ? [oracleId, name, imageId] : [oracleId, name];
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
    // Rarity is optional (lists built before it was added have none), but when
    // an entry has one it must be a known code.
    const bad = list.cards.find(
        (entry) =>
            Array.isArray(entry) &&
            entry.length > 3 &&
            !RARITY_CODES.includes(entry[3])
    );
    if (bad) {
        throw new Error(
            `card-names.json has an unknown rarity for "${bad[1]}": ${bad[3]}`
        );
    }
}

/**
 * Share of entries that carry a rarity (0 for a list built before rarities).
 * @param {{ cards: unknown[][] }} list
 */
export function rarityCoverage(list) {
    if (list.cards.length === 0) return 0;
    const withRarity = list.cards.filter((entry) => entry.length > 3).length;
    return withRarity / list.cards.length;
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
 * array of [oracleId, name], [oracleId, name, imageId] or
 * [oracleId, name, imageId, rarity] string entries. This is the shape check only; use
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
                (pair.length === 2 ||
                    (pair.length === 3 && typeof pair[2] === 'string') ||
                    (pair.length === 4 &&
                        typeof pair[2] === 'string' &&
                        RARITY_CODES.includes(pair[3]))) &&
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
 * @param {{ cards: string[][] }} next  The freshly built list.
 */
export function shouldUploadCardList(published, next) {
    if (!isCardList(published)) return true;
    if (published.cards.length !== next.cards.length) return true;
    return published.cards.some(
        ([oracleId, name, imageId, rarity], i) =>
            oracleId !== next.cards[i][0] ||
            name !== next.cards[i][1] ||
            imageId !== next.cards[i][2] ||
            rarity !== next.cards[i][3]
    );
}
