import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
    addToCollection,
    listCollection,
    removeFromCollection,
    setQuantity,
} from '@/lib/collection';
import type { Sql } from '@/lib/db';
import { upsertUser } from '@/lib/users';
import { MAX_QUANTITY } from '@/lib/validation';
import { createTestDb } from '@/test/db';

const BOLT = '00000000-0000-4000-8000-000000000001';
const RING = '00000000-0000-4000-8000-000000000003';
const ANGEL = '00000000-0000-4000-8000-000000000008';

let sql: Sql;
let query: Awaited<ReturnType<typeof createTestDb>>['query'];
let me: string;
let other: string;

beforeAll(async () => {
    const db = await createTestDb();
    sql = db.sql;
    query = db.query;
});

beforeEach(async () => {
    // Cascades to collection rows, so every test starts empty.
    await query('truncate users cascade');
    me = await upsertUser(sql, 1001, 'me');
    other = await upsertUser(sql, 2002, 'someone-else');
});

describe('upsertUser', () => {
    it('returns the same internal id for the same GitHub account', async () => {
        expect(await upsertUser(sql, 1001, 'renamed')).toBe(me);
        const rows = await query('select login from users where id = $1', [me]);
        expect(rows[0].login).toBe('renamed');
    });

    it('gives different accounts different ids', () => {
        expect(me).not.toBe(other);
    });
});

describe('addToCollection', () => {
    it('creates a card with the requested quantity', async () => {
        const item = await addToCollection(sql, me, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: 1,
        });
        expect(item).toMatchObject({
            oracleId: BOLT,
            name: 'Lightning Bolt',
            quantity: 1,
        });
        expect(Number.isNaN(Date.parse(item.updatedAt))).toBe(false);
    });

    it('adds to an existing card instead of duplicating it', async () => {
        await addToCollection(sql, me, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: 1,
        });
        await addToCollection(sql, me, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: 3,
        });
        const items = await listCollection(sql, me);
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(4);
    });

    it('caps the quantity at the maximum', async () => {
        await addToCollection(sql, me, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: MAX_QUANTITY - 1,
        });
        const item = await addToCollection(sql, me, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: 50,
        });
        expect(item.quantity).toBe(MAX_QUANTITY);
    });
});

describe('listCollection', () => {
    it('sorts by name ignoring case', async () => {
        await addToCollection(sql, me, {
            oracleId: RING,
            name: 'sol Ring',
            delta: 1,
        });
        await addToCollection(sql, me, {
            oracleId: ANGEL,
            name: 'Serra Angel',
            delta: 1,
        });
        await addToCollection(sql, me, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: 1,
        });
        expect((await listCollection(sql, me)).map((i) => i.name)).toEqual([
            'Lightning Bolt',
            'Serra Angel',
            'sol Ring',
        ]);
    });

    it("never returns another user's cards", async () => {
        await addToCollection(sql, other, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: 2,
        });
        expect(await listCollection(sql, me)).toEqual([]);
        expect(await listCollection(sql, other)).toHaveLength(1);
    });
});

describe('setQuantity', () => {
    beforeEach(async () => {
        await addToCollection(sql, me, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: 2,
        });
    });

    it('sets an exact quantity', async () => {
        const result = await setQuantity(sql, me, BOLT, 7);
        expect(result).toMatchObject({
            status: 'updated',
            item: { quantity: 7 },
        });
    });

    it('removes the card when set to zero', async () => {
        expect(await setQuantity(sql, me, BOLT, 0)).toEqual({
            status: 'removed',
        });
        expect(await listCollection(sql, me)).toEqual([]);
    });

    it('reports not_found for a card you do not own', async () => {
        expect(await setQuantity(sql, me, RING, 3)).toEqual({
            status: 'not_found',
        });
        expect(await setQuantity(sql, me, RING, 0)).toEqual({
            status: 'not_found',
        });
    });

    it("cannot change another user's card", async () => {
        expect(await setQuantity(sql, other, BOLT, 9)).toEqual({
            status: 'not_found',
        });
        expect((await listCollection(sql, me))[0].quantity).toBe(2);
    });
});

describe('removeFromCollection', () => {
    it('removes once, then reports nothing to remove', async () => {
        await addToCollection(sql, me, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: 1,
        });
        expect(await removeFromCollection(sql, me, BOLT)).toBe(true);
        expect(await removeFromCollection(sql, me, BOLT)).toBe(false);
    });

    it("cannot remove another user's card", async () => {
        await addToCollection(sql, me, {
            oracleId: BOLT,
            name: 'Lightning Bolt',
            delta: 1,
        });
        expect(await removeFromCollection(sql, other, BOLT)).toBe(false);
        expect(await listCollection(sql, me)).toHaveLength(1);
    });
});

describe('database constraints', () => {
    it('rejects a non-positive quantity even if the app is bypassed', async () => {
        await expect(
            query(
                'insert into collection (user_id, oracle_id, name, quantity) values ($1, $2, $3, 0)',
                [me, BOLT, 'Lightning Bolt']
            )
        ).rejects.toThrow();
    });
});
