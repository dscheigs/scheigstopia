import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { addToCollection, listCollection } from '@/lib/collection';
import type { Sql } from '@/lib/db';
import {
    createLocation,
    listAllPlacements,
    listHistory,
    listLocationContents,
    listLocations,
    listPlacements,
    listRareCandidates,
    listRecentMoves,
    recordMoves,
    setRareRule,
    undoMove,
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

describe('listLocationContents', () => {
    it('lists the cards in a location sorted by name, with quantities', async () => {
        await own(me, RING, 'Arcane Signet', 2);
        const contents = await listLocationContents(sql, me, unsorted);
        expect(contents?.location.label).toBe('Unsorted');
        expect(contents?.cards).toEqual([
            { oracleId: RING, name: 'Arcane Signet', quantity: 2 },
            { oracleId: BOLT, name: 'Lightning Bolt', quantity: 3 },
        ]);
    });

    it("is empty for a new location and null for another user's", async () => {
        const box = await bag(me, 'Shoebox');
        expect((await listLocationContents(sql, me, box))?.cards).toEqual([]);
        expect(await listLocationContents(sql, other, box)).toBeNull();
        expect(await listLocationContents(sql, me, MISSING)).toBeNull();
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

describe('rare candidates and override', () => {
    it('lists copies in Unsorted and bulk, not in keepers or decks', async () => {
        const binder = await bag(me, 'Binder A', 'keepers');
        const deck = await bag(me, 'Frame', 'deck');
        const shoebox = await bag(me, 'Shoebox');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: shoebox, quantity: 1 },
            { oracleId: BOLT, fromId: unsorted, toId: binder, quantity: 1 },
        ]);
        let groups = await listRareCandidates(sql, me);
        expect(groups.map((g) => [g.label, g.quantity])).toEqual([
            ['Shoebox', 1],
            ['Unsorted', 1],
        ]);
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: deck, quantity: 1 },
            { oracleId: BOLT, fromId: shoebox, toId: binder, quantity: 1 },
        ]);
        groups = await listRareCandidates(sql, me);
        expect(groups).toEqual([]);
    });

    it('drops copies overridden to bulk and keeps those marked keep', async () => {
        const shoebox = await bag(me, 'Shoebox');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: shoebox, quantity: 1 },
        ]);
        expect(
            await setRareRule(sql, me, {
                oracleId: BOLT,
                locationId: shoebox,
                rule: 'bulk',
            })
        ).toBe(1);
        let groups = await listRareCandidates(sql, me);
        expect(groups.map((g) => g.label)).toEqual(['Unsorted']);

        await setRareRule(sql, me, {
            oracleId: BOLT,
            locationId: unsorted,
            rule: 'keep',
        });
        groups = await listRareCandidates(sql, me);
        expect(groups.map((g) => [g.label, g.rareRule])).toEqual([
            ['Unsorted', 'keep'],
        ]);

        await setRareRule(sql, me, {
            oracleId: BOLT,
            locationId: shoebox,
            rule: null,
        });
        groups = await listRareCandidates(sql, me);
        expect(groups.map((g) => g.label)).toEqual(['Shoebox', 'Unsorted']);
    });

    it('keeps the override with the copy when it moves', async () => {
        const shoebox = await bag(me, 'Shoebox');
        const box2 = await bag(me, 'Box 2');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: shoebox, quantity: 3 },
        ]);
        await setRareRule(sql, me, {
            oracleId: BOLT,
            locationId: shoebox,
            rule: 'bulk',
        });
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: shoebox, toId: box2, quantity: 3 },
        ]);
        expect(await listRareCandidates(sql, me)).toEqual([]);
    });

    it("never touches or lists another user's copies", async () => {
        await own(other, BOLT, 'Lightning Bolt', 1);
        const theirs = await unsortedOf(other);
        expect(
            await setRareRule(sql, me, {
                oracleId: BOLT,
                locationId: theirs,
                rule: 'bulk',
            })
        ).toBe(0);
        const groups = await listRareCandidates(sql, me);
        expect(groups.map((g) => g.quantity)).toEqual([3]);
        expect((await listRareCandidates(sql, other))[0].rareRule).toBeNull();
    });
});

