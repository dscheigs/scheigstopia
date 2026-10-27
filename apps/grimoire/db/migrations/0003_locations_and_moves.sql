-- Locations and the move ledger (issue #84, part of #83). Keep statements
-- simple: the runner splits this file on semicolons.
--
-- The ledger (moves) is the source of truth for what is owned and where.
-- A NULL end of a move means outside the collection: a new card is NULL to a
-- location, and removing a card is a location to NULL. The `collection` table
-- becomes a view over the moves with the same columns, so reads keep working.
--
-- The runner applies this file once and records it. The steps before the
-- table swap can be repeated safely. The swap itself (the last two
-- statements) cannot, so they come last.

create table if not exists locations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    kind text not null check (kind in ('bag', 'box', 'binder', 'deck', 'unsorted')),
    label text not null,
    note text,
    archived_at timestamptz,
    created_at timestamptz not null default now()
);

-- Every user has exactly one Unsorted location.
create unique index if not exists locations_one_unsorted_idx
    on locations (user_id)
    where kind = 'unsorted';

create index if not exists locations_user_idx
    on locations (user_id, kind);

create table if not exists moves (
    id bigint generated always as identity primary key,
    user_id uuid not null references users (id) on delete cascade,
    oracle_id uuid not null,
    name text not null,
    from_location uuid references locations (id),
    to_location uuid references locations (id),
    quantity integer not null check (quantity > 0 and quantity <= 9999),
    note text,
    created_at timestamptz not null default now(),
    check (from_location is not null or to_location is not null),
    check (from_location is distinct from to_location)
);

create index if not exists moves_user_oracle_idx
    on moves (user_id, oracle_id);

-- An "Unsorted" location for every existing user.
insert into locations (user_id, kind, label)
select id, 'unsorted', 'Unsorted'
from users
on conflict (user_id) where kind = 'unsorted' do nothing;

-- One opening-balance move per existing collection row, dated by the row's
-- created_at. Skips cards that already have moves.
insert into moves (user_id, oracle_id, name, from_location, to_location, quantity, note, created_at)
select c.user_id, c.oracle_id, c.name, null, l.id, c.quantity, 'Opening balance', c.created_at
from collection c
join locations l on l.user_id = c.user_id and l.kind = 'unsorted'
where not exists (
    select 1 from moves m
    where m.user_id = c.user_id and m.oracle_id = c.oracle_id
);

-- The old table is kept under a new name as a safety net while the ledger
-- settles in. Nothing reads it; drop it in a later migration.
alter table collection rename to collection_legacy;

create view collection as
select
    user_id,
    oracle_id,
    (array_agg(name order by id desc))[1] as name,
    (
        sum(case when to_location is not null then quantity else 0 end)
        - sum(case when from_location is not null then quantity else 0 end)
    )::integer as quantity,
    min(created_at) as created_at,
    max(created_at) as updated_at
from moves
group by user_id, oracle_id
having
    sum(case when to_location is not null then quantity else 0 end)
    - sum(case when from_location is not null then quantity else 0 end) > 0;
