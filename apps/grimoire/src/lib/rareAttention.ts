import { isRareCode, type RarityCode } from '@/lib/cardSearch';
import type { RareCandidate } from '@/lib/locations';

/*
 * The rare rule (issue #89), kept pure so it is tested without a database.
 * The server lists the copies that sit in a location where a rare is not
 * expected (unsorted or bulk) and have not been overridden to `bulk`; the
 * browser knows the rarity (from the card list) and decides which of them
 * need attention. Rarity is the card's rarest printing: the app does not yet
 * know which printing a copy is.
 */

/** Whether a group of copies is a rare in the wrong place and needs attention. */
export function needsAttention(
    candidate: RareCandidate,
    rarities: ReadonlyMap<string, RarityCode>
): boolean {
    if (candidate.rareRule === 'bulk') return false;
    if (candidate.rareRule === 'keep') return true;
    return isRareCode(rarities.get(candidate.oracleId));
}

/**
 * The candidates that need attention, ordered by card name, then by location
 * label (and id, so the order is stable).
 */
export function attentionList(
    candidates: readonly RareCandidate[],
    rarities: ReadonlyMap<string, RarityCode>
): RareCandidate[] {
    return candidates
        .filter((candidate) => needsAttention(candidate, rarities))
        .sort(
            (a, b) =>
                a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) ||
                a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }) ||
                a.locationId.localeCompare(b.locationId)
        );
}

/** "card oracleId:location id" keys of the flagged groups, for the list rows. */
export function flaggedKeys(
    candidates: readonly RareCandidate[],
    rarities: ReadonlyMap<string, RarityCode>
): Set<string> {
    return new Set(
        attentionList(candidates, rarities).map(
            (candidate) => `${candidate.oracleId}:${candidate.locationId}`
        )
    );
}
