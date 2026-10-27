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
