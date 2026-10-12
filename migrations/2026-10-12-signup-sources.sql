-- First-touch attribution for the signup funnel (scripts/funnel.sql).
--
-- The same statement as in schema.sql, kept here so the change is applied by
-- hand like the others. Apply it before deploying the code that writes it:
-- the auth hook logs and carries on if the table is missing, so applying it
-- late loses attribution for the accounts created in between, nothing more.
--
-- Re-runnable.

create table if not exists signup_sources (
  user_id text primary key references "user" ("id") on delete cascade,
  landing_path text not null,
  referrer_host text,
  first_seen_at timestamptz not null
);
