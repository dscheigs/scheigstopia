-- Per-copy rare override (issue #89, part of #83). Keep statements simple: the
-- runner splits this file on semicolons.
--
-- NULL follows the rarity rule (a rare is expected in a keepers or deck
-- location). 'bulk' means this copy never needs attention, and 'keep' means it
-- always expects a rare-safe location. The value is checked in application
-- code (see lib/locationKinds.ts). It stays with the copy when it moves,
-- since moves only change location_id.
alter table copies add column if not exists rare_rule text;
