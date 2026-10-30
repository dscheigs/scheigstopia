import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { addToCollection, listCollection } from '@/lib/collection';
import type { Sql } from '@/lib/db';
import {
    createLocation,
    listAllPlacements,
    listHistory,
    listLocations,
    listPlacements,
    recordMoves,
    updateLocation,
} from '@/lib/locations';
import { upsertUser } from '@/lib/users';
import { createTestDb } from '@/test/db';

const BOLT = '00000000-0000-4000-8000-000000000001';
const RING = '00000000-0000-4000-8000-000000000003';
const MISSING = '00000000-0000-4000-8000-0000000000ff';

let sql: Sql;
let query: Awaited<ReturnType<typeof createTestDb>>['query'];
let me: string;
let other: string;
let unsorted: string;

beforeAll(async () => {
    const db = await createTestDb();
    sql = db.sql;
    query = db.query;
});

async function own(userId: string, oracleId: string, name: string, n: number) {
    await addToCollection(sql, userId, { oracleId, name, delta: n });
}

async function bag(
    userId: string,
    label: string,
    kind: 'bulk' | 'keepers' | 'deck' = 'bulk'
) {
    const location = await createLocation(sql, userId, { kind, label });
    if (!location) throw new Error('location not created');
    return location.id;
}

async function unsortedOf(userId: string) {
    const all = await listLocations(sql, userId);
    return all.find((l) => l.kind === 'unsorted')!.id;
}

beforeEach(async () => {
    await query('truncate users cascade');
    me = await upsertUser(sql, 1001, 'me');
    other = await upsertUser(sql, 2002, 'someone-else');
    await own(me, BOLT, 'Lightning Bolt', 3);
    unsorted = await unsortedOf(me);
});

describe('locations', () => {
    it('lists Unsorted first, then by kind and label, with card counts', async () => {
        await bag(me, 'Shoebox');
        await bag(me, 'Binder A', 'keepers');
        const all = await listLocations(sql, me);
        expect(all.map((l) => l.label)).toEqual([
            'Unsorted',
            'Shoebox',
            'Binder A',
        ]);
        expect(all[0].cardCount).toBe(3);
        expect(all[1].cardCount).toBe(0);
    });

    it('creates Unsorted for a user who has none', async () => {
        const all = await listLocations(sql, other);
        expect(all).toHaveLength(1);
        expect(all[0]).toMatchObject({ kind: 'unsorted', label: 'Unsorted' });
    });

    it('refuses a parent that belongs to someone else', async () => {
        const theirs = await bag(other, 'Their box');
        expect(
            await createLocation(sql, me, {
                kind: 'bulk',
                label: 'Mine',
                parentId: theirs,
            })
        ).toBeNull();
        const inside = await createLocation(sql, me, {
            kind: 'keepers',
            label: 'Binder',
            parentId: await bag(me, 'Shoebox'),
        });
        expect(inside?.parentId).not.toBeNull();
    });

    it('renames, and archives only an empty location', async () => {
        const id = await bag(me, 'Bag');
        const renamed = await updateLocation(sql, me, id, { label: 'Bag 2' });
        expect(renamed).toMatchObject({
            status: 'updated',
            location: { label: 'Bag 2', archivedAt: null },
        });

        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: id, quantity: 1 },
        ]);
        expect(await updateLocation(sql, me, id, { archived: true })).toEqual({
            status: 'not_empty',
        });

        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: id, toId: unsorted, quantity: 1 },
        ]);
        const archived = await updateLocation(sql, me, id, { archived: true });
        expect(archived).toMatchObject({ status: 'updated' });
        expect((await listLocations(sql, me)).map((l) => l.id)).not.toContain(
            id
        );
        expect(
            (await listLocations(sql, me, { includeArchived: true })).map(
                (l) => l.id
            )
        ).toContain(id);

        const restored = await updateLocation(sql, me, id, { archived: false });
        expect(restored).toMatchObject({
            status: 'updated',
            location: { archivedAt: null },
        });
    });

    it('sets and clears a note without touching the label', async () => {
        const id = await bag(me, 'Bag');
        const set = await updateLocation(sql, me, id, { note: 'Top shelf' });
        expect(set).toMatchObject({
            location: { label: 'Bag', note: 'Top shelf' },
        });
        const cleared = await updateLocation(sql, me, id, { note: null });
        expect(cleared).toMatchObject({ location: { note: null } });
    });

    it('does not rename or archive Unsorted', async () => {
        expect(await updateLocation(sql, me, unsorted, { label: 'X' })).toEqual(
            {
                status: 'system',
            }
        );
    });

    it("is not_found for another user's location", async () => {
        const theirs = await bag(other, 'Their box');
        expect(
            await updateLocation(sql, me, theirs, { label: 'Mine' })
        ).toEqual({
            status: 'not_found',
        });
        expect((await listLocations(sql, other)).map((l) => l.label)).toContain(
            'Their box'
        );
    });
});

