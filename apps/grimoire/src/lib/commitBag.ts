// The pure logic behind the commit dialog on /queue: which bag a scan session
// goes into, its default label, and remembering the last bag used.

import type { LocationItem } from '@/lib/locations';

/** What the user picked in the dialog. */
export type BagChoice =
    | { mode: 'new'; label: string; note: string }
    | { mode: 'existing'; locationId: string };

/** The `destination` of the bulk commit request. */
export type CommitDestination =
    | { locationId: string }
    | { newBag: { label: string; note?: string } };

/** Where the rares of a scan session go: nowhere special, a new or an existing keepers location. */
export type KeepersChoice =
    | { mode: 'skip' }
    | { mode: 'new'; label: string }
    | { mode: 'existing'; locationId: string };

export const MAX_BAG_LABEL_LENGTH = 100;

/** Today's date in local time as YYYY-MM-DD, the default label of a new bag. */
export function defaultBagLabel(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** The bags an existing-bag choice can name: open, bulk locations. */
export function bagOptions(locations: LocationItem[]): LocationItem[] {
    return locations.filter(
        (location) => location.kind === 'bulk' && location.archivedAt === null
    );
}

/**
 * The dialog's starting choice: the last bag used when it is still there,
 * otherwise a new bag labelled with today's date.
 */
export function initialChoice(
    lastBagId: string | null,
    bags: LocationItem[],
    today: Date
): BagChoice {
    if (lastBagId && bags.some((bag) => bag.id === lastBagId)) {
        return { mode: 'existing', locationId: lastBagId };
    }
    return { mode: 'new', label: defaultBagLabel(today), note: '' };
}

/** The open keepers locations (binders, frames) a rare can be sent to. */
export function keepersOptions(locations: LocationItem[]): LocationItem[] {
    return locations.filter(
        (location) =>
            location.kind === 'keepers' && location.archivedAt === null
    );
}

/** The dialog's starting keepers choice: the first keepers location, else skip. */
export function initialKeepersChoice(keepers: LocationItem[]): KeepersChoice {
    return keepers.length > 0
        ? { mode: 'existing', locationId: keepers[0].id }
        : { mode: 'skip' };
}

export type KeepersResult =
    | { ok: true; destination: CommitDestination | undefined }
    | { ok: false; error: string };

/** The request's keepers destination; skipping gives none and never blocks. */
export function toKeepersDestination(choice: KeepersChoice): KeepersResult {
    if (choice.mode === 'skip') return { ok: true, destination: undefined };
    if (choice.mode === 'existing') {
        return choice.locationId
            ? { ok: true, destination: { locationId: choice.locationId } }
            : { ok: false, error: 'Pick a keepers location, or skip it.' };
    }
    const label = choice.label.trim();
    if (label.length === 0 || label.length > MAX_BAG_LABEL_LENGTH) {
        return {
            ok: false,
            error: `Give the keepers location a name of 1-${MAX_BAG_LABEL_LENGTH} characters, or skip it.`,
        };
    }
    return { ok: true, destination: { newBag: { label } } };
}

/** What the dialog hands back: the bag, and where the rares go if anywhere. */
export interface CommitRequest {
    destination: CommitDestination;
    keepersDestination?: CommitDestination;
}

/** A line of the commit request. */
export interface CommitLine {
    oracleId: string;
    name: string;
    delta: number;
    destination?: 'keepers';
}

/**
 * The request lines: the rares are marked for the keepers location when there
 * is one, otherwise every line goes to the bag (and the rares show up in the
 * needs-attention list).
 */
export function routeLines(
    payload: { oracleId: string; name: string; delta: number }[],
    rareIds: ReadonlySet<string>,
    hasKeepers: boolean
): CommitLine[] {
    return payload.map((line) =>
        hasKeepers && rareIds.has(line.oracleId)
            ? { ...line, destination: 'keepers' as const }
            : line
    );
}

export type DestinationResult =
    | { ok: true; destination: CommitDestination }
    | { ok: false; error: string };

/** The request destination for a choice, or why it cannot be used yet. */
export function toDestination(choice: BagChoice): DestinationResult {
    if (choice.mode === 'existing') {
        return { ok: true, destination: { locationId: choice.locationId } };
    }
    const label = choice.label.trim();
    if (label.length === 0) {
        return { ok: false, error: 'Give the bag a name or a date.' };
    }
    if (label.length > MAX_BAG_LABEL_LENGTH) {
        return {
            ok: false,
            error: `Keep the name to ${MAX_BAG_LABEL_LENGTH} characters.`,
        };
    }
    const note = choice.note.trim();
    return {
        ok: true,
        destination: {
            newBag: note.length > 0 ? { label, note } : { label },
        },
    };
}

const LAST_BAG_PREFIX = 'grimoire:last-bag:';

type StringStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** The browser's localStorage, or null on the server or when it is blocked. */
export function browserStorage(): StringStorage | null {
    try {
        return typeof window === 'undefined' ? null : window.localStorage;
    } catch {
        return null;
    }
}

/** The id of the bag the last commit went into, or null. Never throws. */
export function readLastBag(
    storage: StringStorage | null,
    userId: string
): string | null {
    try {
        return storage?.getItem(`${LAST_BAG_PREFIX}${userId}`) ?? null;
    } catch {
        return null;
    }
}

/** Remember the bag a commit went into. Storage may be blocked; that is fine. */
export function writeLastBag(
    storage: StringStorage | null,
    userId: string,
    locationId: string
): void {
    try {
        storage?.setItem(`${LAST_BAG_PREFIX}${userId}`, locationId);
    } catch {
        // The default just falls back to a new bag next time.
    }
}
