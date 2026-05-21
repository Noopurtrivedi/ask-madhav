# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Ask Madhav** — a spiritual guidance app that answers real-life questions using Bhagavad Gita verses (Sanskrit + transliteration + Hindi/English meaning + a practical action step). As of May 2026 the app runs **entirely on Next.js** and deploys to Vercel's free tier with **no separate backend**. The original Python keyword engine was ported to TypeScript and runs inside Next.js API routes.

The active application is everything under `frontend/`. Run all commands from there.

## Sitemap

A complete, annotated file-level map of every source file is maintained in [`SITEMAP.md`](./SITEMAP.md) — read it first to orient quickly. **When you add, delete, move, or significantly repurpose any file, update `SITEMAP.md` in the same change** (one line per file). Keep `CLAUDE.md` (why/how) and `SITEMAP.md` (what/where) in sync so future sessions start with full context.

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # ESLint (eslint-config-next)
```

No test framework is configured. The app runs fully with **zero env vars** — every external integration is optional and gated by env var presence (see "Optional integrations" below).

## Architecture

**RAG-without-a-database.** A user question flows through two layers, the second of which is best-effort:

1. **Retrieval** (`lib/verseEngine.ts`) — a keyword/theme scoring engine over `data/verses.json`, loaded in-memory at module init (`KEYWORD_INDEX`, `VERSE_MAP` built once per server instance). Tokenizes the question, expands tokens via `THEME_EXPANSIONS` (e.g. "angry"→`anger`), scores verses (exact match = 3, prefix match = 1), returns the top 3. Always returns at least one verse (falls back to a day-of-year verse), so retrieval never fails.
2. **Generation** (`lib/gemini.ts`) — calls Google Gemini (`gemini-2.5-flash`, free tier) via raw `fetch` to the `generativelanguage.googleapis.com` REST endpoint, grounding the reply in the retrieved verses. If `GEMINI_API_KEY` is unset **or the call fails/times out (20s)**, `generateGuidance()` returns `null` and the caller falls back to `buildTemplateAnswer()` — a deterministic template response. The response includes `source: 'ai' | 'template'` so the UI knows which path ran.

This fallback discipline is the core design principle: **`/api/ask` must never hard-fail.** The route layers defenses — rate limit → bounded input → retrieval (always succeeds) → template answer → optional LLM overlay → top-level try/catch returning a friendly message.

**Madhav's persona** is defined entirely in the `SYSTEM_INSTRUCTION` prompt in `lib/gemini.ts`. Madhav **is** Krishna (the name Arjuna called him) — the persona speaks *as* Krishna, the eternal consciousness, addressing the user as "Parth". The signature move is ONE vivid metaphor (rivers/sky/fire/light/mirrors/battlefields) carrying a Gita truth, then a practical step and a reflective closing line. It does **not** paste the full multilingual verse block (the UI's `VerseCard` shows that beside the reply) — it references the verse in prose. Replies are tuned per seeker: `ANALOGY_WORLD` fits analogies to a self-declared age band, and `LANGUAGE_DIRECTIVE` answers in English / Hindi / Hinglish. Editing tone/format means editing that prompt.

### API routes (`app/api/`)
- `POST /api/ask` — the RAG endpoint above. `runtime = 'nodejs'`. Rate-limited; bounds question to 1000 chars and history to 12 turns.
- `GET /api/daily-verse` — day-of-year rotating verse.
- `GET /api/stories` — Mahabharata stories from `data/stories.json`.
- `GET /api/og` — shareable Wisdom Card PNG via `next/og`.
- `POST /api/subscribe` / `/api/unsubscribe` — Daily Ritual email sign-up (Supabase).
- `GET /api/cron/daily-ritual` — sends the daily verse email; protected by `CRON_SECRET`. Registered as a Vercel Cron at 13:00 UTC in `frontend/vercel.json`.

### Frontend
- Next.js 14 App Router. Single-page experience in `app/page.tsx` composing components from `components/` (`Hero`, `ChatInterface`, `DailyVerse`, `StoryCards`, `SubscribeRitual`, etc.). Dynamic routes: `app/verse/[reference]/` and `app/journal/`.
- `lib/api.ts` is the client-side fetch layer (same-origin; honors `NEXT_PUBLIC_API_URL` only if you point at a standalone backend).
- `@/*` path alias resolves to the `frontend/` root (`tsconfig.json`).
- `types/index.ts` holds shared client types; `lib/verseEngine.ts` re-declares its own server-side `RawVerse`/`VerseCard` interfaces — keep both in sync when changing the verse shape.

### Rate limiting (`lib/ratelimit.ts`)
Two layers, both free, fail-open: Upstash Redis (when `UPSTASH_REDIS_REST_*` are set, shared across serverless instances) → in-memory per-instance sliding window fallback. 20 requests / 60s. A limiter error never takes down the endpoint.

### Sankalpa Journal (`lib/journal.ts`, `lib/supabase/`)
Supabase magic-link auth + Postgres for saved verses, daily intentions, reflection streaks. Gated by `isSupabaseConfigured()` — the whole feature is inert without the Supabase env vars. Schema lives in `frontend/supabase/schema.sql` (run it in the Supabase SQL editor). `lib/supabase/client.ts` = browser/anon (RLS-protected); `lib/supabase/admin.ts` = server/service-role.

## Verse data — how the dataset is built

`frontend/data/verses.json` is the **only** file compiled into the app, and it now holds the **full 701-verse dataset** (clean Sanskrit shloka + IAST transliteration + Hindi + English + keywords/themes/practical guidance for every verse).

**Do NOT `cp verses_700.json frontend/data/verses.json`.** The raw `verses_700.json` at repo root is *dirty* — its `sanskrit_text` is Shankaracharya's commentary (not the shloka), every transliteration is empty, Hindi/English carry "… Translation By …" prefixes, and keywords are polluted with tokens like `english`/`translation`/`swami`. Copying it in would degrade search and display.

Instead, regenerate with **`build_verses.py`** (repo root):

```bash
python3 build_verses.py             # scrapes clean Mool Shlokas, ~8 min (8 workers)
python3 build_verses.py --no-scrape # rebuild from cache only (no network)
```

What it does: strips the translation/commentary prefixes from Hindi/English, de-pollutes keywords, scrapes the **clean Mool Shloka** from IIT Kanpur (the `show_mool=true` panel — `generate_verses.py` mistakenly grabbed the `scsh` *commentary* field), generates IAST transliteration **offline** (deterministic Devanagari→IAST in `transliterate()`), strips speaker tags (`श्रीभगवानुवाच` etc. — only the 4 real speakers, so verse content like `तमुवाच` in 2.10 is preserved), and **overlays the 30 hand-curated verses** from `frontend/data/verses.curated.json` (the stable, never-overwritten override source). A resumable scrape cache (`.shloka_cache.json`) and a redundant root copy (`verses_clean.json`) are gitignored.

Verse search quality depends on the `keywords` (5–8 emotionally resonant words) and `themes` fields per verse — these drive `verseEngine.ts` scoring, not the verse text itself. `verseEngine.ts` also retrieves by explicit reference: "2.47", "chapter 2 verse 47", or "chapter 3" route to the named verse/chapter (powers the PopularVerses / ChapterBrowser buttons).

## Legacy backend (`backend/`)

A FastAPI + Django hybrid (`backend/main.py` is FastAPI; `backend/askmadhav/` + `backend/api/` are Django) that originally served the verse engine. **It is no longer wired to the frontend or needed to run/deploy the app** — kept for reference only. `verse_engine.py` / `data_loader.py` / `answer_generator.py` are the Python originals that `lib/verseEngine.ts` was ported from. Don't spend effort here unless explicitly reviving a standalone backend.

## Optional integrations (all env-gated, set in `frontend/.env.local` or Vercel)

| Variable | Enables |
|---|---|
| `GEMINI_API_KEY` | AI chat (RAG). Absent → deterministic template replies. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sankalpa Journal (auth, saved verses, streaks). |
| `SUPABASE_SERVICE_ROLE_KEY` | Daily Ritual subscriber writes + cron (server-only). |
| `RESEND_API_KEY`, `DAILY_RITUAL_FROM_EMAIL` | Daily Ritual email delivery. |
| `CRON_SECRET` | Protects the daily-ritual cron endpoint. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Cross-instance rate limiting (else in-memory fallback). |
| `NEXT_PUBLIC_SITE_URL` | Absolute share/OG URLs. |

## Deploy

Push to GitHub → import on Vercel with **Root Directory = `frontend/`**. `frontend/vercel.json` sets the Next.js preset and the daily cron. Secrets are never committed — `.env*` is gitignored; configure them in the Vercel dashboard.

## Safety constraint

The app provides guidance *inspired by* the Gita. Madhav speaks immersively *as* Krishna, but the practical guardrails are non-negotiable and enforced by both the `disclaimer()` in `verseEngine.ts` and the persona prompt: **not** medical/legal/financial advice; never foster dependency, demand worship, encourage blind belief, or create fear; awaken the seeker to their *own* consciousness; and crisis messages (self-harm, abuse) gently redirect to a qualified professional or helpline. The Hero footer keeps a brief "inspired by the Gita … not a substitute for professional advice" note. Preserve these guardrails when editing prompts or responses.
