import { describe, expect, it } from 'vitest';
import { createTestDb } from '@/test/db';
import { runMigrations, splitStatements } from './migrateLib.mjs';

describe('splitStatements', () => {
    it('splits on semicolons and drops comments and blanks', () => {
        const sql = `-- header comment
create table a (id int);

-- another comment
create table b (id int);
`;
        expect(splitStatements(sql)).toEqual([
            'create table a (id int)',
            'create table b (id int)',
        ]);
    });
});

describe('runMigrations', () => {
    it('applies each migration once and is safe to re-run', async () => {
        const { query, migrations, applied } = await createTestDb();

        expect(applied).toEqual(migrations.map((m) => m.name));
        expect(await runMigrations({ query, migrations })).toEqual([]);

        const recorded = await query('select name from schema_migrations');
        expect(recorded.map((row) => row.name)).toEqual(
            migrations.map((m) => m.name)
        );
    });

    it('creates the tables the app expects', async () => {
        const { query } = await createTestDb();
        const tables = await query(
            `select table_name from information_schema.tables
             where table_schema = 'public' order by table_name`
        );
        expect(tables.map((row) => row.table_name)).toEqual(
            expect.arrayContaining(['collection', 'schema_migrations', 'users'])
        );
    });
});
