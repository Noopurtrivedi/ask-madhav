-- ═══════════════════════════════════════════════════════════════════════════
-- Ask Madhav — Darshan Experience Engine: admin / CMS schema
--
-- Run this in the Supabase SQL editor AFTER `schema.sql`.
--
-- ── Why these tables exist ────────────────────────────────────────────────
-- Everything the engine renders that carries spiritual or legal weight — the
-- name of a sacred form, the wording of a shloka's meaning, the licence on a 3D
-- model — is content, not code. Content can be reviewed, corrected and rolled
-- back by a person without a deploy. That is the entire point.
--
-- The engine ships with working defaults in `lib/darshan/config.ts` and
-- `data/quotes.json`, so the app runs with none of this present. These tables
-- are the upgrade path, and the column names match the TypeScript interfaces in
-- `lib/darshan/types.ts` 1:1 — keep them in sync.
--
-- ── Access model ──────────────────────────────────────────────────────────
-- All of this is *published content*: readable by everyone, writable only by
-- the service role (the admin surface) — never by an authenticated end user.
-- Each table therefore gets RLS on, a public SELECT policy limited to rows that
-- have cleared review, and no INSERT/UPDATE/DELETE policy at all.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── Enums ─────────────────────────────────────────────────────────────────

do $$ begin
  create type sacred_asset_type as enum (
    'avatar_model', 'symbol', 'texture', 'environment', 'lottie', 'rive', 'audio', 'image'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type cultural_review_status as enum ('pending', 'approved', 'rejected', 'not_required');
exception when duplicate_object then null; end $$;

do $$ begin
  create type entry_animation as enum ('light_bloom', 'mist_rise', 'mandala_open', 'fade', 'none');
exception when duplicate_object then null; end $$;


-- ── Asset licence records ─────────────────────────────────────────────────
-- The legal spine. A model may not be referenced by a form until it has a row
-- here with commercial_use_allowed = true AND cultural_review_status =
-- 'approved'. `sacred_assets` enforces that with a foreign key; the app
-- enforces it again at read time. Two locks, because getting this wrong means
-- shipping unlicensed religious artwork.
create table if not exists public.asset_license_records (
  id uuid primary key default gen_random_uuid(),
  license_source text not null,          -- 'commissioned', 'CC0', 'CC-BY-4.0', vendor name…
  license_url text,
  license_holder text,                   -- who granted it
  acquired_on date,
  expires_on date,                       -- null = perpetual
  commercial_use_allowed boolean not null default false,
  modification_allowed boolean not null default false,
  ai_usage_allowed boolean not null default false,
  attribution_required boolean not null default false,
  attribution_text text,
  -- Where the paperwork lives. A licence you cannot produce on demand is not a
  -- licence you have.
  proof_url text,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ── Sacred assets ─────────────────────────────────────────────────────────
create table if not exists public.sacred_assets (
  id uuid primary key default gen_random_uuid(),
  asset_name text not null unique,
  asset_type sacred_asset_type not null,
  model_url text,
  thumbnail_url text,
  file_format text,                      -- 'glb', 'gltf', 'svg', 'json'…
  file_size_bytes bigint,
  -- Denormalised from the licence record for fast filtering; kept honest by
  -- `sacred_assets_license_consistent` below.
  license_source text not null,
  license_record_id uuid references public.asset_license_records (id) on delete restrict,
  commercial_use_allowed boolean not null default false,
  modification_allowed boolean not null default false,
  ai_usage_allowed boolean not null default false,
  cultural_review_status cultural_review_status not null default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- An approved review must record who approved it and when. Unattributed
  -- approval is not review.
  constraint sacred_assets_review_attributed check (
    cultural_review_status <> 'approved'
    or (reviewed_by is not null and reviewed_at is not null)
  )
);

-- A publishable asset must carry a licence record.
create or replace function public.sacred_asset_is_publishable(asset public.sacred_assets)
returns boolean language sql immutable as $$
  select asset.commercial_use_allowed
     and asset.cultural_review_status = 'approved'
     and asset.license_record_id is not null
$$;


-- ── Visual moods ──────────────────────────────────────────────────────────
-- A mood maps a feeling to a palette + a background symbol. Quotes and forms
-- reference a mood rather than raw hex, so re-tuning the look is one edit.
create table if not exists public.visual_moods (
  id text primary key,                   -- 'dawn', 'stillness', 'cosmos'…
  display_name text not null,
  palette_primary text not null,
  palette_deep text not null,
  palette_accent text not null,
  palette_glow text not null,
  -- Must be an id rendered by components/darshan/SacredSymbols.tsx. Never a URL:
  -- symbols are drawn in code so a mood cannot reference downloaded artwork.
  background_symbol text not null,
  particle_density numeric(3, 2) not null default 0.5
    check (particle_density between 0 and 1),
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ── Quote categories ──────────────────────────────────────────────────────
create table if not exists public.quote_categories (
  id text primary key,                   -- 'karma', 'dharma', 'devotion'…
  display_name text not null,
  description text default '',
  default_mood text references public.visual_moods (id) on delete set null,
  display_order integer not null default 0,
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ── Gita quotes ───────────────────────────────────────────────────────────
-- Seeded from `data/quotes.json` (generated by scripts/gen_quotes.js).
--
-- `english_meaning` is a plain-language rendering for display, NOT a scholarly
-- translation — that distinction is why `reviewer_notes` and `active_status`
-- exist. A quote is not shown until someone has read it and agreed it is fair
-- to the verse.
create table if not exists public.gita_quotes (
  id text primary key,                   -- 'gq_2_47'
  chapter integer not null check (chapter between 1 and 18),
  verse integer not null check (verse > 0),
  reference text not null,               -- '2.47' — matches data/verses.json
  sanskrit text not null,
  transliteration text not null,         -- IAST
  english_meaning text not null,
  hindi_meaning text,
  theme text not null references public.quote_categories (id) on delete restrict,
  mood text references public.visual_moods (id) on delete set null,
  display_priority integer not null default 50,
  -- Optional recitation. The app never autoplays audio; this is opt-in playback.
  audio_url text,
  audio_asset_id uuid references public.sacred_assets (id) on delete set null,
  active_status boolean not null default false,
  reviewer_notes text default '',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (reference),
  -- Nothing goes live unreviewed.
  constraint gita_quotes_reviewed_before_active check (
    active_status = false or (reviewed_by is not null and reviewed_at is not null)
  )
);

create index if not exists gita_quotes_theme_idx
  on public.gita_quotes (theme, display_priority desc) where active_status;


-- ── Avatar forms (the nine) ───────────────────────────────────────────────
-- Deliberately data. Naming a sacred form is a theological act; the codebase
-- asserts nothing about what these are. `active_status` cannot be true without
-- a recorded review — see the constraint.
create table if not exists public.avatar_forms (
  form_id text primary key,
  display_name text not null,
  spiritual_theme text default '',
  description text default '',
  symbol text not null default 'lotus_mandala',
  -- Null → the procedural placeholder presence is rendered instead.
  model_asset_id uuid references public.sacred_assets (id) on delete set null,
  model_url text,
  thumbnail_url text,
  animation_set_id text,
  quote_theme text references public.quote_categories (id) on delete set null,
  palette_primary text not null default '#F0B830',
  palette_deep text not null default '#12203F',
  palette_accent text not null default '#D4A017',
  palette_glow text not null default '#FFE9B0',
  entry_animation entry_animation not null default 'fade',
  display_order integer not null default 0,
  active_status boolean not null default false,
  reviewer_notes text default '',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint avatar_forms_reviewed_before_active check (
    active_status = false
    or (reviewed_by is not null and reviewed_at is not null and length(trim(reviewer_notes)) > 0)
  )
);


-- ── Animation states ──────────────────────────────────────────────────────
-- The tuning table for the twelve engine states (lib/darshan/states.ts). Lets a
-- designer slow the whole experience down without a deploy. `state_id` values
-- must match the `DarshanState` union exactly.
create table if not exists public.animation_states (
  state_id text primary key,             -- 'idle', 'thinking', 'blessing'…
  intensity numeric(3, 2) not null default 0.5 check (intensity between 0 and 1),
  tempo numeric(4, 2) not null default 1.0 check (tempo > 0),
  next_state text,                       -- auto-advance target, null = stay
  hold_ms integer check (hold_ms is null or hold_ms >= 0),
  description text default '',
  updated_at timestamptz not null default now()
);


-- ── Page transition settings ──────────────────────────────────────────────
-- Single-row table (id = 'default'). Guards the "do not trigger heavy feather
-- animation on every tiny page transition" rule as data.
create table if not exists public.page_transition_settings (
  id text primary key default 'default',
  mor_pankh_on_first_load boolean not null default true,
  mor_pankh_on_refresh boolean not null default true,
  mor_pankh_feather_count integer not null default 3 check (mor_pankh_feather_count between 0 and 6),
  mor_pankh_duration_ms integer not null default 1800,
  chakra_launch_enabled boolean not null default true,
  chakra_launch_duration_ms integer not null default 1500,
  route_fade_ms integer not null default 320,
  vishwaroop_enabled boolean not null default true,
  vishwaroop_require_consent boolean not null default true,
  vishwaroop_max_duration_ms integer not null default 24000,
  hero_mode text not null default 'auto' check (hero_mode in ('3d', 'static', 'auto')),
  hero_active_form_id text references public.avatar_forms (form_id) on delete set null,
  default_mood text references public.visual_moods (id) on delete set null,
  quote_rotate_ms integer not null default 9000,
  quote_show_hindi boolean not null default false,
  updated_at timestamptz not null default now(),

  constraint page_transition_settings_singleton check (id = 'default')
);


-- ── Spiritual content review notes ────────────────────────────────────────
-- The audit trail. Any row in any table above can be pointed at, so a
-- reviewer's reasoning survives the edit it was about.
create table if not exists public.spiritual_content_review_notes (
  id uuid primary key default gen_random_uuid(),
  subject_table text not null,           -- 'gita_quotes', 'avatar_forms'…
  subject_id text not null,
  reviewer_name text not null,
  reviewer_role text,                    -- 'founder', 'scholar', 'community'…
  verdict text not null check (verdict in ('approved', 'changes_requested', 'rejected')),
  notes text not null,
  created_at timestamptz not null default now()
);

create index if not exists review_notes_subject_idx
  on public.spiritual_content_review_notes (subject_table, subject_id, created_at desc);


-- ── User motion preferences ───────────────────────────────────────────────
-- The seeker's own accessibility choice. Lives in localStorage for anonymous
-- visitors (see lib/darshan/tier.ts); this table is only for signed-in seekers
-- who want it to follow them between devices.
create table if not exists public.user_motion_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preference text not null default 'auto'
    check (preference in ('auto', 'full', 'reduced', 'text-only')),
  mute_ambient boolean not null default false,
  updated_at timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.asset_license_records          enable row level security;
alter table public.sacred_assets                  enable row level security;
alter table public.visual_moods                   enable row level security;
alter table public.quote_categories               enable row level security;
alter table public.gita_quotes                    enable row level security;
alter table public.avatar_forms                   enable row level security;
alter table public.animation_states               enable row level security;
alter table public.page_transition_settings       enable row level security;
alter table public.spiritual_content_review_notes enable row level security;
alter table public.user_motion_preferences        enable row level security;

-- Published content: world-readable, but only what has cleared review.
create policy "published quotes are readable" on public.gita_quotes
  for select using (active_status);
create policy "active forms are readable" on public.avatar_forms
  for select using (active_status);
create policy "active moods are readable" on public.visual_moods
  for select using (active_status);
create policy "active categories are readable" on public.quote_categories
  for select using (active_status);
create policy "animation tuning is readable" on public.animation_states
  for select using (true);
create policy "transition settings are readable" on public.page_transition_settings
  for select using (true);

-- Assets are readable only once they are genuinely publishable.
create policy "publishable assets are readable" on public.sacred_assets
  for select using (commercial_use_allowed and cultural_review_status = 'approved');

-- Licence paperwork and review notes are internal. No public policy at all →
-- the service role (which bypasses RLS) is the only reader.

-- A seeker owns their own motion preference and nothing else.
create policy "own motion preference - select" on public.user_motion_preferences
  for select using (auth.uid() = user_id);
create policy "own motion preference - upsert" on public.user_motion_preferences
  for insert with check (auth.uid() = user_id);
create policy "own motion preference - update" on public.user_motion_preferences
  for update using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- Seed — mirrors lib/darshan/config.ts and lib/darshan/registry.ts.
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.visual_moods
  (id, display_name, palette_primary, palette_deep, palette_accent, palette_glow, background_symbol, particle_density)
values
  ('dawn',      'Dawn',      '#F0B830', '#3A2A18', '#E8A620', '#FFE9B0', 'sun_rays',       0.60),
  ('stillness', 'Stillness', '#8FB8C9', '#1B2A38', '#D4A017', '#E6F1F6', 'still_water',    0.25),
  ('ember',     'Ember',     '#E8A620', '#2A1608', '#F6D27A', '#FFD27A', 'lamp_flame',     0.70),
  ('cosmos',    'Cosmos',    '#6C63C4', '#0A0F2E', '#D4A017', '#BFB6FF', 'cosmic_mandala', 1.00),
  ('river',     'River',     '#2F8F6B', '#10322B', '#E8A620', '#BFE8D6', 'still_water',    0.40),
  ('lamp',      'Lamp',      '#D4A017', '#241A0C', '#FFE9B0', '#FFDD9E', 'lamp_flame',     0.35),
  ('bloom',     'Bloom',     '#D98CA6', '#2E1626', '#E8A620', '#FFD9E4', 'lotus_mandala',  0.50)
on conflict (id) do nothing;

insert into public.quote_categories (id, display_name, description, default_mood, display_order) values
  ('karma',      'Karma — Action',          'Doing the work that is yours to do, and letting the fruit go.', 'ember',     1),
  ('dharma',     'Dharma — Right Path',     'Knowing your own way and walking it, imperfectly, honestly.',   'dawn',      2),
  ('detachment', 'Vairagya — Detachment',   'Holding without gripping. Present, unstained.',                 'river',     3),
  ('devotion',   'Bhakti — Devotion',       'Love as a way of knowing; surrender as a way of resting.',      'bloom',     4),
  ('mind',       'Manas — The Mind',        'The mind as friend and adversary; the work of turning it.',     'lamp',      5),
  ('discipline', 'Abhyasa — Discipline',    'Steadiness practised daily until it becomes nature.',           'lamp',      6),
  ('peace',      'Shanti — Peace',          'What remains when the wanting stops arguing.',                  'stillness', 7),
  ('courage',    'Dhairya — Courage',       'Standing in what is, because what you are cannot be destroyed.','cosmos',    8),
  ('clarity',    'Jnana — Clarity',         'Seeing plainly, without the story laid over the top.',          'cosmos',    9)
on conflict (id) do nothing;

insert into public.animation_states (state_id, intensity, tempo, next_state, hold_ms, description) values
  ('loading',           0.35, 1.00, null,     null, 'First paint. The chakra holds the centre; nothing else moves.'),
  ('entering',          0.85, 0.90, 'idle',   2200, 'The chakra has flown to the logo and the scene blooms into being.'),
  ('idle',              0.30, 1.00, null,     null, 'Rest. Breathing aura, slow drift, nothing demanding attention.'),
  ('quote_reveal',      0.50, 1.15, 'idle',   2600, 'A shloka surfaces; the scene quietens so the words can be read.'),
  ('thinking',          0.55, 1.20, null,     null, 'A question has been asked. Inward, attentive, unhurried.'),
  ('answering',         0.70, 1.00, 'idle',   2800, 'The answer arrives. The aura opens a little; the chakra settles.'),
  ('blessing',          0.90, 1.30, 'idle',   3200, 'A benedictory beat after a deep answer. The aura expands, then rests.'),
  ('chakra_processing', 0.50, 0.85, null,     null, 'Generic async work. Only the chakra moves — the scene waits.'),
  ('vishwaroop_reveal', 1.00, 0.75, null,     null, 'The cosmic form. Rare, consented, bounded in time.'),
  ('page_transition',   0.25, 1.00, 'idle',    700, 'A route change. A soft cross-fade — never a feather storm.'),
  ('error',             0.15, 1.80, 'idle',   2600, 'Something failed. The engine slows and dims. It never flashes.'),
  ('reduced_motion',    0.00, 1.00, null,     null, 'Motion is off by preference. Static, legible, complete.')
on conflict (state_id) do nothing;

-- The one form that ships active: Madhav as light, not likeness.
insert into public.avatar_forms
  (form_id, display_name, spiritual_theme, description, symbol, quote_theme,
   palette_primary, palette_deep, palette_accent, palette_glow,
   entry_animation, display_order, active_status, reviewer_notes, reviewed_by, reviewed_at)
values
  ('madhav_presence', 'Madhav', 'Presence',
   'Madhav as living light rather than likeness — a luminous, breathing presence crowned with mor pankh. Depicted without a face, so the seeker is turned toward their own consciousness rather than toward an image.',
   'peacock_feather', 'dharma',
   '#F0B830', '#12203F', '#D4A017', '#8FD3D8',
   'light_bloom', 1, true,
   'Approved: aniconic depiction (light, not likeness). Keeps the app clear of idol-dependency and of any claim to represent the divine Krishna.',
   'founder', now()),
  ('vishwaroop_darshan', 'Cosmic Form', 'Vastness',
   'The Vishwaroop moment of Chapter 11 rendered as scale and light: an expanding mandala, layered silhouettes, a field of stars. Awe without horror — no multiplied faces, no violence, no spectacle.',
   'cosmic_mandala', 'courage',
   '#6C63C4', '#05081C', '#D4A017', '#BFB6FF',
   'mandala_open', 2, true,
   'Approved as an abstract, non-figurative treatment. Must stay opt-in and time-bounded; must never become an ambient background.',
   'founder', now())
on conflict (form_id) do nothing;

-- Seven reserved slots. Unnamed on purpose — see docs/DARSHAN.md § The nine forms.
insert into public.avatar_forms (form_id, display_name, description, display_order, active_status, reviewer_notes)
select
  'reserved_form_' || i,
  'Reserved Form ' || i,
  'Reserved slot. Define name, theme, description, symbol and palette, attach a licensed model, record a cultural review, then activate.',
  i,
  false,
  'AWAITING DEFINITION AND CULTURAL REVIEW — do not activate.'
from generate_series(3, 9) as i
on conflict (form_id) do nothing;

insert into public.page_transition_settings (id, hero_active_form_id, default_mood)
values ('default', 'madhav_presence', 'dawn')
on conflict (id) do nothing;

-- NOTE: `gita_quotes` is intentionally NOT seeded here. Import it from
-- `data/quotes.json` so the JSON stays the single source of truth, and set
-- active_status + reviewed_by/reviewed_at per row as each is reviewed.
