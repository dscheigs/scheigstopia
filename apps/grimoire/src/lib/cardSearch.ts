import Fuse from 'fuse.js';

/** Shape of public/data/card-names.json, built by scripts/buildCardNames.mjs. */
export interface CardNameFile {
    version: string;
    count: number;
    /** [oracleId, name] pairs. */
    cards: [string, string][];
}

export interface CardEntry {
    oracleId: string;
    name: string;
    /** Front face only: "Delver of Secrets // Insectile Aberration" -> "Delver of Secrets". */
    front: string;
}

export type CardIndex = Fuse<CardEntry>;

const MIN_QUERY_LENGTH = 2;

export function buildIndex(file: CardNameFile): CardIndex {
    const entries: CardEntry[] = file.cards.map(([oracleId, name]) => ({
        oracleId,
        name,
        front: name.split(' // ')[0],
    }));
    return new Fuse(entries, {
        keys: ['name', 'front'],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: MIN_QUERY_LENGTH,
    });
}

const normalize = (text: string) =>
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

/** Best matches for what the user typed. Short or empty queries match nothing. */
export function searchCards(
    index: CardIndex,
    query: string,
    limit = 8
): CardEntry[] {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return [];
    return index.search(trimmed, { limit }).map((result) => result.item);
}
