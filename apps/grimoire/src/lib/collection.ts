import type { Sql } from '@/lib/db';
import { MAX_QUANTITY } from '@/lib/validation';

export interface CollectionItem {
    oracleId: string;
    name: string;
    quantity: number;
    updatedAt: string;
}

function toItem(row: Record<string, unknown>): CollectionItem {
    return {
        oracleId: String(row.oracle_id),
        name: String(row.name),
        quantity: Number(row.quantity),
        updatedAt: new Date(row.updated_at as string | Date).toISOString(),
    };
}

/** Every card the user owns, alphabetical. */
export async function listCollection(
    sql: Sql,
    userId: string
): Promise<CollectionItem[]> {
    const rows = await sql`
        select oracle_id, name, quantity, updated_at
        from collection
        where user_id = ${userId}
        order by lower(name), oracle_id
    `;
    return rows.map(toItem);
}

/*
 * The collection is a view over the move ledger (see migration 0003). Every
 * write records moves, into or out of the user's Unsorted location for now,
 * and stays a single statement so it applies fully or not at all. Neon's HTTP
 * client has no interactive transaction, and `Sql.transaction` is not atomic
 * in the PGlite test double, so one statement is the form that behaves the
 * same in production and in tests.
 *
 * Copies held, per card, are moves in minus moves out. The `unsorted` CTE
 * below creates the user's Unsorted location when it is missing (a user who
 * signed in after the migration) and otherwise finds it.
 */

/**
 * Add `delta` copies, creating the card if needed. Caps at the maximum: an add
 * that would pass it records only the copies that fit, and none at the cap.
 */
export async function addToCollection(
    sql: Sql,
    userId: string,
    card: { oracleId: string; name: string; delta: number }
): Promise<CollectionItem> {
    const rows = await sql`
        with cur as (
            select coalesce(
                sum(case when to_location is not null then quantity else 0 end)
                - sum(case when from_location is not null then quantity else 0 end),
                0
            )::integer as q
            from moves
            where user_id = ${userId}::uuid and oracle_id = ${card.oracleId}::uuid
        ),
        new_unsorted as (
            insert into locations (user_id, kind, label)
            values (${userId}::uuid, 'unsorted', 'Unsorted')
            on conflict (user_id) where kind = 'unsorted' do nothing
            returning id
        ),
        unsorted as (
            select id from new_unsorted
            union all
            select id from locations
            where user_id = ${userId}::uuid and kind = 'unsorted'
            limit 1
        ),
        mv as (
            insert into moves (user_id, oracle_id, name, from_location, to_location, quantity)
            select ${userId}::uuid, ${card.oracleId}::uuid, ${card.name}, null, unsorted.id,
                least(${card.delta}::integer, ${MAX_QUANTITY}::integer - cur.q)
            from cur, unsorted
            where least(${card.delta}::integer, ${MAX_QUANTITY}::integer - cur.q) > 0
            returning quantity, created_at
        )
        select
            ${card.oracleId}::uuid as oracle_id,
            ${card.name}::text as name,
            cur.q + coalesce((select quantity from mv), 0) as quantity,
            coalesce(
                (select created_at from mv),
                (select updated_at from collection
                    where user_id = ${userId}::uuid and oracle_id = ${card.oracleId}::uuid)
            ) as updated_at
        from cur
    `;
    return toItem(rows[0]);
}

/**
 * Add many cards in one statement, so it applies fully or not at all.
 * Repeated oracle ids are summed first, since one statement cannot treat a
 * card twice. Same cap and result behavior as `addToCollection`.
 */
