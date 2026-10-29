import {
    LOCATION_KINDS,
    isLocationKind,
    type LocationKind,
} from '@/lib/locationKinds';
import type { BulkDestination } from '@/lib/collection';
import type { MoveLine } from '@/lib/locations';

export const MAX_QUANTITY = 9999;
export const MAX_BULK_ITEMS = 500;
const MAX_NAME_LENGTH = 200;

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function isUuid(value: unknown): value is string {
    return typeof value === 'string' && UUID_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQuantity(value: unknown, min: number): value is number {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= min &&
        value <= MAX_QUANTITY
    );
}

export interface AddBody {
    oracleId: string;
    name: string;
    delta: number;
}

/** Body for adding copies of a card: { oracleId, name, delta? }. */
export function parseAddBody(body: unknown): Parsed<AddBody> {
    if (!isRecord(body)) {
        return { ok: false, error: 'Body must be a JSON object.' };
    }
    if (!isUuid(body.oracleId)) {
        return { ok: false, error: 'oracleId must be a UUID.' };
    }
    if (typeof body.name !== 'string') {
        return { ok: false, error: 'name must be a string.' };
    }
    const name = body.name.trim();
    if (
        name.length === 0 ||
        name.length > MAX_NAME_LENGTH ||
        CONTROL_CHARS.test(name)
    ) {
        return {
            ok: false,
            error: `name must be 1-${MAX_NAME_LENGTH} characters with no control characters.`,
        };
    }
    const delta = body.delta === undefined ? 1 : body.delta;
    if (!isQuantity(delta, 1)) {
        return {
            ok: false,
            error: `delta must be an integer from 1 to ${MAX_QUANTITY}.`,
        };
    }
    return { ok: true, value: { oracleId: body.oracleId, name, delta } };
}

export interface BulkBody {
    items: AddBody[];
    /** Absent means Unsorted. */
    destination?: BulkDestination;
}

/**
 * The bag a commit goes to: { locationId } for an existing location, or
 * { newBag: { label, note? } } to create one in the same request.
 */
function parseDestination(value: unknown): Parsed<BulkDestination> {
    if (!isRecord(value)) {
        return { ok: false, error: 'destination must be an object.' };
    }
    if (value.locationId !== undefined) {
        if (!isUuid(value.locationId) || value.newBag !== undefined) {
            return {
                ok: false,
                error: 'destination needs a locationId UUID or a newBag, not both.',
            };
        }
        return {
            ok: true,
            value: { kind: 'existing', locationId: value.locationId },
        };
    }
    if (!isRecord(value.newBag)) {
        return {
            ok: false,
            error: 'destination needs a locationId or a newBag.',
        };
    }
    const label = parseLabel(value.newBag.label);
    if (!label.ok) return label;
    const note = parseNote(
        value.newBag.note === undefined ? null : value.newBag.note
    );
    if (!note.ok) return note;
    return {
        ok: true,
        value: { kind: 'new', label: label.value, note: note.value },
    };
}

/**
 * Body for committing many cards:
 * { items: [{ oracleId, name, delta }], destination? }.
 */
export function parseBulkBody(body: unknown): Parsed<BulkBody> {
    if (!isRecord(body) || !Array.isArray(body.items)) {
        return { ok: false, error: 'items must be an array.' };
    }
    if (body.items.length === 0 || body.items.length > MAX_BULK_ITEMS) {
        return {
            ok: false,
            error: `items must have 1-${MAX_BULK_ITEMS} entries.`,
        };
    }
    const items: AddBody[] = [];
    for (const [index, raw] of body.items.entries()) {
        // Unlike the single add, delta is required: a queue always has one.
        if (!isRecord(raw) || raw.delta === undefined) {
            return {
                ok: false,
                error: `items[${index}] must be { oracleId, name, delta }.`,
            };
        }
        const parsed = parseAddBody(raw);
        if (!parsed.ok) {
            return { ok: false, error: `items[${index}]: ${parsed.error}` };
        }
        items.push(parsed.value);
    }
    if (body.destination === undefined) return { ok: true, value: { items } };
    const destination = parseDestination(body.destination);
    if (!destination.ok) return destination;
    return { ok: true, value: { items, destination: destination.value } };
}

/** Body for setting an exact quantity: { quantity }. Zero removes the card. */
export function parseQuantityBody(body: unknown): Parsed<{ quantity: number }> {
    if (!isRecord(body) || !isQuantity(body.quantity, 0)) {
        return {
            ok: false,
            error: `quantity must be an integer from 0 to ${MAX_QUANTITY}.`,
        };
    }
    return { ok: true, value: { quantity: body.quantity } };
}

const MAX_LABEL_LENGTH = 100;
const MAX_NOTE_LENGTH = 500;

