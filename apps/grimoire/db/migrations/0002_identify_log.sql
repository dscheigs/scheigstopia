-- One row per identify request that was allowed through, for the app-side
-- spend cap and rate limit (issue #43). Keep statements simple: the runner
-- splits this file on semicolons.

create table if not exists identify_log (
    id bigint generated always as identity primary key,
    user_id uuid not null references users (id) on delete cascade,
    created_at timestamptz not null default now()
);

create index if not exists identify_log_user_created_idx
    on identify_log (user_id, created_at desc);
