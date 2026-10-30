import type { Sql } from '@/lib/db';
import type { LocationKind } from '@/lib/locationKinds';

/*
 * Locations, moves and the questions the UI asks about them (issue #85). The
 * tables are in migration 0003. Like collection.ts, every write is one SQL
 * statement, so it applies fully or not at all on Neon's HTTP client and on the
 * PGlite test double alike.
 */

export interface LocationItem {
    id: string;
    kind: LocationKind;
    label: string;
    note: string | null;
    parentId: string | null;
    archivedAt: string | null;
    createdAt: string;
    /** Copies currently in this location. */
    cardCount: number;
}

export interface Placement {
    locationId: string;
    kind: LocationKind;
    label: string;
    quantity: number;
}

export interface HistoryEntry {
    /** The newest move row in the group; a stable key. */
    id: number;
    /** Null when the copies came from outside the collection. */
    fromId: string | null;
    fromLabel: string | null;
    /** Null when the copies left the collection. */
    toId: string | null;
    toLabel: string | null;
    quantity: number;
    note: string | null;
    createdAt: string;
}

/** One line of a batch: move `quantity` copies of a card between locations. */
export interface MoveLine {
    oracleId: string;
    fromId: string;
    toId: string;
    quantity: number;
}

const HISTORY_LIMIT = 500;

function iso(value: unknown): string {
    return new Date(value as string | Date).toISOString();
}

function toLocation(row: Record<string, unknown>): LocationItem {
    return {
        id: String(row.id),
        kind: row.kind as LocationKind,
        label: String(row.label),
        note: row.note === null ? null : String(row.note),
        parentId: row.parent_id === null ? null : String(row.parent_id),
        archivedAt: row.archived_at === null ? null : iso(row.archived_at),
        createdAt: iso(row.created_at),
        cardCount: Number(row.card_count),
    };
}

/** Create the user's Unsorted location if it is missing (idempotent). */
async function ensureUnsorted(sql: Sql, userId: string): Promise<void> {
    await sql`
        insert into locations (user_id, kind, label)
        values (${userId}::uuid, 'unsorted', 'Unsorted')
        on conflict (user_id) where kind = 'unsorted' do nothing
    `;
}

/**
 * The user's locations, system location first, then by kind and label.
 * Archived ones are left out unless asked for.
 */
export async function listLocations(
    sql: Sql,
    userId: string,
    options: { includeArchived?: boolean } = {}
): Promise<LocationItem[]> {
    await ensureUnsorted(sql, userId);
    const rows = await sql`
        select
            l.id, l.kind, l.label, l.note, l.parent_id, l.archived_at,
            l.created_at,
            (select count(*) from copies c where c.location_id = l.id)::integer
                as card_count
        from locations l
        where l.user_id = ${userId}::uuid
            and (${options.includeArchived === true} or l.archived_at is null)
        order by (l.kind = 'unsorted') desc, l.kind, lower(l.label), l.id
    `;
    return rows.map(toLocation);
}

/**
 * Create a location. The `unsorted` kind is the system's own and cannot be
 * created here. Returns null when the parent is not one of the user's.
 */
export async function createLocation(
    sql: Sql,
    userId: string,
    input: {
        kind: Exclude<LocationKind, 'unsorted'>;
        label: string;
        note?: string | null;
        parentId?: string | null;
    }
): Promise<LocationItem | null> {
    const parentId = input.parentId ?? null;
    const rows = await sql`
        insert into locations (user_id, kind, label, note, parent_id)
        select ${userId}::uuid, ${input.kind}, ${input.label},
            ${input.note ?? null}::text, ${parentId}::uuid
        where ${parentId}::uuid is null
            or exists (
                select 1 from locations p
                where p.id = ${parentId}::uuid
                    and p.user_id = ${userId}::uuid
                    and p.archived_at is null
            )
        returning id, kind, label, note, parent_id, archived_at, created_at,
            0 as card_count
    `;
    return rows.length > 0 ? toLocation(rows[0]) : null;
}

export type UpdateLocationResult =
    | { status: 'updated'; location: LocationItem }
    | { status: 'not_found' }
    /** The system Unsorted location cannot be renamed or archived. */
    | { status: 'system' }
    /** Archiving is refused while the location still holds cards. */
    | { status: 'not_empty' };

