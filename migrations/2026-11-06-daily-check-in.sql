-- Daily check-in: habit fields on day_logs and a check_ins status table.
-- Re-runnable. Back up first (pg_dump into backups/).

begin;

do $$
begin
  -- Backfill only on the first run, when the columns do not exist yet, so a
  -- rerun cannot flag days answered after real check-in data exists.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = current_schema()
      and table_name = 'day_logs' and column_name = 'food_answered'
  ) then
    alter table day_logs add column food_answered boolean not null default false;
    alter table day_logs add column health_answered boolean not null default false;
    -- Legacy logs keep counting toward streaks.
    update day_logs set food_answered = true, health_answered = true;
  end if;
end $$;

alter table day_logs add column if not exists sleep_hours numeric(4,2)
  check (sleep_hours between 0 and 24);
alter table day_logs add column if not exists sleep_quality smallint
  check (sleep_quality between 1 and 5);
alter table day_logs add column if not exists sleep_source text
  check (sleep_source in ('manual', 'apple_health', 'health_connect'));
alter table day_logs add column if not exists stress smallint
  check (stress between 1 and 5);
alter table day_logs add column if not exists food_answered boolean not null default false;
alter table day_logs add column if not exists health_answered boolean not null default false;

create table if not exists check_ins (
  user_id text not null references "user" ("id") on delete cascade,
  day date not null,
  status text not null check (status in ('done', 'skipped')),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

commit;
