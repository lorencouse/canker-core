-- Canker Core v2 schema.
--
-- The unit of work becomes the day. A sore accumulates one `sore_logs` row per
-- day; a `daily_entries` row records the whole-person context for that day
-- (stress, sleep) and links to the `factors` (foods, medications, treatments,
-- illnesses...) that applied. Flare-ups are derived, never stored.

-------------------------------------------------------------------------------
-- Enums
-------------------------------------------------------------------------------

create type public.sore_surface as enum (
  'lip_upper_inner',
  'lip_lower_inner',
  'cheek_left',
  'cheek_right',
  'tongue_dorsum',
  'tongue_left',
  'tongue_right',
  'tongue_ventral',
  'floor_of_mouth',
  'palate_hard',
  'palate_soft',
  'gum_upper',
  'gum_lower',
  'other'
);

create type public.factor_kind as enum (
  'food',
  'medication',
  'treatment',
  'illness',
  'dental',
  'cycle',
  'other'
);

create type public.plan_tier as enum ('free', 'pro');

-------------------------------------------------------------------------------
-- Helpers
-------------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- profiles (was: users)
-------------------------------------------------------------------------------

alter table public.users rename to profiles;

alter table public.profiles
  add column if not exists timezone text not null default 'UTC',
  add column if not exists reminder_at time,
  add column if not exists reminder_enabled boolean not null default true,
  add column if not exists plan public.plan_tier not null default 'free',
  add column if not exists onboarded_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Replace the starter's trigger so new sign-ups land in `profiles`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- Legacy sores are kept for one release, read-only, then dropped.
-------------------------------------------------------------------------------

alter table public.sores rename to sores_legacy;

-------------------------------------------------------------------------------
-- sores
-------------------------------------------------------------------------------

create table public.sores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  surface public.sore_surface not null,
  -- Normalised position within the surface, 0..1 on each axis.
  x real not null check (x >= 0 and x <= 1),
  y real not null check (y >= 0 and y <= 1),
  onset_date date not null default current_date,
  healed_date date check (healed_date is null or healed_date >= onset_date),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sores_user_active_idx on public.sores (user_id) where healed_date is null;
create index sores_user_onset_idx on public.sores (user_id, onset_date desc);

alter table public.sores enable row level security;
create policy "Users manage own sores" on public.sores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger sores_set_updated_at
  before update on public.sores
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- sore_logs: one observation per sore per day
-------------------------------------------------------------------------------

create table public.sore_logs (
  id uuid primary key default gen_random_uuid(),
  sore_id uuid not null references public.sores on delete cascade,
  -- Denormalised so RLS is a single column compare.
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  size_mm smallint not null check (size_mm between 1 and 30),
  pain smallint not null check (pain between 0 and 10),
  notes text,
  -- True when the entry was made for a day other than the one it describes.
  logged_late boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sore_id, log_date)
);

create index sore_logs_user_date_idx on public.sore_logs (user_id, log_date desc);

alter table public.sore_logs enable row level security;
create policy "Users manage own sore logs" on public.sore_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger sore_logs_set_updated_at
  before update on public.sore_logs
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- daily_entries: one per user per day
-------------------------------------------------------------------------------

create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  entry_date date not null,
  stress smallint check (stress between 0 and 4),
  sleep_quality smallint check (sleep_quality between 0 and 4),
  overall_pain smallint check (overall_pain between 0 and 10),
  notes text,
  logged_late boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.daily_entries enable row level security;
create policy "Users manage own daily entries" on public.daily_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger daily_entries_set_updated_at
  before update on public.daily_entries
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- factors: preset catalogue (user_id null) + per-user additions
-------------------------------------------------------------------------------

create table public.factors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  kind public.factor_kind not null,
  name text not null check (char_length(name) between 1 and 60),
  is_preset boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint factors_preset_has_no_owner check (
    (is_preset and user_id is null) or (not is_preset and user_id is not null)
  )
);

create unique index factors_unique_name_idx
  on public.factors (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, lower(name));

alter table public.factors enable row level security;
create policy "Anyone signed in reads presets and own factors" on public.factors
  for select using (user_id is null or auth.uid() = user_id);
create policy "Users add own factors" on public.factors
  for insert with check (auth.uid() = user_id and not is_preset);
