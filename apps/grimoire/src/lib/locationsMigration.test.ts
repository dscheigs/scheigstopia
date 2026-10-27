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

    it('backfills one opening-balance move per row, dated by created_at', async () => {
        const { query, after, a } = await legacyDb();
        await runMigrations({ query, migrations: after });
        const rows = await query(
            `select m.oracle_id, m.quantity, m.created_at, m.from_location, l.kind
             from moves m join locations l on l.id = m.to_location
             where m.user_id = $1 order by m.oracle_id`,
            [a]
        );
        expect(rows).toHaveLength(2);
        expect(rows[0]).toMatchObject({
            oracle_id: BOLT,
            quantity: 3,
            from_location: null,
            kind: 'unsorted',
        });
        expect(new Date(rows[0].created_at as string).toISOString()).toBe(
            '2026-01-02T00:00:00.000Z'
        );
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
        expect(await query('select 1 from moves')).toHaveLength(3);
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
        expect(await query('select 1 from moves')).toHaveLength(3);
        expect(await query('select 1 from locations')).toHaveLength(2);
    });
});
