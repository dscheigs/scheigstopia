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
 * The collection is a view over individual copies (see migration 0003): each
 * physical card is a row in `copies`, and every change is recorded as a row in
 * `moves`. For now every copy lives in the user's Unsorted location; moving
 * copies elsewhere comes with the locations API.
 *
 * Every write is one statement, so it applies fully or not at all. Neon's HTTP
 * client has no interactive transaction, and `Sql.transaction` is not atomic
 * in the PGlite test double, so one statement is the form that behaves the
 * same in production and in tests. The `unsorted` CTE creates the user's
 * Unsorted location when it is missing (a user who signed in after the
 * migration) and otherwise finds it.
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
            select count(*)::integer as q
            from copies
            where user_id = ${userId}::uuid
                and oracle_id = ${card.oracleId}::uuid
                and location_id is not null
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
        added as (
            insert into copies (user_id, oracle_id, name, location_id)
            select ${userId}::uuid, ${card.oracleId}::uuid, ${card.name}, unsorted.id
            from cur
            cross join unsorted
            cross join lateral generate_series(
                1,
                least(${card.delta}::integer, ${MAX_QUANTITY}::integer - cur.q)
            ) as g
            returning id, location_id, created_at
        ),
        mv as (
            insert into moves (user_id, copy_id, from_location, to_location)
            select ${userId}::uuid, id, null, location_id from added
        )
        select
            ${card.oracleId}::uuid as oracle_id,
            ${card.name}::text as name,
            cur.q + (select count(*) from added) as quantity,
            coalesce(
                (select max(created_at) from added),
                (select updated_at from collection
                    where user_id = ${userId}::uuid
                        and oracle_id = ${card.oracleId}::uuid)
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
            select i.oracle_id, count(c.id)::integer as q
            from input i
            left join copies c
                on c.user_id = ${userId}::uuid
                and c.oracle_id = i.oracle_id
                and c.location_id is not null
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
        added as (
            insert into copies (user_id, oracle_id, name, location_id)
            select ${userId}::uuid, i.oracle_id, i.name, unsorted.id
            from input i
            join cur on cur.oracle_id = i.oracle_id
            cross join unsorted
            cross join lateral generate_series(
                1,
                least(i.delta, ${MAX_QUANTITY}::integer - cur.q)
            ) as g
            returning id, oracle_id, location_id, created_at
        ),
        mv as (
            insert into moves (user_id, copy_id, from_location, to_location)
            select ${userId}::uuid, id, null, location_id from added
        )
        select
            i.oracle_id,
            i.name,
            cur.q + (select count(*) from added a where a.oracle_id = i.oracle_id) as quantity,
            coalesce(
                (select max(created_at) from added a where a.oracle_id = i.oracle_id),
                now()
            ) as updated_at
        from input i
        join cur on cur.oracle_id = i.oracle_id
    `;
    return rows.map(toItem);
}

export type SetQuantityResult =
    | { status: 'updated'; item: CollectionItem }
    | { status: 'removed' }
    | { status: 'not_found' };

/**
 * Set an exact quantity. Zero removes the card. Raising it adds copies to
 * Unsorted; lowering it removes the newest copies, Unsorted first.
 */
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
                count(*)::integer as q,
                (array_agg(name order by created_at desc, id))[1] as name,
                max(created_at) as at
            from copies
            where user_id = ${userId}::uuid
                and oracle_id = ${oracleId}::uuid
                and location_id is not null
        ),
        unsorted as (
            select id from locations
            where user_id = ${userId}::uuid and kind = 'unsorted'
        ),
        added as (
            insert into copies (user_id, oracle_id, name, location_id)
            select ${userId}::uuid, ${oracleId}::uuid, cur.name, unsorted.id
            from cur
            cross join unsorted
            cross join lateral generate_series(1, ${quantity}::integer - cur.q) as g
            where cur.q > 0
            returning id, location_id, created_at
        ),
        victims as (
            select c.id, c.location_id
            from copies c, cur, unsorted
            where c.user_id = ${userId}::uuid
                and c.oracle_id = ${oracleId}::uuid
                and c.location_id is not null
                and cur.q > ${quantity}::integer
            order by (c.location_id = unsorted.id) desc, c.created_at desc, c.id
            limit greatest((select q from cur) - ${quantity}::integer, 0)
            for update of c
        ),
        removed as (
            update copies
            set location_id = null
            where id in (select id from victims)
            returning id
        ),
        mv as (
            insert into moves (user_id, copy_id, from_location, to_location)
            select ${userId}::uuid, id, null, location_id from added
            union all
            select ${userId}::uuid, v.id, v.location_id, null from victims v
        )
        select
            ${oracleId}::uuid as oracle_id,
            cur.name,
            cur.q + (select count(*) from added) - (select count(*) from removed) as quantity,
            coalesce(
                (select max(created_at) from added),
                case when exists (select 1 from removed) then now() end,
                cur.at
            ) as updated_at
        from cur
        where cur.q > 0
    `;
    return rows.length > 0
        ? { status: 'updated', item: toItem(rows[0]) }
        : { status: 'not_found' };
}

/** Remove every copy of a card from the collection. Returns whether it was owned. */
export async function removeFromCollection(
    sql: Sql,
    userId: string,
    oracleId: string
): Promise<boolean> {
    const rows = await sql`
        with victims as (
            select id, location_id
            from copies
            where user_id = ${userId}::uuid
                and oracle_id = ${oracleId}::uuid
                and location_id is not null
            for update
        ),
        removed as (
            update copies
            set location_id = null
            where id in (select id from victims)
            returning id
        ),
        mv as (
            insert into moves (user_id, copy_id, from_location, to_location, note)
            select ${userId}::uuid, v.id, v.location_id, null, 'Removed'
            from victims v
        )
        select id from removed
    `;
    return rows.length > 0;
}