/**
 * Rename a location, change its note, or archive and restore it. A field that
 * is left out stays as it is.
 */
export async function updateLocation(
    sql: Sql,
    userId: string,
    id: string,
    changes: { label?: string; note?: string | null; archived?: boolean }
): Promise<UpdateLocationResult> {
    const hasNote = changes.note !== undefined;
    const rows = await sql`
        with target as (
            select id, kind, label, note, archived_at
            from locations
            where id = ${id}::uuid and user_id = ${userId}::uuid
            for update
        ),
        held as (
            select count(*)::integer as n from copies
            where location_id = ${id}::uuid
        ),
        allowed as (
            select t.id from target t, held h
            where t.kind <> 'unsorted'
                and not (${changes.archived === true} and h.n > 0)
        ),
        changed as (
            update locations l
            set label = coalesce(${changes.label ?? null}::text, l.label),
                note = case when ${hasNote} then ${changes.note ?? null}::text
                    else l.note end,
                archived_at = case
                    when ${changes.archived === undefined} then l.archived_at
                    when ${changes.archived === true}
                        then coalesce(l.archived_at, now())
                    else null end
            from allowed
            where l.id = allowed.id
            returning l.id, l.kind, l.label, l.note, l.parent_id,
                l.archived_at, l.created_at
        )
        select
            (select kind from target) as target_kind,
            (select n from held) as held,
            c.id, c.kind, c.label, c.note, c.parent_id, c.archived_at,
            c.created_at, (select n from held) as card_count
        from target t
        left join changed c on c.id = t.id
    `;
    if (rows.length === 0) return { status: 'not_found' };
    const row = rows[0];
    if (row.id === null) {
        if (row.target_kind === 'unsorted') return { status: 'system' };
        return { status: 'not_empty' };
    }
    return { status: 'updated', location: toLocation(row) };
}

export type RecordMovesResult =
    | { status: 'moved'; moved: number }
    /** A location is not the user's, or the destination is archived. */
    | { status: 'bad_location' }
    /** These lines (by index) asked for more copies than the source holds. */
    | { status: 'short'; lines: number[] };

/**
 * Move copies between locations, one batch in one statement. Within a line the
 * oldest copies in the source go first. Any short line, or any location that
 * is not the user's (or a destination that is archived), rejects the whole
 * batch and nothing moves. Lines that name the same card and source draw from
 * the same copies, in order.
 */
export async function recordMoves(
    sql: Sql,
    userId: string,
    lines: MoveLine[],
    note: string | null = null
): Promise<RecordMovesResult> {
    if (lines.length === 0) return { status: 'moved', moved: 0 };

    const input = lines.map((line, ord) => ({
        ord,
        oracle_id: line.oracleId,
        from_id: line.fromId,
        to_id: line.toId,
        qty: line.quantity,
    }));

    const rows = await sql`
        with input as (
            select * from jsonb_to_recordset(${JSON.stringify(input)}::jsonb)
                as l(ord integer, oracle_id uuid, from_id uuid, to_id uuid,
                    qty integer)
        ),
        bad as (
            select i.ord from input i
            where not exists (
                    select 1 from locations f
                    where f.id = i.from_id and f.user_id = ${userId}::uuid
                )
                or not exists (
                    select 1 from locations t
                    where t.id = i.to_id and t.user_id = ${userId}::uuid
                        and t.archived_at is null
                )
        ),
        demand as (
            select
                i.*,
                sum(i.qty) over (
                    partition by i.oracle_id, i.from_id order by i.ord
                ) as end_n
            from input i
        ),
        locked as (
            select c.id, c.oracle_id, c.location_id, c.created_at
            from copies c
            where c.user_id = ${userId}::uuid
                and (c.oracle_id, c.location_id) in (
                    select oracle_id, from_id from input
                )
            for update
        ),
        ranked as (
            select
                id, oracle_id, location_id,
                row_number() over (
                    partition by oracle_id, location_id
                    order by created_at, id
                ) as rn
            from locked
        ),
        short as (
            select d.ord from demand d
            where d.end_n > (
                select count(*) from ranked r
                where r.oracle_id = d.oracle_id and r.location_id = d.from_id
            )
        ),
        ok as (
            select 1 where not exists (select 1 from bad)
                and not exists (select 1 from short)
        ),
        picks as (
            select r.id, d.from_id, d.to_id
            from demand d
            join ranked r
                on r.oracle_id = d.oracle_id
                and r.location_id = d.from_id
                and r.rn > d.end_n - d.qty
                and r.rn <= d.end_n
            where exists (select 1 from ok)
        ),
        moved as (
            update copies c
            set location_id = p.to_id
            from picks p
            where c.id = p.id
            returning c.id, p.from_id, p.to_id
        ),
        mv as (
            insert into moves (user_id, copy_id, from_location, to_location, note)
            select ${userId}::uuid, id, from_id, to_id, ${note}::text from moved
        )
        select
            (select count(*) from moved)::integer as moved,
            (select count(*) from bad)::integer as bad,
            coalesce((select array_agg(ord order by ord) from short), '{}')
                as short_lines
    `;
    const row = rows[0];
    if (Number(row.bad) > 0) return { status: 'bad_location' };
    const shortLines = (row.short_lines as number[]).map(Number);
    if (shortLines.length > 0) return { status: 'short', lines: shortLines };
    return { status: 'moved', moved: Number(row.moved) };
}

