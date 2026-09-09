-- Local development seed. Runs after migrations on `supabase db reset`.
-- Creates one confirmed user (dev@cankercore.test / password123) with a
-- realistic five months of history so every screen has something to show.

-- Auth user -------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'dev@cankercore.test',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dev User"}',
  now(), now(), '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  '{"sub":"a0000000-0000-4000-8000-000000000001","email":"dev@cankercore.test"}',
  'email', now(), now(), now()
)
on conflict (provider_id, provider) do nothing;

update public.profiles
set timezone = 'America/Los_Angeles', reminder_at = '20:30', onboarded_at = now()
where id = 'a0000000-0000-4000-8000-000000000001';

-- Sores -----------------------------------------------------------------------
-- Five healed sores over the last five months, two active now.
insert into public.sores (id, user_id, surface, x, y, onset_date, healed_date) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'cheek_left',     0.42, 0.55, current_date - 140, current_date - 131),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'gum_lower',      0.30, 0.60, current_date - 104, current_date - 87),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'tongue_left',    0.50, 0.70, current_date - 96,  current_date - 88),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'lip_lower_inner',0.60, 0.40, current_date - 62,  current_date - 53),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'cheek_left',     0.38, 0.62, current_date - 31,  current_date - 21),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'cheek_left',     0.45, 0.50, current_date - 5,   null),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'lip_lower_inner',0.35, 0.45, current_date - 1,   null)
on conflict (id) do nothing;

-- Logs: a rise-and-fall curve per sore ------------------------------------------
insert into public.sore_logs (sore_id, user_id, log_date, size_mm, pain)
select
  s.id,
  s.user_id,
  d::date,
  -- size peaks around day 3-4 then shrinks
  greatest(1, round(4 + 2 * sin(least((d::date - s.onset_date), 12) / 12.0 * pi()) - (d::date - s.onset_date) * 0.15))::smallint,
  greatest(0, round(6 * sin(least((d::date - s.onset_date), 12) / 12.0 * pi()) + 1 - (d::date - s.onset_date) * 0.2))::smallint
from public.sores s
cross join lateral generate_series(s.onset_date, coalesce(s.healed_date, current_date), interval '1 day') d
where s.user_id = 'a0000000-0000-4000-8000-000000000001'
on conflict (sore_id, log_date) do nothing;

-- Daily entries for the last 150 days ------------------------------------------
insert into public.daily_entries (user_id, entry_date, stress, sleep_quality)
select
  'a0000000-0000-4000-8000-000000000001',
  d::date,
  (1 + (extract(doy from d)::int % 4))::smallint,
  (4 - (extract(doy from d)::int % 5) / 2)::smallint
from generate_series(current_date - 150, current_date, interval '1 day') d
on conflict (user_id, entry_date) do nothing;

-- Poor sleep and citrus in the two days before most onsets, so Insights has a signal.
insert into public.entry_factors (daily_entry_id, factor_id, user_id)
select e.id, f.id, e.user_id
from public.daily_entries e
join public.factors f on f.is_preset and f.name in ('Citrus', 'Coffee')
where e.user_id = 'a0000000-0000-4000-8000-000000000001'
  and (
    f.name = 'Coffee' and extract(dow from e.entry_date) in (1,2,3,4,5)
    or f.name = 'Citrus' and exists (
      select 1 from public.sores s
      where s.user_id = e.user_id
        and e.entry_date between s.onset_date - 2 and s.onset_date - 1
    )
  )
on conflict do nothing;

update public.daily_entries e
set sleep_quality = 0
where e.user_id = 'a0000000-0000-4000-8000-000000000001'
  and exists (
    select 1 from public.sores s
    where s.user_id = e.user_id and e.entry_date between s.onset_date - 2 and s.onset_date - 1
  );

-- Benzocaine on the two most recent healed sores.
insert into public.entry_factors (daily_entry_id, factor_id, user_id, sore_id)
select e.id, f.id, e.user_id, s.id
from public.sores s
join public.daily_entries e on e.user_id = s.user_id and e.entry_date between s.onset_date and coalesce(s.healed_date, current_date)
join public.factors f on f.is_preset and f.name = 'Benzocaine gel'
where s.id in ('b0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000005')
on conflict do nothing;
