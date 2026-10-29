import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { addManyToLocation, listCollection } from '@/lib/collection';
import type { Sql } from '@/lib/db';
import { upsertUser } from '@/lib/users';
import { createTestDb } from '@/test/db';

const BOLT = '00000000-0000-4000-8000-000000000001';
const RING = '00000000-0000-4000-8000-000000000003';
const ANGEL = '00000000-0000-4000-8000-000000000008';
const MISSING = '00000000-0000-4000-8000-0000000000ff';

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
    await query('truncate users cascade');
    me = await upsertUser(sql, 1001, 'me');
    other = await upsertUser(sql, 2002, 'someone-else');
});

const cards = [
    { oracleId: BOLT, name: 'Lightning Bolt', delta: 2 },
    { oracleId: RING, name: 'Sol Ring', delta: 1 },
];

async function makeBag(userId: string, archived = false): Promise<string> {
    const [row] = await query(
        `insert into locations (user_id, kind, label, archived_at)
         values ($1, 'bulk', 'Bag', ${archived ? 'now()' : 'null'})
         returning id`,
        [userId]
    );
    return String(row.id);
}

describe('addManyToLocation', () => {
    it('creates a new bag and puts the cards in it with moves', async () => {
        const result = await addManyToLocation(sql, me, cards, {
            kind: 'new',
            label: '2026-10-09',
            note: 'Cube night',
        });
        expect(result.status).toBe('added');
        if (result.status !== 'added') return;

        const bags = await query(
            "select id, label, note, kind from locations where user_id = $1 and kind = 'bulk'",
            [me]
        );
        expect(bags).toHaveLength(1);
        expect(bags[0]).toMatchObject({
            label: '2026-10-09',
            note: 'Cube night',
        });
        expect(result.locationId).toBe(bags[0].id);

        const copies = await query(
            'select location_id from copies where user_id = $1',
            [me]
        );
        expect(copies).toHaveLength(3);
        expect(copies.every((c) => c.location_id === bags[0].id)).toBe(true);

        const moves = await query(
            'select from_location, to_location from moves where user_id = $1',
            [me]
        );
        expect(moves).toHaveLength(3);
        expect(
            moves.every(
                (m) => m.from_location === null && m.to_location === bags[0].id
            )
        ).toBe(true);

        // The cards show up in the collection list.
        const owned = await listCollection(sql, me);
        expect(owned.map((c) => [c.name, c.quantity]).sort()).toEqual([
            ['Lightning Bolt', 2],
            ['Sol Ring', 1],
        ]);
    });

    it('adds to an existing bag without creating another', async () => {
        const bag = await makeBag(me);
        const result = await addManyToLocation(sql, me, cards, {
            kind: 'existing',
            locationId: bag,
        });
        expect(result).toMatchObject({ status: 'added', locationId: bag });
        const bags = await query(
            "select id from locations where user_id = $1 and kind = 'bulk'",
            [me]
        );
        expect(bags).toHaveLength(1);
        const copies = await query(
            'select 1 from copies where location_id = $1',
            [bag]
        );
        expect(copies).toHaveLength(3);
    });

    it('defaults to Unsorted without a destination', async () => {
        const result = await addManyToLocation(sql, me, cards);
        expect(result.status).toBe('added');
        const rows = await query(
            `select l.kind from copies c join locations l on l.id = c.location_id
             where c.user_id = $1`,
            [me]
        );
        expect(rows.every((r) => r.kind === 'unsorted')).toBe(true);
    });

    it.each([
        ['another user’s bag', async () => makeBag(other)],
        ['an archived bag', async () => makeBag(me, true)],
        ['a location that does not exist', async () => MISSING],
    ])('refuses %s and changes nothing', async (_label, getId) => {
        const locationId = await getId();
        const result = await addManyToLocation(sql, me, cards, {
            kind: 'existing',
            locationId,
        });
        expect(result).toEqual({ status: 'bad_location' });
        expect(await query('select 1 from copies')).toHaveLength(0);
        expect(await query('select 1 from moves')).toHaveLength(0);
        expect(await listCollection(sql, me)).toEqual([]);
    });

    it('leaves the collection and the new bag unchanged when it fails', async () => {
        await expect(
            addManyToLocation(
                sql,
                me,
                [
                    ...cards,
                    // A NUL byte is not storable in text, so this item fails.
                    { oracleId: ANGEL, name: 'Bad\u0000Name', delta: 1 },
                ],
                { kind: 'new', label: 'Doomed', note: null }
            )
        ).rejects.toThrow();
        const bags = await query(
            "select 1 from locations where user_id = $1 and label = 'Doomed'",
            [me]
        );
        expect(bags).toHaveLength(0);
        expect(await listCollection(sql, me)).toEqual([]);
    });
});
