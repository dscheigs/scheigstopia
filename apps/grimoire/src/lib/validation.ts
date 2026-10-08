export const MAX_QUANTITY = 9999;
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
