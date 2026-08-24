-- Ask Madhav — Sankalpa Journal schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Row Level Security ensures users can only read/write their own rows.

-- ── Saved verses (bookmarks) ──────────────────────────────────────────
create table if not exists public.saved_verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reference text not null,
  english_meaning text,
  themes text[] default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, reference)
);

alter table public.saved_verses enable row level security;

create policy "own saved verses - select" on public.saved_verses
  for select using (auth.uid() = user_id);
create policy "own saved verses - insert" on public.saved_verses
  for insert with check (auth.uid() = user_id);
create policy "own saved verses - delete" on public.saved_verses
  for delete using (auth.uid() = user_id);

-- ── Journal entries (one Sankalpa per day) ────────────────────────────
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null default current_date,
  mood text,
  intention text,
  reflection text,
  gratitude text,
  attachment_to_release text,
  duty_today text,
  lesson_learned text,
  next_right_action text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.journal_entries
  add column if not exists gratitude text,
  add column if not exists attachment_to_release text,
  add column if not exists duty_today text,
  add column if not exists lesson_learned text,
  add column if not exists next_right_action text;

alter table public.journal_entries enable row level security;

create policy "own journal - select" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "own journal - upsert insert" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "own journal - update" on public.journal_entries
  for update using (auth.uid() = user_id);

-- ── Daily Ritual subscribers (managed by the service role) ────────────
create table if not exists public.ritual_subscribers (
  email text primary key,
  active boolean not null default true,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- No public RLS policies: only the service-role key (cron + subscribe API)
-- touches this table, which bypasses RLS.
alter table public.ritual_subscribers enable row level security;
