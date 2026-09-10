-- Drop the username and bio columns from "user".
--
-- They were inherited from the starter's public profile page. Canker Core has
-- no social surface — nobody but you ever sees your account — so a display
-- name and a bio were fields with nowhere to be shown. Name and email stay.
--
-- Apply by hand against production (see docs/DEPLOYMENT.md, "Schema changes").

begin;

alter table "user" drop column if exists username;
alter table "user" drop column if exists bio;

commit;
