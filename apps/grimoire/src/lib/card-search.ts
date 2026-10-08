import Fuse from 'fuse.js';

/** Shape of public/data/card-names.json, built by scripts/build-card-names.mjs. */
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