describe('recordMoves', () => {
    it('moves copies and updates placements and counts', async () => {
        const id = await bag(me, 'Bag');
        const result = await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: id, quantity: 2 },
        ]);
        expect(result).toEqual({ status: 'moved', moved: 2 });

        const placements = await listPlacements(sql, me, BOLT);
        expect(placements.map((p) => [p.label, p.quantity])).toEqual([
            ['Unsorted', 1],
            ['Bag', 2],
        ]);
        // The collection total does not change when cards stay in the collection.
        expect((await listCollection(sql, me))[0].quantity).toBe(3);
    });

    it('rejects a line that asks for more copies than the source holds', async () => {
        const id = await bag(me, 'Bag');
        const result = await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: id, quantity: 4 },
        ]);
        expect(result).toEqual({ status: 'short', lines: [0] });
        expect((await listPlacements(sql, me, BOLT))[0].quantity).toBe(3);
    });

    it('rejects a card the source does not hold at all', async () => {
        const id = await bag(me, 'Bag');
        expect(
            await recordMoves(sql, me, [
                { oracleId: RING, fromId: unsorted, toId: id, quantity: 1 },
            ])
        ).toEqual({ status: 'short', lines: [0] });
    });

    it('rolls the whole batch back when one line is short', async () => {
        await own(me, RING, 'Sol Ring', 1);
        const id = await bag(me, 'Bag');
        const before = await query('select count(*)::int as n from moves');
        const result = await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: id, quantity: 2 },
            { oracleId: RING, fromId: unsorted, toId: id, quantity: 2 },
        ]);
        expect(result).toEqual({ status: 'short', lines: [1] });
        // The good first line did not apply either.
        expect(await listPlacements(sql, me, BOLT)).toMatchObject([
            { label: 'Unsorted', quantity: 3 },
        ]);
        const after = await query('select count(*)::int as n from moves');
        expect(after[0].n).toBe(before[0].n);
    });

    it('lets lines for the same card and source draw from the same copies', async () => {
        const a = await bag(me, 'A');
        const b = await bag(me, 'B');
        // 2 + 2 is more than the 3 held, even though each line alone fits.
        expect(
            await recordMoves(sql, me, [
                { oracleId: BOLT, fromId: unsorted, toId: a, quantity: 2 },
                { oracleId: BOLT, fromId: unsorted, toId: b, quantity: 2 },
            ])
        ).toEqual({ status: 'short', lines: [1] });
        expect(
            await recordMoves(sql, me, [
                { oracleId: BOLT, fromId: unsorted, toId: a, quantity: 2 },
                { oracleId: BOLT, fromId: unsorted, toId: b, quantity: 1 },
            ])
        ).toEqual({ status: 'moved', moved: 3 });
        expect(
            (await listPlacements(sql, me, BOLT)).map((p) => [
                p.label,
                p.quantity,
            ])
        ).toEqual([
            ['A', 2],
            ['B', 1],
        ]);
    });

    it('moves the oldest copies first', async () => {
        const id = await bag(me, 'Bag');
        const [oldest] = await query(
            'select id from copies where user_id = $1 order by created_at, id limit 1',
            [me]
        );
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: id, quantity: 1 },
        ]);
        const [moved] = await query(
            'select location_id from copies where id = $1',
            [oldest.id]
        );
        expect(moved.location_id).toBe(id);
    });

    it('rejects an archived destination and unknown locations', async () => {
        const id = await bag(me, 'Bag');
        await updateLocation(sql, me, id, { archived: true });
        const line = {
            oracleId: BOLT,
            fromId: unsorted,
            toId: id,
            quantity: 1,
        };
        expect(await recordMoves(sql, me, [line])).toEqual({
            status: 'bad_location',
        });
        expect(
            await recordMoves(sql, me, [{ ...line, toId: MISSING }])
        ).toEqual({ status: 'bad_location' });
        expect((await listPlacements(sql, me, BOLT))[0].quantity).toBe(3);
    });

    it('does nothing for an empty batch', async () => {
        expect(await recordMoves(sql, me, [])).toEqual({
            status: 'moved',
            moved: 0,
        });
    });

    it("cannot touch another user's locations or copies", async () => {
        await own(other, BOLT, 'Lightning Bolt', 5);
        const theirUnsorted = await unsortedOf(other);
        const theirBag = await bag(other, 'Their bag');
        const mine = await bag(me, 'Mine');

        // Pulling from their location, or pushing into one, is refused.
        expect(
            await recordMoves(sql, me, [
                {
                    oracleId: BOLT,
                    fromId: theirUnsorted,
                    toId: mine,
                    quantity: 1,
                },
            ])
        ).toEqual({ status: 'bad_location' });
        expect(
            await recordMoves(sql, me, [
                {
                    oracleId: BOLT,
                    fromId: unsorted,
                    toId: theirBag,
                    quantity: 1,
                },
            ])
        ).toEqual({ status: 'bad_location' });

        expect((await listPlacements(sql, other, BOLT))[0].quantity).toBe(5);
        expect((await listPlacements(sql, me, BOLT))[0].quantity).toBe(3);
        expect(await listHistory(sql, other, RING)).toEqual([]);
    });
});

