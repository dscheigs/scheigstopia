// Minimal SQL migration runner. Driver-agnostic: pass a `query(text, params?)`
// function that resolves to an array of row objects. Used by migrate.mjs (Neon)
// and by the tests (PGlite).

/**
 * Split a migration file into single statements. Migration files must stay
 * simple: no semicolons inside string literals or function bodies.
 * @param {string} text
 * @returns {string[]}
 */
export function splitStatements(text) {
    const withoutComments = text
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n');
    return withoutComments
        .split(';')
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);
}

/**
 * Apply each migration once, in the order given, and record it.
 * @param {{
 *   query: (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>,
 *   migrations: { name: string, sql: string }[],
 * }} options
 * @returns {Promise<string[]>} names of the migrations applied in this run
 */
export async function runMigrations({ query, migrations }) {
    await query(
        `create table if not exists schema_migrations (
            name text primary key,
            applied_at timestamptz not null default now()
        )`
    );
    const done = new Set(
        (await query('select name from schema_migrations')).map((row) =>
            String(row.name)
        )
    );
    const applied = [];
    for (const migration of migrations) {
        if (done.has(migration.name)) continue;
        for (const statement of splitStatements(migration.sql)) {
            await query(statement);
        }
        await query('insert into schema_migrations (name) values ($1)', [
            migration.name,
        ]);
        applied.push(migration.name);
    }
    return applied;
}