describe('recent moves and undo', () => {
    it('lists moves between locations, newest first, and leaves out adds', async () => {
        const a = await bag(me, 'A');
        const b = await bag(me, 'B');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: a, quantity: 2 },
        ]);
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: b, quantity: 1 },
        ]);
        const recent = await listRecentMoves(sql, me);
        expect(
            recent.map((m) => [m.fromLabel, m.toLabel, m.quantity, m.undoable])
        ).toEqual([
            ['Unsorted', 'B', 1, true],
            ['Unsorted', 'A', 2, true],
        ]);
        expect(recent[0].name).toBe('Lightning Bolt');
    });

    it("does not show another user's moves", async () => {
        const mine = await bag(me, 'A');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: mine, quantity: 1 },
        ]);
        expect(await listRecentMoves(sql, other)).toEqual([]);
    });

    it('undoes a move with a compensating move and keeps both in the history', async () => {
        const a = await bag(me, 'A');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: a, quantity: 2 },
        ]);
        const [move] = await listRecentMoves(sql, me);
        expect(await undoMove(sql, me, move.id)).toEqual({
            status: 'undone',
            undone: 2,
        });
        expect(
            (await listPlacements(sql, me, BOLT)).map((p) => [
                p.label,
                p.quantity,
            ])
        ).toEqual([['Unsorted', 3]]);
        const history = await listHistory(sql, me, BOLT);
        expect(history.map((h) => [h.fromLabel, h.toLabel, h.note])).toEqual([
            ['A', 'Unsorted', 'Undo'],
            ['Unsorted', 'A', null],
            [null, 'Unsorted', null],
        ]);
        // The original is no longer undoable; the undo itself can be.
        const recent = await listRecentMoves(sql, me);
        expect(recent.map((m) => m.undoable)).toEqual([true, false]);
    });

    it('refuses to undo once the cards have moved on', async () => {
        const a = await bag(me, 'A');
        const b = await bag(me, 'B');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: a, quantity: 2 },
        ]);
        const [first] = await listRecentMoves(sql, me);
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: a, toId: b, quantity: 1 },
        ]);
        expect(await undoMove(sql, me, first.id)).toEqual({
            status: 'moved_on',
        });
        // Nothing changed.
        expect(
            (await listPlacements(sql, me, BOLT)).map((p) => [
                p.label,
                p.quantity,
            ])
        ).toEqual([
            ['Unsorted', 1],
            ['A', 1],
            ['B', 1],
        ]);
        const recent = await listRecentMoves(sql, me);
        expect(recent.find((m) => m.id === first.id)?.undoable).toBe(false);
    });

    it("refuses to undo an add, a missing move, or another user's move", async () => {
        const first = await query(
            'select id::int as id from moves where from_location is null limit 1'
        );
        expect(await undoMove(sql, me, Number(first[0].id))).toEqual({
            status: 'not_undoable',
        });
        expect(await undoMove(sql, me, 999999)).toEqual({
            status: 'not_found',
        });
        const a = await bag(me, 'A');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: a, quantity: 1 },
        ]);
        const [move] = await listRecentMoves(sql, me);
        expect(await undoMove(sql, other, move.id)).toEqual({
            status: 'not_found',
        });
    });

    it('refuses to undo into a location that has since been archived', async () => {
        const a = await bag(me, 'A');
        const b = await bag(me, 'B');
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: unsorted, toId: a, quantity: 1 },
        ]);
        await recordMoves(sql, me, [
            { oracleId: BOLT, fromId: a, toId: b, quantity: 1 },
        ]);
        const [latest] = await listRecentMoves(sql, me);
        // A is empty now, so it can be archived.
        await updateLocation(sql, me, a, { archived: true });
        expect(await undoMove(sql, me, latest.id)).toEqual({
            status: 'bad_location',
        });
        expect(latest.undoable).toBe(true);
        expect((await listRecentMoves(sql, me))[0].undoable).toBe(false);
    });
});
