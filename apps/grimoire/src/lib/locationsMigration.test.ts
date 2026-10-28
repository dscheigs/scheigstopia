import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';
import { runMigrations } from '../../scripts/migrateLib.mjs';
import { loadMigrations } from '@/test/db';

const BOLT = '00000000-0000-4000-8000-000000000001';
const RING = '00000000-0000-4000-8000-000000000003';

/** A database at the schema before locations, with a few collection rows. */
async function legacyDb() {
    const pg = new PGlite();
    const query = async (text: string, params?: unknown[]) =>
        (await pg.query(text, params)).rows as Record<string, unknown>[];
    const all = await loadMigrations();
    const before = all.filter((m) => m.name < '0003');
    const after = all.filter((m) => m.name >= '0003');
    await runMigrations({ query, migrations: before });

    const [a] = await query(
        "insert into users (github_id, login) values (1, 'a') returning id"
    );
    const [b] = await query(
        "insert into users (github_id, login) values (2, 'b') returning id"
    );
    await query(
        `insert into collection (user_id, oracle_id, name, quantity, created_at, updated_at)
         values ($1, $2, 'Lightning Bolt', 3, '2026-01-02T00:00:00Z', '2026-02-03T00:00:00Z'),
                ($1, $3, 'Sol Ring', 1, '2026-01-05T00:00:00Z', '2026-01-05T00:00:00Z'),
                ($4, $2, 'Lightning Bolt', 9, '2026-03-01T00:00:00Z', '2026-03-01T00:00:00Z')`,
        [a.id, BOLT, RING, b.id]
    );
    return { query, after, a: String(a.id), b: String(b.id) };
}

describe('migration 0003: locations and moves', () => {
    it('gives every user an Unsorted location', async () => {
        const { query, after } = await legacyDb();
        await runMigrations({ query, migrations: after });
        const rows = await query(
            "select user_id from locations where kind = 'unsorted' and label = 'Unsorted'"
        );
        expect(rows).toHaveLength(2);
    });

    it('backfills one copy per unit owned, each with an opening-balance move', async () => {
        const { query, after, a } = await legacyDb();
        await runMigrations({ query, migrations: after });
        const copies = await query(
            `select c.oracle_id, c.created_at, l.kind
             from copies c join locations l on l.id = c.location_id
             where c.user_id = $1 order by c.oracle_id`,
            [a]
        );
        // 3 Lightning Bolts and 1 Sol Ring, all in Unsorted.
        expect(copies).toHaveLength(4);
        expect(copies.filter((c) => c.oracle_id === BOLT)).toHaveLength(3);
        expect(copies.every((c) => c.kind === 'unsorted')).toBe(true);
        expect(new Date(copies[0].created_at as string).toISOString()).toBe(
            '2026-01-02T00:00:00.000Z'
        );
        const moves = await query(
            `select m.from_location, m.to_location, m.note, m.created_at
             from moves m where m.user_id = $1`,
            [a]
        );
        expect(moves).toHaveLength(4);
        expect(
            moves.every(
                (m) =>
                    m.from_location === null &&
                    m.to_location !== null &&
                    m.note === 'Opening balance'
            )
        ).toBe(true);
    });

    it('keeps the collection view equal to the old table', async () => {
        const { query, after } = await legacyDb();
        const before = await query(
            'select user_id, oracle_id, name, quantity from collection order by user_id, oracle_id'
        );
        await runMigrations({ query, migrations: after });
        const view = await query(
            'select user_id, oracle_id, name, quantity from collection order by user_id, oracle_id'
        );
        expect(view).toEqual(before);
        const [row] = await query(
            'select created_at, updated_at from collection where oracle_id = $1 and quantity = 3',
            [BOLT]
        );
        expect(new Date(row.created_at as string).toISOString()).toBe(
            '2026-01-02T00:00:00.000Z'
        );
    });

    it('is a no-op the second time, and keeps the old table as collection_legacy', async () => {
        const { query, after } = await legacyDb();
        expect(await runMigrations({ query, migrations: after })).toEqual([
            '0003_locations_and_moves.sql',
        ]);
        expect(await runMigrations({ query, migrations: after })).toEqual([]);
        // 3 + 1 + 9 copies and one opening move each; the old table is kept.
        expect(await query('select 1 from copies')).toHaveLength(13);
        expect(await query('select 1 from moves')).toHaveLength(13);
        expect(await query('select 1 from collection_legacy')).toHaveLength(3);
    });

    it('can run the early steps again without duplicating rows', async () => {
        const { query, after } = await legacyDb();
        await runMigrations({ query, migrations: after });
        // Re-run the idempotent steps (everything before the table swap).
        const sql = after[0].sql;
        const steps = sql
            .split('\n')
            .filter((l) => !l.trim().startsWith('--'))
            .join('\n')
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, -2);
        for (const step of steps) await query(step);
        expect(await query('select 1 from copies')).toHaveLength(13);
        expect(await query('select 1 from moves')).toHaveLength(13);
        expect(await query('select 1 from locations')).toHaveLength(2);
    });
});