/** Where the copies of a card are now, by location. */
export async function listPlacements(
    sql: Sql,
    userId: string,
    oracleId: string
): Promise<Placement[]> {
    const rows = await sql`
        select l.id, l.kind, l.label, count(*)::integer as quantity
        from copies c
        join locations l on l.id = c.location_id
        where c.user_id = ${userId}::uuid and c.oracle_id = ${oracleId}::uuid
        group by l.id, l.kind, l.label
        order by (l.kind = 'unsorted') desc, lower(l.label), l.id
    `;
    return rows.map((row) => ({
        locationId: String(row.id),
        kind: row.kind as LocationKind,
        label: String(row.label),
        quantity: Number(row.quantity),
    }));
}

/** A placement together with the card it is of. */
export interface CardPlacement extends Placement {
    oracleId: string;
}

/**
 * Where every owned card is, in one query, for the collection list. Ordered
 * like `listPlacements`, so each card's placements come out in the same order.
 */
export async function listAllPlacements(
    sql: Sql,
    userId: string
): Promise<CardPlacement[]> {
    const rows = await sql`
        select c.oracle_id, l.id, l.kind, l.label, count(*)::integer as quantity
        from copies c
        join locations l on l.id = c.location_id
        where c.user_id = ${userId}::uuid
        group by c.oracle_id, l.id, l.kind, l.label
        order by c.oracle_id, (l.kind = 'unsorted') desc, lower(l.label), l.id
    `;
    return rows.map((row) => ({
        oracleId: String(row.oracle_id),
        locationId: String(row.id),
        kind: row.kind as LocationKind,
        label: String(row.label),
        quantity: Number(row.quantity),
    }));
}

/**
 * Every move of a card's copies, newest first. Copies moved together in one
 * batch (same time, source, destination and note) are one entry with a
 * quantity.
 */
export async function listHistory(
    sql: Sql,
    userId: string,
    oracleId: string
): Promise<HistoryEntry[]> {
    const rows = await sql`
        select
            max(m.id)::integer as id,
            m.from_location, f.label as from_label,
            m.to_location, t.label as to_label,
            count(*)::integer as quantity,
            m.note, m.created_at
        from moves m
        join copies c on c.id = m.copy_id
        left join locations f on f.id = m.from_location
        left join locations t on t.id = m.to_location
        where m.user_id = ${userId}::uuid
            and c.user_id = ${userId}::uuid
            and c.oracle_id = ${oracleId}::uuid
        group by m.created_at, m.from_location, f.label, m.to_location,
            t.label, m.note
        order by m.created_at desc, max(m.id) desc
        limit ${HISTORY_LIMIT}
    `;
    return rows.map((row) => ({
        id: Number(row.id),
        fromId: row.from_location === null ? null : String(row.from_location),
        fromLabel: row.from_label === null ? null : String(row.from_label),
        toId: row.to_location === null ? null : String(row.to_location),
        toLabel: row.to_label === null ? null : String(row.to_label),
        quantity: Number(row.quantity),
        note: row.note === null ? null : String(row.note),
        createdAt: iso(row.created_at),
    }));
}
