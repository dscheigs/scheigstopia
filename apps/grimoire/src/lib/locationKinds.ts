/**
 * What kinds of location there are. Checked here, not in the database, so a new
 * kind is a code change rather than a migration. A location's name is its
 * label (free text): a shoebox is a `bulk` location labelled "Shoebox", and a
 * frame is a `keepers` location labelled "Frame".
 *
 * - `unsorted`: the system location, one per user. New cards land here.
 * - `bulk`: bags, boxes and shoeboxes. Where cards you do not fuss over live.
 * - `keepers`: binders, frames and display cases. Where cards you chose to keep live.
 * - `deck`: cards in use.
 */
export const LOCATION_KINDS = ['unsorted', 'bulk', 'keepers', 'deck'] as const;

export type LocationKind = (typeof LOCATION_KINDS)[number];

export function isLocationKind(value: unknown): value is LocationKind {
    return (
        typeof value === 'string' &&
        (LOCATION_KINDS as readonly string[]).includes(value)
    );
}

/**
 * Whether a rare belongs in a location of this kind without a warning. A rare
 * in `unsorted` or `bulk` is flagged (never blocked) so the user is aware.
 */
export function isRareSafe(kind: LocationKind): boolean {
    return kind === 'keepers' || kind === 'deck';
}

/**
 * A per-copy override of the rare rule. No override (null) follows the card's
 * rarity: a rare or mythic is expected somewhere rare-safe.
 *
 * - `bulk`: this copy never needs attention, wherever it is.
 * - `keep`: this copy always expects a rare-safe location, whatever its rarity.
 */
export const RARE_RULES = ['bulk', 'keep'] as const;

export type RareRule = (typeof RARE_RULES)[number];

export function isRareRule(value: unknown): value is RareRule {
    return (
        typeof value === 'string' &&
        (RARE_RULES as readonly string[]).includes(value)
    );
}

/** The location kinds where a rare is flagged. */
export const RARE_UNSAFE_KINDS = LOCATION_KINDS.filter(
    (kind) => !isRareSafe(kind)
);
