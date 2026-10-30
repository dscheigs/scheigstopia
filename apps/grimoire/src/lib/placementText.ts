import type { CardPlacement, HistoryEntry, Placement } from '@/lib/locations';

/*
 * The words the collection list and the card sheet use for where a card is and
 * where it has been. Pure, so the wording is tested without a DOM.
 */

/** Placements grouped by card, keeping the order they came in. */
export function groupPlacements(
    placements: readonly CardPlacement[]
): Map<string, Placement[]> {
    const byCard = new Map<string, Placement[]>();
    for (const { oracleId, ...placement } of placements) {
        const list = byCard.get(oracleId);
        if (list) list.push(placement);
        else byCard.set(oracleId, [placement]);
    }
    return byCard;
}

/** "2 in Bag 2026-10-09, 1 in Binder A"; empty when there are none. */
export function formatPlacements(placements: readonly Placement[]): string {
    return placements.map((p) => `${p.quantity} in ${p.label}`).join(', ');
}

/** A move's date as "30 Oct 2026", in UTC so it reads the same everywhere. */
export function formatMoveDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

/** One timeline line: "2 from Unsorted to Bag", "3 added to Unsorted". */
export function describeMove(entry: HistoryEntry): string {
    const { quantity, fromLabel, toLabel } = entry;
    if (fromLabel === null && toLabel !== null) {
        return `${quantity} added to ${toLabel}`;
    }
    if (toLabel === null && fromLabel !== null) {
        return `${quantity} removed from ${fromLabel}`;
    }
    if (fromLabel === null || toLabel === null) {
        return `${quantity} moved`;
    }
    return `${quantity} from ${fromLabel} to ${toLabel}`;
}
