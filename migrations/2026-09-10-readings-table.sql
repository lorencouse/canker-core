-- Move readings out of the parallel arrays on sores and into their own table.
--
-- A sore used to carry three arrays — dates, size, pain — that had to be kept
-- in step by hand. Notes, per-reading edits and any SQL aggregate (average
-- days to heal, worst pain this month) were awkward or impossible. Each
-- reading is now a row, and a per-day log (triggers, treatments, a note)
-- lives alongside so the app can start to say *why* sores appear, not just
-- that they did.
--
-- Existing rows are unpacked one array element per reading. The healed text
-- column becomes a timestamptz.
--
-- Apply by hand against production (see docs/DEPLOYMENT.md, "Schema changes").

begin;

alter table sores rename to sores_old;
alter index if exists sores_user_id_idx rename to sores_old_user_id_idx;

create table sores (
  id text primary key,
  user_id text not null references "user" ("id") on delete cascade,
  view text not null default 'front',
  x double precision,
  y double precision,
  zone text not null,
  created_at timestamptz not null default now(),
  healed_at timestamptz
);
create index sores_user_idx on sores (user_id, created_at desc);

create table readings (
  id text primary key,
  sore_id text not null references sores (id) on delete cascade,
  recorded_at timestamptz not null,
  size double precision not null check (size > 0),
  pain integer not null check (pain between 1 and 10),
  note text
);
create index readings_sore_idx on readings (sore_id, recorded_at);

create table day_logs (
  user_id text not null references "user" ("id") on delete cascade,
  day date not null,
  triggers text[] not null default '{}',
  treatments text[] not null default '{}',
  note text,
  primary key (user_id, day)
);

insert into sores (id, user_id, view, x, y, zone, created_at, healed_at)
select
  id, user_id, view, x, y, zone,
  coalesce(dates[1]::timestamptz, now()),
  nullif(healed, '')::timestamptz
from sores_old;

insert into readings (id, sore_id, recorded_at, size, pain, note)
select
  gen_random_uuid()::text,
  o.id,
  d.value::timestamptz,
  greatest(0.5, coalesce(o.size[d.ord], 3)),
  greatest(1, least(10, round(coalesce(o.pain[d.ord], 3))))::int,
  null
from sores_old o,
     unnest(o.dates) with ordinality as d (value, ord);

drop table sores_old;

commit;
