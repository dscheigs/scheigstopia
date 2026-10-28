-- Locations, individual copies and the move history (issue #84, part of #83).
-- Keep statements simple: the runner splits this file on semicolons.
--
-- Every physical card is a row in `copies`. A copy sits in one location, or
-- in none (location_id is NULL: outside the collection, for example removed).
-- `moves` is the append-only history of where each copy has been. The
-- `collection` table becomes a view that counts the copies in a location, with
-- the same columns as before, so reads and the export keep working.
--
-- The runner applies this file once and records it. The steps before the
-- table swap can be repeated safely. The swap itself (the last two
-- statements) cannot, so they come last.

-- `kind` is checked in application code (see lib/locationKinds.ts), not here,
-- so adding a kind is not a migration. `parent_id` lets a location sit inside
-- another one, such as a binder in a shoebox.
create table if not exists locations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    kind text not null,
    label text not null,
    note text,
    parent_id uuid references locations (id),
    archived_at timestamptz,
    created_at timestamptz not null default now()
);

-- Every user has exactly one Unsorted location.
create unique index if not exists locations_one_unsorted_idx
    on locations (user_id)
    where kind = 'unsorted';

create index if not exists locations_user_idx
    on locations (user_id, kind);

-- printing_id is a Scryfall card id (one printing); it is unknown until the
-- user picks a printing, since a scan only reads the name.
create table if not exists copies (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    oracle_id uuid not null,
    name text not null,
    printing_id uuid,
    location_id uuid references locations (id),
    created_at timestamptz not null default now()
);

create index if not exists copies_user_oracle_idx
    on copies (user_id, oracle_id);

create index if not exists copies_location_idx
    on copies (location_id);

-- A NULL end means outside the collection: a new copy is NULL to a location,
-- and removing one is a location to NULL.
create table if not exists moves (
    id bigint generated always as identity primary key,
    user_id uuid not null references users (id) on delete cascade,
    copy_id uuid not null references copies (id) on delete cascade,
    from_location uuid references locations (id),
    to_location uuid references locations (id),
    note text,
    created_at timestamptz not null default now(),
    check (from_location is not null or to_location is not null),
    check (from_location is distinct from to_location)
);

create index if not exists moves_copy_idx
    on moves (copy_id, id);

-- An "Unsorted" location for every existing user.
insert into locations (user_id, kind, label)
select id, 'unsorted', 'Unsorted'
from users
on conflict (user_id) where kind = 'unsorted' do nothing;

-- One copy per owned card, in Unsorted, dated by the collection row's
-- created_at. Skips cards that already have copies.
insert into copies (user_id, oracle_id, name, location_id, created_at)
select c.user_id, c.oracle_id, c.name, l.id, c.created_at
from collection c
join locations l on l.user_id = c.user_id and l.kind = 'unsorted'
cross join lateral generate_series(1, c.quantity) as g
where not exists (
    select 1 from copies x
    where x.user_id = c.user_id and x.oracle_id = c.oracle_id
);

-- The opening balance: one move into Unsorted per backfilled copy.
insert into moves (user_id, copy_id, from_location, to_location, note, created_at)
select cp.user_id, cp.id, null, cp.location_id, 'Opening balance', cp.created_at
from copies cp
where not exists (select 1 from moves m where m.copy_id = cp.id);

-- The old table is kept under a new name as a safety net while the new tables
-- settle in. Nothing reads it; drop it in a later migration.
alter table collection rename to collection_legacy;

-- Quantity counts the copies that are in a location. A card whose copies have
-- all been removed drops out; updated_at still reflects the removal.
create view collection as
select
    c.user_id,
    c.oracle_id,
    (array_agg(c.name order by c.created_at desc, c.id))[1] as name,
    (count(*) filter (where c.location_id is not null))::integer as quantity,
    min(c.created_at) as created_at,
    max(coalesce(m.last_move, c.created_at)) as updated_at
from copies c
left join (
    select copy_id, max(created_at) as last_move
    from moves
    group by copy_id
) m on m.copy_id = c.id
group by c.user_id, c.oracle_id
having count(*) filter (where c.location_id is not null) > 0;
