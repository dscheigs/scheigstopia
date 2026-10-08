import type { Sql } from '@/lib/db';

/**
 * Create the user for a GitHub account on first sign-in, or refresh the login.
 * Everything else in the app is keyed to the returned internal id, not the
 * GitHub id, so other sign-in methods can be added later.
 */
export async function upsertUser(
    sql: Sql,
    githubId: number,
    login: string
): Promise<string> {
    const rows = await sql`
        insert into users (github_id, login)
        values (${githubId}, ${login})
        on conflict (github_id) do update set login = excluded.login
        returning id
    `;
    return String(rows[0].id);
}
