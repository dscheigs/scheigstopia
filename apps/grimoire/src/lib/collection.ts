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
