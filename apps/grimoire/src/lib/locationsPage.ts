import type { LocationItem } from '@/lib/locations';
import type { LocationKind } from '@/lib/locationKinds';

/** Where the locations list and a location's page live. */
export const LOCATIONS_PATH = '/locations';

export function locationPath(id: string): string {
    return `${LOCATIONS_PATH}/${id}`;
}

/** True when `pathname` is the locations list or a location's page. */
export function isLocationsRoute(pathname: string | null): boolean {
    return (
        pathname !== null &&
        (pathname === LOCATIONS_PATH ||
            pathname.startsWith(`${LOCATIONS_PATH}/`))
    );
}

/** The heading for each kind of location, in the order they are shown. */
const KIND_HEADINGS: { kind: LocationKind; heading: string }[] = [
    { kind: 'unsorted', heading: 'Unsorted' },
    { kind: 'bulk', heading: 'Bulk' },
    { kind: 'keepers', heading: 'Keepers' },
    { kind: 'deck', heading: 'Decks' },
];

export function kindLabel(kind: LocationKind): string {
    return KIND_HEADINGS.find((entry) => entry.kind === kind)!.heading;
}

export interface LocationGroup {
    kind: LocationKind;
    heading: string;
    items: LocationItem[];
}

/** The locations grouped by kind, in a fixed order; empty groups are left out. */
export function groupByKind(items: LocationItem[]): LocationGroup[] {
    return KIND_HEADINGS.map(({ kind, heading }) => ({
        kind,
        heading,
        items: items.filter((item) => item.kind === kind),
    })).filter((group) => group.items.length > 0);
}

/** "1 card" or "12 cards". */
export function cardCountText(count: number): string {
    return `${count} ${count === 1 ? 'card' : 'cards'}`;
}

/**
 * Why a location cannot be archived, or null when it can. The system Unsorted
 * location never can; any other must be empty first (the server enforces the
 * same rule).
 */
export function archiveBlocker(location: LocationItem): string | null {
    if (location.kind === 'unsorted') {
        return 'Unsorted cannot be archived.';
    }
    if (location.cardCount > 0) {
        return `Move its ${cardCountText(location.cardCount)} out before archiving.`;
    }
    return null;
}
