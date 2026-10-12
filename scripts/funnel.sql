-- The signup funnel, read straight from the app's own tables.
--
-- The goal is the first reading logged, not the signup (docs/CONTENT-SEO.md,
-- Phase 0 #12), so each step is something a person did rather than a page
-- they saw:
--
--   signed up       a "user" row exists
--   onboarded       "onboardedAt" is set (the first-run flow was finished or skipped)
--   first reading   at least one row in readings
--   second day      readings on two or more different days, i.e. they came back
--
-- Days are UTC days. The app's one-reading-per-day rule uses the person's
-- local day, which the database does not know, so a reading near midnight can
-- land either side; at funnel scale that is noise.
--
-- Read-only. Locally:   npm run db:funnel
-- Production, from the Mac (the database is not exposed):
--   ssh coolify "docker exec -i zp1hiabzhkgj4kwo2r9qa0qi psql -U canker canker" < scripts/funnel.sql

\pset footer off

with per_user as (
  select
    u.id,
    u."createdAt" as signed_up_at,
    u."onboardedAt" is not null as onboarded,
    min(r.recorded_at) as first_reading_at,
    count(distinct (r.recorded_at at time zone 'UTC')::date) as reading_days
  from "user" u
  left join sores so on so.user_id = u.id
  left join readings r on r.sore_id = so.id
  group by u.id
),
windows(label, since) as (
  values ('all time', '-infinity'::timestamptz),
         ('last 90 days', now() - interval '90 days'),
         ('last 30 days', now() - interval '30 days')
)
select
  w.label as signups_in,
  count(p.id) as signed_up,
  count(*) filter (where p.onboarded) as onboarded,
  count(p.first_reading_at) as first_reading,
  count(*) filter (where p.reading_days >= 2) as second_day,
  round(100.0 * count(p.first_reading_at) / nullif(count(p.id), 0), 1) as "first_reading_%",
  round(100.0 * count(*) filter (where p.reading_days >= 2) / nullif(count(p.first_reading_at), 0), 1) as "came_back_%",
  (percentile_cont(0.5) within group (
    order by extract(epoch from p.first_reading_at - p.signed_up_at) / 3600
  ) filter (where p.first_reading_at is not null))::numeric(10, 1) as median_hours_to_first_reading
from windows w
left join per_user p on p.signed_up_at >= w.since
group by w.label, w.since
order by w.since;

-- Which pages bring in people who go on to log something. Accounts created
-- before signup_sources existed show as (unknown).
with per_user as (
  select
    u.id,
    count(r.id) > 0 as has_reading,
    count(distinct (r.recorded_at at time zone 'UTC')::date) >= 2 as came_back,
    coalesce(s.landing_path, '(unknown)') as landing_path
  from "user" u
  left join sores so on so.user_id = u.id
  left join readings r on r.sore_id = so.id
  left join signup_sources s on s.user_id = u.id
  group by u.id, s.landing_path
)
select
  landing_path,
  count(*) as signed_up,
  count(*) filter (where has_reading) as first_reading,
  count(*) filter (where came_back) as second_day
from per_user
group by landing_path
order by first_reading desc, signed_up desc, landing_path;

select
  coalesce(s.referrer_host, '(direct)') as referrer_host,
  count(*) as signed_up
from "user" u
join signup_sources s on s.user_id = u.id
group by 1
order by 2 desc, 1;
