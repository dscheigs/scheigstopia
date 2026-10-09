import type { Sql } from '@/lib/db';

export interface IdentifyLimits {
    perMinute: number;
    perDay: number;
    perMonth: number;
}

export const DEFAULT_LIMITS: IdentifyLimits = {
    perMinute: 10,
    perDay: 100,
    perMonth: 1000,
};

function positiveInt(value: string | undefined, fallback: number): number {
    const n = Number(value);
    return value && Number.isInteger(n) && n > 0 ? n : fallback;
}

/** Limits from env, falling back to the defaults for unset or invalid values. */
export function readLimits(
    env: Record<string, string | undefined> = process.env
): IdentifyLimits {
    return {
        perMinute: positiveInt(
            env.IDENTIFY_LIMIT_PER_MINUTE,
            DEFAULT_LIMITS.perMinute
        ),
        perDay: positiveInt(env.IDENTIFY_LIMIT_PER_DAY, DEFAULT_LIMITS.perDay),
        perMonth: positiveInt(
            env.IDENTIFY_LIMIT_PER_MONTH,
            DEFAULT_LIMITS.perMonth
        ),
    };
}

export type Window = 'minute' | 'day' | 'month';

export type ReserveResult =
    | { allowed: true; id: string }
    | { allowed: false; window: Window };

export interface IdentifyUsage {
    minute: number;
    day: number;
    month: number;
}

// Days and months are UTC calendar periods, so the monthly cap lines up with
// the Anthropic workspace's monthly spend limit.
export async function getUsage(
    sql: Sql,
    userId: string
): Promise<IdentifyUsage> {
    const rows = await sql`
        select
            count(*) filter (where created_at > now() - interval '1 minute') as minute,
            count(*) filter (where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc') as day,
            count(*) as month
        from identify_log
        where user_id = ${userId}
          and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'
    `;
    const row = rows[0] ?? {};
    return {
        minute: Number(row.minute ?? 0),
        day: Number(row.day ?? 0),
        month: Number(row.month ?? 0),
    };
}

/**
 * Count one identification against the limits, before the paid call is made.
 * Refused requests are not counted. Under READ COMMITTED, a single statement
 * cannot see rows other in-flight requests have not committed yet, so a
 * per-user advisory lock goes first in the same transaction: the next request
 * waits for the previous commit, and its insert statement then sees that row.
 * The lock is released at commit, before the paid call.
 */
export async function reserveIdentify(
    sql: Sql,
    userId: string,
    limits: IdentifyLimits
): Promise<ReserveResult> {
    const [, inserted] = await sql.transaction([
        sql`select pg_advisory_xact_lock(hashtext(${userId}))`,
        sql`
        insert into identify_log (user_id)
        select ${userId}
        where (
            select count(*) from identify_log
            where user_id = ${userId} and created_at > now() - interval '1 minute'
        ) < ${limits.perMinute}
        and (
            select count(*) from identify_log
            where user_id = ${userId}
              and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
        ) < ${limits.perDay}
        and (
            select count(*) from identify_log
            where user_id = ${userId}
              and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'
        ) < ${limits.perMonth}
        returning id
    `,
    ]);
    if (inserted.length > 0)
        return { allowed: true, id: String(inserted[0].id) };

    // Refused: say which limit, most lasting first, so the message is honest.
    const usage = await getUsage(sql, userId);
    if (usage.month >= limits.perMonth)
        return { allowed: false, window: 'month' };
    if (usage.day >= limits.perDay) return { allowed: false, window: 'day' };
    return { allowed: false, window: 'minute' };
}

/** Give back a reservation when the paid call did not happen or failed. */
export async function releaseIdentify(
    sql: Sql,
    userId: string,
    id: string
): Promise<void> {
    await sql`delete from identify_log where id = ${id} and user_id = ${userId}`;
}

export const limitMessage: Record<Window, string> = {
    minute: "You're scanning too fast. Wait a few seconds and try again.",
    day: "You've hit today's scan limit. It resets at midnight UTC.",
    month: "You've hit this month's scan limit. It resets on the 1st (UTC).",
};