function parseLabel(value: unknown): Parsed<string> {
    const label = typeof value === 'string' ? value.trim() : '';
    if (
        label.length === 0 ||
        label.length > MAX_LABEL_LENGTH ||
        CONTROL_CHARS.test(label)
    ) {
        return {
            ok: false,
            error: `label must be 1-${MAX_LABEL_LENGTH} characters with no control characters.`,
        };
    }
    return { ok: true, value: label };
}

/** A free-text note: trimmed, empty becomes null, newlines are allowed. */
function parseNote(value: unknown): Parsed<string | null> {
    if (value === null) return { ok: true, value: null };
    if (typeof value !== 'string') {
        return { ok: false, error: 'note must be a string or null.' };
    }
    const note = value.trim();
    // eslint-disable-next-line no-control-regex
    if (
        note.length > MAX_NOTE_LENGTH ||
        /[\u0000-\u0009\u000b-\u001f\u007f]/.test(note)
    ) {
        return {
            ok: false,
            error: `note must be at most ${MAX_NOTE_LENGTH} characters with no control characters.`,
        };
    }
    return { ok: true, value: note.length === 0 ? null : note };
}

export interface CreateLocationBody {
    kind: Exclude<LocationKind, 'unsorted'>;
    label: string;
    note: string | null;
    parentId: string | null;
}

/** Body for a new location: { kind, label, note?, parentId? }. */
export function parseCreateLocationBody(
    body: unknown
): Parsed<CreateLocationBody> {
    if (!isRecord(body)) {
        return { ok: false, error: 'Body must be a JSON object.' };
    }
    if (!isLocationKind(body.kind) || body.kind === 'unsorted') {
        return {
            ok: false,
            error: `kind must be one of: ${LOCATION_KINDS.filter((k) => k !== 'unsorted').join(', ')}.`,
        };
    }
    const label = parseLabel(body.label);
    if (!label.ok) return label;
    const note = parseNote(body.note === undefined ? null : body.note);
    if (!note.ok) return note;
    const parentId = body.parentId === undefined ? null : body.parentId;
    if (parentId !== null && !isUuid(parentId)) {
        return { ok: false, error: 'parentId must be a UUID or null.' };
    }
    return {
        ok: true,
        value: {
            kind: body.kind,
            label: label.value,
            note: note.value,
            parentId,
        },
    };
}

export interface UpdateLocationBody {
    label?: string;
    note?: string | null;
    archived?: boolean;
}

/** Body for changing a location: { label?, note?, archived? }, at least one. */
export function parseUpdateLocationBody(
    body: unknown
): Parsed<UpdateLocationBody> {
    if (!isRecord(body)) {
        return { ok: false, error: 'Body must be a JSON object.' };
    }
    const value: UpdateLocationBody = {};
    if (body.label !== undefined) {
        const label = parseLabel(body.label);
        if (!label.ok) return label;
        value.label = label.value;
    }
    if (body.note !== undefined) {
        const note = parseNote(body.note);
        if (!note.ok) return note;
        value.note = note.value;
    }
    if (body.archived !== undefined) {
        if (typeof body.archived !== 'boolean') {
            return { ok: false, error: 'archived must be true or false.' };
        }
        value.archived = body.archived;
    }
    if (Object.keys(value).length === 0) {
        return { ok: false, error: 'Nothing to change.' };
    }
    return { ok: true, value };
}

export interface MovesBody {
    moves: MoveLine[];
    note: string | null;
}

/**
 * Body for a batch of moves:
 * { moves: [{ oracleId, from, to, quantity }], note? }.
 */
export function parseMovesBody(body: unknown): Parsed<MovesBody> {
    if (!isRecord(body) || !Array.isArray(body.moves)) {
        return { ok: false, error: 'moves must be an array.' };
    }
    if (body.moves.length === 0 || body.moves.length > MAX_BULK_ITEMS) {
        return {
            ok: false,
            error: `moves must have 1-${MAX_BULK_ITEMS} entries.`,
        };
    }
    const moves: MoveLine[] = [];
    for (const [index, raw] of body.moves.entries()) {
        if (
            !isRecord(raw) ||
            !isUuid(raw.oracleId) ||
            !isUuid(raw.from) ||
            !isUuid(raw.to) ||
            !isQuantity(raw.quantity, 1)
        ) {
            return {
                ok: false,
                error: `moves[${index}] must be { oracleId, from, to, quantity } with UUIDs and a quantity from 1 to ${MAX_QUANTITY}.`,
            };
        }
        if (raw.from.toLowerCase() === raw.to.toLowerCase()) {
            return {
                ok: false,
                error: `moves[${index}]: from and to must differ.`,
            };
        }
        moves.push({
            oracleId: raw.oracleId,
            fromId: raw.from,
            toId: raw.to,
            quantity: raw.quantity,
        });
    }
    const note = parseNote(body.note === undefined ? null : body.note);
    if (!note.ok) return note;
    return { ok: true, value: { moves, note: note.value } };
}
