import { neon } from '@neondatabase/serverless';

/**
 * The only database surface the app code depends on: a tagged-template
 * function that returns rows, plus `transaction` for batches. Neon's `neon()` client satisfies it, and the
 * tests satisfy it with an in-process Postgres (PGlite).
 */
export type Rows = Record<string, unknown>[];

export interface Sql {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<Rows>;
    /** Run the queries in order inside one transaction. */
    transaction(queries: Promise<Rows>[]): Promise<Rows[]>;
}

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
