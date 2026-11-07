-- Daily check-in: habit fields on day_logs and a check_ins status table.
-- Re-runnable. Back up first (pg_dump into backups/).

begin;

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

do $$
begin
  -- Legacy logs keep counting toward streaks. Runs once: the first time any
  -- of this runs, check_ins does not exist yet; every later run skips it.
  if to_regclass('public.check_ins') is null then
    update day_logs set food_answered = true, health_answered = true;
  end if;
end $$;

create table if not exists check_ins (
  user_id text not null references "user" ("id") on delete cascade,
  day date not null,
  status text not null check (status in ('done', 'skipped')),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

commit;
