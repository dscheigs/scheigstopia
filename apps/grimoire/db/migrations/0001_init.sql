-- Grimoire initial schema.
-- Keep statements simple: the runner splits this file on semicolons.

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    github_id bigint not null unique,
    login text not null,
    created_at timestamptz not null default now()
);

-- One row per card (by Scryfall oracle id) per user.
-- name is stored for display and export; oracle_id is the stable identity.
create table if not exists collection (
    user_id uuid not null references users (id) on delete cascade,
    oracle_id uuid not null,
    name text not null,
    quantity integer not null check (quantity > 0 and quantity <= 9999),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, oracle_id)
);

create index if not exists collection_user_name_idx
    on collection (user_id, lower(name));
