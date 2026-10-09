import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Sql } from '@/lib/db';
import {
    getUsage,
    readLimits,
    releaseIdentify,
    reserveIdentify,
} from '@/lib/identify-limits';
import { upsertUser } from '@/lib/users';
import { createTestDb } from '@/test/db';

const LIMITS = { perMinute: 3, perDay: 5, perMonth: 8 };

let sql: Sql;
let query: Awaited<ReturnType<typeof createTestDb>>['query'];
let me: string;
let other: string;

beforeAll(async () => {
    const db = await createTestDb();
    sql = db.sql;
    query = db.query;
});

beforeEach(async () => {
    await query('truncate users cascade');
    me = await upsertUser(sql, 1001, 'me');
    other = await upsertUser(sql, 2002, 'someone-else');
});

/** Backdate `count` rows so they fall outside the one-minute window. */
const addOld = (userId: string, count: number, interval: string) =>
    query(
        `insert into identify_log (user_id, created_at)
         select $1, now() - $2::interval from generate_series(1, $3)`,
        [userId, interval, count]
    );

describe('reserveIdentify', () => {
    it('allows requests under the limits and counts them', async () => {
        for (let i = 0; i < 3; i++) {
            expect((await reserveIdentify(sql, me, LIMITS)).allowed).toBe(true);
        }
        expect(await getUsage(sql, me)).toMatchObject({ minute: 3, day: 3 });
    });

    it('refuses past the per-minute limit and does not count the refusal', async () => {
        for (let i = 0; i < 3; i++) await reserveIdentify(sql, me, LIMITS);
        expect(await reserveIdentify(sql, me, LIMITS)).toEqual({
            allowed: false,
            window: 'minute',
        });
        expect((await getUsage(sql, me)).minute).toBe(3);
    });

    it('lets the per-minute limit recover as time passes', async () => {
        await addOld(me, 3, '2 minutes');
        expect((await reserveIdentify(sql, me, LIMITS)).allowed).toBe(true);
    });

    it('refuses past the daily limit and reports the day', async () => {
        await query(
            `insert into identify_log (user_id, created_at)
             select $1, date_trunc('day', now() at time zone 'utc') at time zone 'utc'
                        + (g || ' seconds')::interval
             from generate_series(1, 5) g`,
            [me]
        );
        expect(await reserveIdentify(sql, me, LIMITS)).toEqual({
            allowed: false,
            window: 'day',
        });
    });

    it('refuses past the monthly limit and reports the month', async () => {
        await query(
            `insert into identify_log (user_id, created_at)
             select $1, date_trunc('month', now() at time zone 'utc') at time zone 'utc'
                        + (g || ' seconds')::interval
             from generate_series(1, 8) g`,
            [me]
        );
        expect(await reserveIdentify(sql, me, LIMITS)).toEqual({
            allowed: false,
            window: 'month',
        });
    });

    it('ignores last month and other users', async () => {
        await addOld(me, 20, '40 days');
        for (let i = 0; i < 3; i++) await reserveIdentify(sql, other, LIMITS);
        expect((await reserveIdentify(sql, me, LIMITS)).allowed).toBe(true);
    });

    it('does not let concurrent requests slip past the limit', async () => {
        const results = await Promise.all(
            Array.from({ length: 6 }, () => reserveIdentify(sql, me, LIMITS))
        );
        expect(results.filter((r) => r.allowed).length).toBeLessThanOrEqual(3);
    });
});

describe('releaseIdentify', () => {
    it('gives back exactly the reserved row', async () => {
        const first = await reserveIdentify(sql, me, LIMITS);
        await reserveIdentify(sql, me, LIMITS);
        if (!first.allowed) throw new Error('expected allowed');
        await releaseIdentify(sql, me, first.id);
        expect((await getUsage(sql, me)).minute).toBe(1);
    });
});

describe('readLimits', () => {
    it('uses defaults for unset or invalid values', () => {
        expect(readLimits({ IDENTIFY_LIMIT_PER_DAY: 'abc' })).toEqual({
            perMinute: 10,
            perDay: 100,
            perMonth: 1000,
        });
    });

    it('reads positive integers from env', () => {
        expect(
            readLimits({
                IDENTIFY_LIMIT_PER_MINUTE: '5',
                IDENTIFY_LIMIT_PER_DAY: '50',
                IDENTIFY_LIMIT_PER_MONTH: '400',
            })
        ).toEqual({ perMinute: 5, perDay: 50, perMonth: 400 });
    });
});