create policy "Users update own factors" on public.factors
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id and not is_preset);
create policy "Users delete own factors" on public.factors
  for delete using (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- entry_factors: which factors applied on a given day
-------------------------------------------------------------------------------

create table public.entry_factors (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries on delete cascade,
  factor_id uuid not null references public.factors on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  -- Optional: a topical treatment applied to one specific sore.
  sore_id uuid references public.sores on delete cascade,
  detail text,
  created_at timestamptz not null default now(),
  unique nulls not distinct (daily_entry_id, factor_id, sore_id)
);

create index entry_factors_user_idx on public.entry_factors (user_id);
create index entry_factors_factor_idx on public.entry_factors (factor_id);

alter table public.entry_factors enable row level security;
create policy "Users manage own entry factors" on public.entry_factors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- sore_photos: schema-ready, shipped with the Pro tier
-------------------------------------------------------------------------------

create table public.sore_photos (
  id uuid primary key default gen_random_uuid(),
  sore_id uuid not null references public.sores on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  -- Path inside the private `sore-photos` bucket: <user_id>/<sore_id>/<uuid>.jpg
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.sore_photos enable row level security;
create policy "Users manage own sore photos" on public.sore_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('sore-photos', 'sore-photos', false)
on conflict (id) do nothing;

create policy "Users read own sore photo files" on storage.objects
  for select using (
    bucket_id = 'sore-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users write own sore photo files" on storage.objects
  for insert with check (
    bucket_id = 'sore-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users delete own sore photo files" on storage.objects
  for delete using (
    bucket_id = 'sore-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

-------------------------------------------------------------------------------
-- flare_ups: derived view. A flare-up is a run of consecutive days on which the
-- user had at least one unhealed sore.
-------------------------------------------------------------------------------

create view public.flare_ups
with (security_invoker = true)
as
with sore_days as (
  select s.user_id, d::date as day
  from public.sores s
  cross join lateral generate_series(
    s.onset_date,
    coalesce(s.healed_date, current_date),
    interval '1 day'
  ) as d
  group by s.user_id, d
),
islands as (
  select
    user_id,
    day,
    day - (row_number() over (partition by user_id order by day))::int as grp
  from sore_days
)
select
  user_id,
  min(day) as started_on,
  max(day) as ended_on,
  count(*)::int as days,
  max(day) >= current_date as is_active
from islands
group by user_id, grp;

-------------------------------------------------------------------------------
-- Preset factor catalogue
-------------------------------------------------------------------------------

insert into public.factors (kind, name, is_preset) values
  ('food', 'Citrus', true),
  ('food', 'Tomatoes', true),
  ('food', 'Spicy food', true),
  ('food', 'Chocolate', true),
  ('food', 'Coffee', true),
  ('food', 'Nuts', true),
  ('food', 'Strawberries', true),
  ('food', 'Pineapple', true),
  ('food', 'Salty snacks', true),
  ('food', 'Alcohol', true),
  ('food', 'Gluten', true),
  ('food', 'Dairy', true),
  ('medication', 'Ibuprofen', true),
  ('medication', 'Acetaminophen', true),
  ('medication', 'Antibiotic', true),
  ('medication', 'Vitamin B12', true),
  ('medication', 'Iron supplement', true),
  ('medication', 'Folate', true),
  ('medication', 'Zinc', true),
  ('medication', 'Antihistamine', true),
  ('treatment', 'Benzocaine gel', true),
  ('treatment', 'Salt water rinse', true),
  ('treatment', 'Baking soda rinse', true),
  ('treatment', 'Hydrogen peroxide rinse', true),
  ('treatment', 'Chlorhexidine rinse', true),
  ('treatment', 'Steroid paste', true),
  ('treatment', 'Canker patch', true),
  ('treatment', 'Alum', true),
  ('treatment', 'Honey', true),
  ('treatment', 'Lysine', true),
  ('illness', 'Cold', true),
  ('illness', 'Flu', true),
  ('illness', 'Fever', true),
  ('illness', 'Sore throat', true),
  ('illness', 'Stomach upset', true),
  ('dental', 'Bit cheek or lip', true),
  ('dental', 'Braces or appliance rubbing', true),
  ('dental', 'Dental work', true),
  ('dental', 'Sharp food injury', true),
  ('dental', 'SLS toothpaste', true),
  ('dental', 'Toothbrush injury', true),
  ('cycle', 'Period started', true),
  ('cycle', 'Ovulation', true),
  ('other', 'Travel', true),
  ('other', 'Big life event', true)
on conflict do nothing;
