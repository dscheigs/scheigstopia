import { describe, expect, it } from 'vitest';
import {
    MAX_QUANTITY,
    isUuid,
    MAX_BULK_ITEMS,
    parseAddBody,
    parseBulkBody,
    parseQuantityBody,
} from '@/lib/validation';

const ID = '00000000-0000-4000-8000-000000000001';

describe('isUuid', () => {
    it('accepts UUIDs and rejects everything else', () => {
        expect(isUuid(ID)).toBe(true);
        expect(isUuid('not-a-uuid')).toBe(false);
        expect(isUuid(`${ID} `)).toBe(false);
        expect(isUuid(undefined)).toBe(false);
        expect(isUuid(5)).toBe(false);
    });
});

describe('parseAddBody', () => {
    it('defaults delta to 1 and trims the name', () => {
        expect(parseAddBody({ oracleId: ID, name: '  Sol Ring ' })).toEqual({
            ok: true,
            value: { oracleId: ID, name: 'Sol Ring', delta: 1 },
        });
    });

    it('accepts an explicit delta', () => {
        const result = parseAddBody({
            oracleId: ID,
            name: 'Sol Ring',
            delta: 4,
        });
        expect(result).toEqual({
            ok: true,
            value: { oracleId: ID, name: 'Sol Ring', delta: 4 },
        });
    });

    it.each([
        ['non-object body', 'hello'],
        ['array body', []],
        ['null body', null],
        ['bad id', { oracleId: 'x', name: 'Sol Ring' }],
        ['missing name', { oracleId: ID }],
        ['empty name', { oracleId: ID, name: '   ' }],
        ['long name', { oracleId: ID, name: 'a'.repeat(201) }],
        ['control characters', { oracleId: ID, name: 'Sol\u0000Ring' }],
        ['zero delta', { oracleId: ID, name: 'Sol Ring', delta: 0 }],
        ['negative delta', { oracleId: ID, name: 'Sol Ring', delta: -1 }],
        ['fractional delta', { oracleId: ID, name: 'Sol Ring', delta: 1.5 }],
        [
            'huge delta',
            { oracleId: ID, name: 'Sol Ring', delta: MAX_QUANTITY + 1 },
        ],
        ['string delta', { oracleId: ID, name: 'Sol Ring', delta: '2' }],
    ])('rejects %s', (_label, body) => {
        expect(parseAddBody(body).ok).toBe(false);
    });
});

describe('parseQuantityBody', () => {
    it('accepts zero through the maximum', () => {
        expect(parseQuantityBody({ quantity: 0 }).ok).toBe(true);
        expect(parseQuantityBody({ quantity: MAX_QUANTITY }).ok).toBe(true);
    });

    it.each([
        ['negative', { quantity: -1 }],
        ['too large', { quantity: MAX_QUANTITY + 1 }],
        ['fractional', { quantity: 2.5 }],
        ['string', { quantity: '2' }],
        ['missing', {}],
        ['not an object', 3],
    ])('rejects %s', (_label, body) => {
        expect(parseQuantityBody(body).ok).toBe(false);
    });
});

describe('parseBulkBody', () => {
    it('accepts items and trims names', () => {
        expect(
            parseBulkBody({
                items: [{ oracleId: ID, name: ' Sol Ring ', delta: 2 }],
            })
        ).toEqual({
            ok: true,
            value: { items: [{ oracleId: ID, name: 'Sol Ring', delta: 2 }] },
        });
    });

    const item = { oracleId: ID, name: 'Sol Ring', delta: 1 };
    it.each([
        ['a non-object', 5],
        ['missing items', {}],
        ['items not an array', { items: 'x' }],
        ['no items', { items: [] }],
        [
            'too many items',
            { items: Array.from({ length: MAX_BULK_ITEMS + 1 }, () => item) },
        ],
        ['a non-object item', { items: [item, 3] }],
        ['a missing delta', { items: [{ oracleId: ID, name: 'Sol Ring' }] }],
        ['a bad oracleId', { items: [{ ...item, oracleId: 'nope' }] }],
        ['a zero delta', { items: [{ ...item, delta: 0 }] }],
        ['a huge delta', { items: [{ ...item, delta: MAX_QUANTITY + 1 }] }],
        ['an empty name', { items: [{ ...item, name: ' ' }] }],
    ])('rejects %s', (_label, body) => {
        expect(parseBulkBody(body).ok).toBe(false);
    });

    it('accepts the maximum batch size', () => {
        const items = Array.from({ length: MAX_BULK_ITEMS }, () => item);
        expect(parseBulkBody({ items }).ok).toBe(true);
    });
});
