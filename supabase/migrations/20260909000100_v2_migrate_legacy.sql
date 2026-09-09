-- Move legacy parallel-array sores into the v2 model.
-- Idempotent: safe to re-run. `sores_legacy` is left in place for one release.

create or replace function public.try_cast_date(value text)
returns date
language plpgsql
immutable
as $$
begin
  return value::timestamptz::date;
exception when others then
  return null;
end;
$$;

-- Map legacy (gums flag + six-rectangle zone) to a v2 surface.
create or replace function public.legacy_zone_to_surface(zone text, gums boolean)
returns public.sore_surface
language sql
immutable
as $$
  select case
    when gums and zone in ('Upper Mouth', 'Left Cheek', 'Right Cheek') then 'gum_upper'::public.sore_surface
    when gums then 'gum_lower'::public.sore_surface
    when zone in ('Left Cheek', 'Left Jaw') then 'cheek_left'::public.sore_surface
    when zone in ('Right Cheek', 'Right Jaw') then 'cheek_right'::public.sore_surface
    when zone = 'Upper Mouth' then 'palate_hard'::public.sore_surface
    when zone = 'Lower Mouth' then 'tongue_dorsum'::public.sore_surface
    else 'other'::public.sore_surface
  end;
$$;

-- 1. Sores. Onset is the first logged date; fall back to today if none.
insert into public.sores (id, user_id, surface, x, y, onset_date, healed_date)
select
  l.id,
  l.user_id,
  public.legacy_zone_to_surface(l.zone, l.gums),
  least(greatest(coalesce(l.x, 50) / 100.0, 0), 1)::real,
  least(greatest(coalesce(l.y, 50) / 100.0, 0), 1)::real,
  coalesce(public.try_cast_date(l.dates[1]), current_date),
  -- greatest() skips nulls, so guard: an unhealed sore must stay unhealed.
  case
    when public.try_cast_date(l.healed) is null then null
    else greatest(
      public.try_cast_date(l.healed),
      coalesce(public.try_cast_date(l.dates[1]), current_date)
    )
  end
from public.sores_legacy l
on conflict (id) do nothing;

-- 2. One log per array index. Missing or out-of-range values get clamped.
insert into public.sore_logs (sore_id, user_id, log_date, size_mm, pain, logged_late)
select
  l.id,
  l.user_id,
  public.try_cast_date(d.value),
  least(greatest(coalesce(round(l.size[d.i])::int, 3), 1), 30)::smallint,
  least(greatest(coalesce(round(l.pain[d.i])::int, 3), 0), 10)::smallint,
  false
from public.sores_legacy l
cross join lateral unnest(l.dates) with ordinality as d(value, i)
where public.try_cast_date(d.value) is not null
  and public.try_cast_date(d.value) >= (select onset_date from public.sores s where s.id = l.id)
on conflict (sore_id, log_date) do update
  set size_mm = excluded.size_mm,
      pain = excluded.pain;

-- 3. Every migrated user gets a profile timezone default; nothing else to do.

-- 4. Cleanup of the temporary mapping helper. try_cast_date stays; it is useful.
drop function public.legacy_zone_to_surface(text, boolean);
