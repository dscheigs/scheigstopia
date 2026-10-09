import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { runMigrations } from '../../scripts/migrate-lib.mjs';
import type { Sql } from '@/lib/db';

const migrationsDir = path.join(__dirname, '..', '..', 'db', 'migrations');

export async function loadMigrations() {
    const files = (await readdir(migrationsDir))
        .filter((file) => file.endsWith('.sql'))
        .sort();
    return Promise.all(
        files.map(async (name) => ({
            name,
            sql: await readFile(path.join(migrationsDir, name), 'utf8'),
        }))
    );
}

/** An in-process Postgres with the real migrations applied. */
export async function createTestDb() {
    const pg = new PGlite();
    const migrations = await loadMigrations();
    const query = async (text: string, params?: unknown[]) =>
        (await pg.query(text, params)).rows as Record<string, unknown>[];
    const applied = await runMigrations({ query, migrations });

    const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
        query(
            strings.reduce(
                (text, part, i) =>
                    text + part + (i < values.length ? `$${i + 1}` : ''),
                ''
            ),
            values
        )) as Sql;
    // PGlite runs queries one at a time in call order, so awaiting them all
    // is the same as a batch.
    sql.transaction = (queries) => Promise.all(queries);

    return { pg, sql, query, migrations, applied };
}
