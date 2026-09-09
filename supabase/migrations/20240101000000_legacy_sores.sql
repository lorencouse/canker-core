-- Snapshot of the `sores` table as it existed in the hosted project before v2.
-- It was never committed to the repo; this reconstruction is derived from the
-- generated `types_db.ts` in legacy/. If the hosted database already has this
-- table, mark this migration as applied instead of running it:
--
--   supabase migration repair --status applied 20240101000000

create table if not exists public.sores (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  -- Parallel arrays: index i of each describes the same observation.
  dates text[],
  size numeric[],
  pain numeric[],
  healed text,
  -- Stage-space percentages (0-100) on the legacy mouth bitmap.
  x double precision,
  y double precision,
  gums boolean not null default false,
  zone text not null default ''
);

alter table public.sores enable row level security;

drop policy if exists "Users manage own sores" on public.sores;
create policy "Users manage own sores" on public.sores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
