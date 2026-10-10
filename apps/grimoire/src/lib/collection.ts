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

/** Add `delta` copies, creating the row if needed. Caps at the maximum. */
export async function addToCollection(
    sql: Sql,
    userId: string,
    card: { oracleId: string; name: string; delta: number }
): Promise<CollectionItem> {
    const rows = await sql`
        insert into collection (user_id, oracle_id, name, quantity)
        values (${userId}, ${card.oracleId}, ${card.name}, ${card.delta})
        on conflict (user_id, oracle_id) do update set
            quantity = least(collection.quantity + excluded.quantity, ${MAX_QUANTITY}),
            name = excluded.name,
            updated_at = now()
        returning oracle_id, name, quantity, updated_at
    `;
    return toItem(rows[0]);
}

/**
 * Add many cards in one statement, so it applies fully or not at all. Neon's
 * HTTP client has no interactive transaction, and `Sql.transaction` is not
 * atomic in the PGlite test double, so one statement is the form that behaves
 * the same in production and in tests. Repeated oracle ids are summed first,
 * since one statement cannot upsert a row twice. Same cap and conflict
 * behavior as `addToCollection`.
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
        insert into collection (user_id, oracle_id, name, quantity)
        select ${userId}::uuid, c.oracle_id, c.name, c.delta
        from jsonb_to_recordset(${JSON.stringify([...merged.values()])}::jsonb)
            as c(oracle_id uuid, name text, delta integer)
        on conflict (user_id, oracle_id) do update set
            quantity = least(collection.quantity + excluded.quantity, ${MAX_QUANTITY}),
            name = excluded.name,
            updated_at = now()
        returning oracle_id, name, quantity, updated_at
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
        update collection
        set quantity = ${quantity}, updated_at = now()
        where user_id = ${userId} and oracle_id = ${oracleId}
        returning oracle_id, name, quantity, updated_at
    `;
    return rows.length > 0
        ? { status: 'updated', item: toItem(rows[0]) }
        : { status: 'not_found' };
}

/** Delete a card from the collection. Returns whether a row was removed. */
export async function removeFromCollection(
    sql: Sql,
    userId: string,
    oracleId: string
): Promise<boolean> {
    const rows = await sql`
        delete from collection
        where user_id = ${userId} and oracle_id = ${oracleId}
        returning oracle_id
    `;
    return rows.length > 0;
}
