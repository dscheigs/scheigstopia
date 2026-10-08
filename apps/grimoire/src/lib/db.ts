import { neon } from '@neondatabase/serverless';

/**
 * The only database surface the app code depends on: a tagged-template
 * function that returns rows. Neon's `neon()` client satisfies it, and the
 * tests satisfy it with an in-process Postgres (PGlite).
 */
export type Sql = (
    strings: TemplateStringsArray,
    ...values: unknown[]
) => Promise<Record<string, unknown>[]>;

let client: Sql | undefined;

export function getSql(): Sql {
    if (!client) {
        const url = process.env.DATABASE_URL;
        if (!url) {
            throw new Error('DATABASE_URL is not set');
        }
        client = neon(url) as unknown as Sql;
    }
    return client;
}
