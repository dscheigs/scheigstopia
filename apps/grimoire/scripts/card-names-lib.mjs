// Pure helpers for turning Scryfall's "Oracle Cards" bulk file into the slim
// card-name list the app ships. No network access here, so it is easy to test.

// Layouts that are not cards you would catalog from a collection.
const EXCLUDED_LAYOUTS = new Set([
    'art_series',
    'token',
    'double_faced_token',
    'emblem',
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
        if (typeof card !== 'object' || card === null) continue;
        if (EXCLUDED_LAYOUTS.has(card.layout)) continue;

        // Reversible cards keep their oracle id on the faces, not the card.
        const oracleId = card.oracle_id ?? card.card_faces?.[0]?.oracle_id;
        const name = card.name;
        if (typeof oracleId !== 'string' || typeof name !== 'string') continue;
        if (seen.has(oracleId)) continue;

        seen.add(oracleId);
        pairs.push([oracleId, name]);
    }
    pairs.sort((a, b) => a[1].localeCompare(b[1], 'en'));
    return { version, count: pairs.length, cards: pairs };
}