export async function addManyToCollection(
    sql: Sql,
    userId: string,
    cards: { oracleId: string; name: string; delta: number }[]
): Promise<CollectionItem[]> {
    const merged = new Map<
        string,
        { oracle_id: string; name: string; delta: number }
    >();
    for (const card of cards) {
        const existing = merged.get(card.oracleId);
        merged.set(card.oracleId, {
            oracle_id: card.oracleId,
            // The last name wins, like repeated single adds.
            name: card.name,
            delta: Math.min((existing?.delta ?? 0) + card.delta, MAX_QUANTITY),
        });
    }
    if (merged.size === 0) return [];

    const rows = await sql`
        with input as (
            select * from jsonb_to_recordset(${JSON.stringify([...merged.values()])}::jsonb)
                as c(oracle_id uuid, name text, delta integer)
        ),
        cur as (
            select i.oracle_id, coalesce(
                sum(case when m.to_location is not null then m.quantity else 0 end)
                - sum(case when m.from_location is not null then m.quantity else 0 end),
                0
            )::integer as q
            from input i
            left join moves m on m.user_id = ${userId}::uuid and m.oracle_id = i.oracle_id
            group by i.oracle_id
        ),
        new_unsorted as (
            insert into locations (user_id, kind, label)
            values (${userId}::uuid, 'unsorted', 'Unsorted')
            on conflict (user_id) where kind = 'unsorted' do nothing
            returning id
        ),
        unsorted as (
            select id from new_unsorted
            union all
            select id from locations
            where user_id = ${userId}::uuid and kind = 'unsorted'
            limit 1
        ),
        mv as (
            insert into moves (user_id, oracle_id, name, from_location, to_location, quantity)
            select ${userId}::uuid, i.oracle_id, i.name, null, unsorted.id,
                least(i.delta, ${MAX_QUANTITY}::integer - cur.q)
            from input i
            join cur on cur.oracle_id = i.oracle_id
            cross join unsorted
            where least(i.delta, ${MAX_QUANTITY}::integer - cur.q) > 0
            returning oracle_id, quantity, created_at
        )
        select
            i.oracle_id,
            i.name,
            cur.q + coalesce(mv.quantity, 0) as quantity,
            coalesce(mv.created_at, now()) as updated_at
        from input i
        join cur on cur.oracle_id = i.oracle_id
        left join mv on mv.oracle_id = i.oracle_id
    `;
    return rows.map(toItem);
}

export type SetQuantityResult =
    | { status: 'updated'; item: CollectionItem }
    | { status: 'removed' }
    | { status: 'not_found' };

/** Set an exact quantity. Zero removes the card. */
export async function setQuantity(
    sql: Sql,
    userId: string,
    oracleId: string,
    quantity: number
): Promise<SetQuantityResult> {
    if (quantity === 0) {
        const removed = await removeFromCollection(sql, userId, oracleId);
        return removed ? { status: 'removed' } : { status: 'not_found' };
    }
    const rows = await sql`
        with cur as (
            select
                coalesce(
                    sum(case when to_location is not null then quantity else 0 end)
                    - sum(case when from_location is not null then quantity else 0 end),
                    0
                )::integer as q,
                (array_agg(name order by id desc))[1] as name,
                max(created_at) as at
            from moves
            where user_id = ${userId}::uuid and oracle_id = ${oracleId}::uuid
        ),
        unsorted as (
            select id from locations
            where user_id = ${userId}::uuid and kind = 'unsorted'
        ),
        mv as (
            insert into moves (user_id, oracle_id, name, from_location, to_location, quantity)
            select ${userId}::uuid, ${oracleId}::uuid, cur.name,
                case when ${quantity}::integer < cur.q then unsorted.id end,
                case when ${quantity}::integer > cur.q then unsorted.id end,
                abs(${quantity}::integer - cur.q)
            from cur, unsorted
            where cur.q > 0 and ${quantity}::integer <> cur.q
            returning created_at
        )
        select
            ${oracleId}::uuid as oracle_id,
            cur.name,
            ${quantity}::integer as quantity,
            coalesce((select created_at from mv), cur.at) as updated_at
        from cur
        where cur.q > 0
    `;
    return rows.length > 0
        ? { status: 'updated', item: toItem(rows[0]) }
        : { status: 'not_found' };
}

/** Remove a card from the collection. Returns whether it was owned. */
export async function removeFromCollection(
    sql: Sql,
    userId: string,
    oracleId: string
): Promise<boolean> {
    const rows = await sql`
        with cur as (
            select
                coalesce(
                    sum(case when to_location is not null then quantity else 0 end)
                    - sum(case when from_location is not null then quantity else 0 end),
                    0
                )::integer as q,
                (array_agg(name order by id desc))[1] as name
            from moves
            where user_id = ${userId}::uuid and oracle_id = ${oracleId}::uuid
        ),
        unsorted as (
            select id from locations
            where user_id = ${userId}::uuid and kind = 'unsorted'
        )
        insert into moves (user_id, oracle_id, name, from_location, to_location, quantity, note)
        select ${userId}::uuid, ${oracleId}::uuid, cur.name, unsorted.id, null, cur.q, 'Removed'
        from cur, unsorted
        where cur.q > 0
        returning id
    `;
    return rows.length > 0;
}