describe('listHistory', () => {
    it('lists moves newest first, grouping copies moved together', async () => {
        const a = await bag(me, 'A');
        const b = await bag(me, 'B');
        await recordMoves(
            sql,
            me,
            [{ oracleId: BOLT, fromId: unsorted, toId: a, quantity: 2 }],
            'Sorting'
        );
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: a, toId: b, quantity: 1 },
        ]);

        const history = await listHistory(sql, me, BOLT);
        expect(
            history.map((h) => [h.fromLabel, h.toLabel, h.quantity, h.note])
        ).toEqual([
            ['A', 'B', 1, null],
            ['Unsorted', 'A', 2, 'Sorting'],
            [null, 'Unsorted', 3, null],
        ]);
        const times = history.map((h) => Date.parse(h.createdAt));
        expect([...times].sort((x, y) => y - x)).toEqual(times);
    });

    it("never shows another user's moves", async () => {
        await own(other, BOLT, 'Lightning Bolt', 2);
        expect(await listHistory(sql, other, BOLT)).toHaveLength(1);
        expect(await listHistory(sql, me, BOLT)).toHaveLength(1);
        const mine = (await listHistory(sql, me, BOLT))[0];
        expect(mine.quantity).toBe(3);
    });
});

describe('listAllPlacements', () => {
    it('lists every owned card by location, for this user only', async () => {
        await own(me, RING, 'The One Ring', 1);
        await own(other, BOLT, 'Lightning Bolt', 5);
        const id = await bag(me, 'Bag');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: id, quantity: 2 },
        ]);

        const all = await listAllPlacements(sql, me);
        expect(
            all
                .map((p) => [p.oracleId, p.label, p.quantity])
                .sort((a, b) => String(a).localeCompare(String(b)))
        ).toEqual([
            [BOLT, 'Bag', 2],
            [BOLT, 'Unsorted', 1],
            [RING, 'Unsorted', 1],
        ]);
        // Same per-card order as listPlacements.
        expect(
            all.filter((p) => p.oracleId === BOLT).map((p) => p.label)
        ).toEqual((await listPlacements(sql, me, BOLT)).map((p) => p.label));
    });
});
