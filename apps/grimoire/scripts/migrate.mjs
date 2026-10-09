// Applies db/migrations/*.sql to the database in DATABASE_URL.
// Usage: DATABASE_URL=... pnpm nx run grimoire:migrate
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { runMigrations } from './migrateLib.mjs';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
}

const dir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'db',
    'migrations'
);
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
const migrations = await Promise.all(
    files.map(async (name) => ({
        name,
        sql: await readFile(path.join(dir, name), 'utf8'),
    }))
);

const sql = neon(databaseUrl);
const applied = await runMigrations({
    query: (text, params) => sql.query(text, params),
    migrations,
});

console.log(
    applied.length
        ? `Applied: ${applied.join(', ')}`
        : 'Database is up to date.'
);
