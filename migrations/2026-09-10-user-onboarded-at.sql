-- Add "onboardedAt" to "user".
--
-- Marks that someone has been through the first-run flow, whether they
-- finished it or skipped it. It cannot be derived from the data: a user with
-- no sores might be new, or might simply have had no sores for a month, and
-- nagging the second one with a welcome screen would be worse than useless.
--
-- It lives on the auth table rather than in a table of its own because Better
-- Auth already owns the user row; a one-timestamp table would need its own
-- insert path and its own join. The app reads it with getOnboardedAt() in
-- lib/queries.ts rather than off the session, because the session cookie is
-- cached for five minutes and this flag flips inside that window.
--
-- Existing accounts are backfilled to now(): they have been using the app for
-- weeks and do not need to be introduced to it.
--
-- Apply by hand against production (see docs/DEPLOYMENT.md, "Schema changes").

begin;

alter table "user" add column if not exists "onboardedAt" timestamptz;

update "user" set "onboardedAt" = now() where "onboardedAt" is null;

commit;
