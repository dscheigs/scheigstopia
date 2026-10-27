import Fuse from 'fuse.js';

/** Shape of public/data/card-names.json, built by scripts/buildCardNames.mjs. */
export interface CardNameFile {
    version: string;
    count: number;
    /**
     * [oracleId, name] or [oracleId, name, imageId]. The image id is Scryfall's
     * CDN id for the front face (see cardImages.ts); older builds and cards
     * Scryfall has no image for leave it off.
     */
    cards: ([string, string] | [string, string, string])[];
}

export interface CardEntry {
    oracleId: string;
    name: string;
    /** Front face only: "Delver of Secrets // Insectile Aberration" -> "Delver of Secrets". */
    front: string;
}

export type CardIndex = Fuse<CardEntry>;

/** Fewest characters that search the collection (and match a read name). */
export const COLLECTION_MIN_QUERY_LENGTH = 2;
/** Fewest characters that also suggest cards you do not own yet. */
export const CATALOG_MIN_QUERY_LENGTH = 3;
/** Most catalog suggestions shown under "Not in collection". */
export const CATALOG_RESULT_LIMIT = 20;

/**
 * The one set of Fuse options, shared by the catalog and the collection so a
 * misspelled name finds the same card in both and the two cannot drift.
 */
export const FUSE_OPTIONS = {
    keys: ['name', 'front'],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: COLLECTION_MIN_QUERY_LENGTH,
};

/** A searchable entry for a card; `front` is the name before " // ". */
export function toCardEntry(oracleId: string, name: string): CardEntry {
    return { oracleId, name, front: name.split(' // ')[0] };
}

/** Builds a search index over entries with the shared options. */
export function buildIndexFromEntries(entries: CardEntry[]): CardIndex {
    return new Fuse(entries, FUSE_OPTIONS);
}

export function buildIndex(file: CardNameFile): CardIndex {
    return buildIndexFromEntries(
        file.cards.map(([oracleId, name]) => toCardEntry(oracleId, name))
    );
}

export const normalize = (text: string) =>
    text.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Likely cards for a name read off a photo, best first. An exact name (or exact
 * front face) beats a fuzzy hit, so "Lightning Bolt" is not outranked by
 * "Lightning Bolt Art Card". Nothing matches when the name is too far off.
 */
export function matchReadName(
    index: CardIndex,
    readName: string,
    limit = 3
): CardEntry[] {
    const wanted = normalize(readName);
    const candidates = searchCards(index, readName, limit + 5);
    const exact = candidates.filter(
        (card) =>
            normalize(card.name) === wanted || normalize(card.front) === wanted
    );
    const rest = candidates.filter((card) => !exact.includes(card));
    return [...exact, ...rest].slice(0, limit);
}

/**
 * Best matches for what the user typed, best first. Queries shorter than
 * `minLength` (default 2) match nothing.
 */
export function searchCards(
    index: CardIndex,
    query: string,
    limit = 8,
    minLength = COLLECTION_MIN_QUERY_LENGTH
): CardEntry[] {
    const trimmed = query.trim();
    if (trimmed.length < minLength) return [];
    return index.search(trimmed, { limit }).map((result) => result.item);
}
