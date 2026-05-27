# SITEMAP

An annotated, file-level map of the Ask Madhav codebase. **One line per file.**

> **Maintenance rule:** when you add, delete, move, or significantly repurpose any file, update this map in the same change. This keeps every future session oriented without re-exploring the tree. Keep `CLAUDE.md` (the "why/how") and this file (the "what/where") in sync.

The live application is everything under `frontend/`. The repo root holds data-generation tooling; `backend/` is a retired reference implementation.

---

## `frontend/` — the live Next.js 14 app (App Router)

### `frontend/app/` — routes & pages
| File | Description |
|---|---|
| `app/layout.tsx` | Root layout — fonts, metadata, global chrome wrapping every page. |
| `app/page.tsx` | Single-page home — composes Hero, DailyVerse, ChatInterface, PopularVerses, StoryCards, SubscribeRitual. |
| `app/globals.css` | Tailwind base + global styles (sacred light theme). |
| `app/icon.svg` | App favicon / icon. |
| `app/journal/page.tsx` | `/journal` route — renders the Sankalpa Journal (auth-gated). |
| `app/verse/[reference]/page.tsx` | `/verse/2.47` deep-link page; `generateMetadata` produces share/OG tags per verse. |
| `app/whatsapp/page.tsx` | `/whatsapp` — QR code + "Open WhatsApp chat" deep link (`wa.me`) to chat with Madhav in WhatsApp. Gated on `NEXT_PUBLIC_WHATSAPP_NUMBER`. |

### `frontend/app/api/` — server routes (verse engine + integrations)
| File | Description |
|---|---|
| `api/ask/route.ts` | **Core RAG endpoint.** Rate limit → bounded input → `answerQuestion()` (shared pipeline). Never hard-fails. `runtime=nodejs`. |
| `api/whatsapp/route.ts` | **WhatsApp webhook** (Meta Cloud API). GET = verification handshake; POST = inbound messages → dedup → command/greeting → `answerQuestion()` → reply + grounding verse. Always 200s. `runtime=nodejs`. |
| `api/daily-verse/route.ts` | Returns the day-of-year rotating verse; cached for the day. |
| `api/verse/route.ts` | Returns one verse (`?ref=`) or many (`?refs=a,b,c`) by reference via `findVerse`; powers the Popular Verses cards. `runtime=nodejs`. |
| `api/tts/route.ts` | Read-aloud: Gemini TTS (`gemini-2.5-flash-preview-tts`, voice "Charon") → WAV; guaranteed calm male voice (Hindi/English) on `GEMINI_API_KEY`. 503 → client falls back to SpeechSynthesis. |
| `api/stories/route.ts` | Returns Mahabharata stories from `data/stories.json`. |
| `api/og/route.tsx` | Generates a shareable Wisdom Card PNG via `next/og`. `?ref=` → verse card; `?quote=&q=` → conversation/quote card (Madhav's line + the question). `runtime=nodejs`. |
| `api/subscribe/route.ts` | Daily Ritual email sign-up (writes subscriber to Supabase). |
| `api/unsubscribe/route.ts` | Daily Ritual unsubscribe (GET link from email). |
| `api/cron/daily-ritual/route.ts` | Sends the daily verse email to subscribers; guarded by `CRON_SECRET`. Vercel Cron @ 13:00 UTC. |

### `frontend/lib/` — server + client logic
| File | Description |
|---|---|
| `lib/verseEngine.ts` | **Keyword/theme retrieval engine** (TS port of the Python original). In-memory index, scoring, template answer, daily/lookup helpers, disclaimer. |
| `lib/gemini.ts` | Gemini RAG layer — `SYSTEM_INSTRUCTION` (Madhav persona), context builder, `generateGuidance()`. Returns null when no key / on failure. |
| `lib/guidance.ts` | **Shared guidance pipeline** — `answerQuestion()`: retrieval → template answer → optional Gemini overlay. Used by both `/api/ask` and the WhatsApp webhook so channels never drift. |
| `lib/whatsapp/client.ts` | Meta WhatsApp Cloud API client — `sendWhatsAppText()` (chunks long replies), `isWhatsAppConfigured()`, `verifySignature()` (X-Hub-Signature-256). |
| `lib/whatsapp/memory.ts` | Per-phone conversation memory + message-id dedup over Upstash Redis (fail-open; stateless without it). Roadmap: migrate to Supabase at scale. |
| `lib/ratelimit.ts` | Two-layer fail-open rate limiter: Upstash Redis → in-memory sliding window (20/60s). |
| `lib/api.ts` | Client-side fetch wrappers for the API routes (`askQuestion`, `getDailyVerse`, …). |
| `lib/email.ts` | Resend email helpers + `isEmailEnabled()` gate for the Daily Ritual. The daily verse email includes a theme-aware reflection prompt + a "set today's intention & keep your streak" Journal CTA. |
| `lib/journal.ts` | Sankalpa Journal data ops (saved verses, intentions, moods, streaks) over Supabase. |
| `lib/supabase/client.ts` | Browser Supabase client (anon key, RLS) + `isSupabaseConfigured()`. |
| `lib/supabase/admin.ts` | Server Supabase client (service-role key) for subscriber writes & cron. |

### `frontend/components/`
| File | Description |
|---|---|
| `components/Hero.tsx` | Landing hero — Kurukshetra image (`public/art/scene-2.png`), rotating shloka, CTAs. |
| `components/HeroVerse.tsx` | Rotating hero shloka; opens with Gita 4.7 ("Yada yada hi dharmasya"), cross-fades through iconic verses. |
| `components/Navbar.tsx` | Top navigation bar. |
| `components/ChatInterface.tsx` | Multi-turn "Ask Madhav" chat UI; profile (age/language) + auto-read toggle, mic input, per-answer Listen/Copy/Share; **persists the conversation to `localStorage`** (capped 20 turns) with a returning-seeker recap + "Start a new conversation"; rotating suggested prompts; per-answer "Make this my intention" → Journal; always-present crisis helpline line. Calls `/api/ask`. |
| `components/GuidedPaths.tsx` | "Walk a Path" — 4 curated multi-verse journeys (Letting Go, Facing Fear, Grief, Purpose); steps link to verse pages, CTA prefills the chat. Pure curation, no API. |
| `components/BackToTop.tsx` | Floating lotus "↑ top" button; appears after ~1 viewport of scroll. |
| `components/ChapterBridge.tsx` | "Read all of Chapter N" link on a verse card; prefills the chat (or stashes to `sessionStorage` + navigates home when off the home page). |
| `components/DailyVerse.tsx` | Verse-of-the-day — two-column card with `scene-1` image, breathing aura, reveal-on-tap practical step. |
| `components/VerseCard.tsx` | Reusable verse renderer (Sanskrit/transliteration/Hindi/English); `compact` mode; full mode shows Save/Share + a `ChapterBridge` "Read all of Chapter N". |
| `components/PopularVerses.tsx` | Curated grid; shows Sanskrit, expands (via `/api/verse`) to Hindi+English meaning; AI ("Reflect with Madhav") is optional. |
| `components/ChapterBrowser.tsx` | 18 chapter cards; expand to read each chapter's essence; AI ("Explore with Madhav") is optional. |
| `components/StoryCards.tsx` | Mahabharata story cards from `/api/stories`. |
| `components/VerseAudio.tsx` | Browser SpeechSynthesis recitation w/ word highlighting + meditation loop. |
| `components/SpeakButton.tsx` | Reads an answer aloud — server TTS (`/api/tts`, guaranteed male voice) with SpeechSynthesis fallback; `autoPlay` for hands-free/accessible use. |
| `components/MicButton.tsx` | Voice question input via Web Speech API (SpeechRecognition); language-aware; hidden where unsupported. |
| `components/ShareVerse.tsx` | Share controls (links to the OG Wisdom Card). |
| `components/SaveVerseButton.tsx` | Save a verse to the journal (Supabase, auth-gated). |
| `components/SubscribeRitual.tsx` | Daily Ritual email sign-up form → `/api/subscribe`. |
| `components/SacredArt.tsx` | Decorative sacred art / motifs (sun rays, peacock feather, lotus, petals). |
| `public/art/scene-1..3.png` | Krishna & Arjuna at Kurukshetra (AI-generated); `scene-2` is the hero image. |
| `components/ScrollReveal.tsx` | Scroll-triggered reveal animation wrapper. |
| `components/journal/JournalApp.tsx` | Full journal experience (saved verses, daily intention, streak, themes); consumes a `askmadhav_pending_intention` handoff from the chat to prefill today's intention. |

### `frontend/` — data, types, config
| File | Description |
|---|---|
| `data/verses.json` | **The dataset bundled into the app — all 701 clean verses** (Sanskrit + IAST transliteration + Hindi + English + keywords/themes/guidance). Generated by `build_verses.py`. |
| `data/verses.curated.json` | The 30 hand-curated rich verses — stable override source for `build_verses.py` (never overwritten by the build). |
| `data/stories.json` | 5 Mahabharata stories. |
| `types/index.ts` | Shared client types (`Verse`, `Story`, `VerseCard`, `AskResponse`, `ChatMessage`, …). |
| `supabase/schema.sql` | Postgres schema for journal/subscribers — run in the Supabase SQL editor. |
| `vercel.json` | Vercel config: Next.js preset + daily-ritual cron registration. |
| `next.config.js` | Next.js config. |
| `tailwind.config.ts` | Tailwind theme/config. |
| `postcss.config.js` | PostCSS/Tailwind pipeline. |
| `tsconfig.json` | TS config; `@/*` alias → `frontend/` root. |
| `.eslintrc.json` | ESLint (eslint-config-next). |
| `package.json` | Scripts (`dev`/`build`/`start`/`lint`) + deps. |
| `.vercel/project.json` | Linked Vercel project metadata. |

---

## Repo root — data generation & docs

| File | Description |
|---|---|
| `build_verses.py` | **Canonical dataset builder.** Cleans the raw scrape (strips translation/commentary prefixes, de-pollutes keywords), scrapes clean Mool Shlokas from IIT Kanpur (parallel, resumable), transliterates Devanagari→IAST offline, strips speaker tags, overlays the curated 30, writes `frontend/data/verses.json`. |
| `generate_verses.py` | **Legacy/superseded** original scraper. Captured the wrong Sanskrit field (commentary, not shloka) and left transliterations empty — kept for reference; use `build_verses.py` instead. |
| `verses_700.json` | Raw scraper output — **dirty** (commentary in `sanskrit_text`, empty transliterations, prefixed Hindi/English). Input to `build_verses.py`, not used directly. |
| `verses_clean.json` | Redundant root copy of the built dataset (gitignored). |
| `.shloka_cache.json` | Resumable Mool-Shloka scrape cache for `build_verses.py` (gitignored). |
| `data/verses.json` | Root copy of the (dirty) raw dataset. |
| `data/stories.json` | Root copy of the stories. |
| `data/schema.sql` | Legacy DB schema. |
| `data/seed.sql` | Legacy DB seed data. |
| `README.md` | Project overview, features, quick start, deploy guide. |
| `CLAUDE.md` | Architecture & guidance for Claude Code sessions. |
| `push_to_github.sh`, `fix_and_push.sh` | One-off git helper scripts. |

---

## `backend/` — RETIRED reference implementation (not wired to the app)

FastAPI + Django hybrid that originally served the verse engine. Kept for reference; not needed to run or deploy. `verse_engine.py` / `data_loader.py` / `answer_generator.py` are the Python originals that `frontend/lib/verseEngine.ts` was ported from.

| File | Description |
|---|---|
| `backend/main.py` | FastAPI app exposing the original ask/daily-verse/stories endpoints. |
| `backend/verse_engine.py` *(api/)* | Original keyword retrieval engine (ported to TS). |
| `backend/data_loader.py` | Loads verses/stories, builds the keyword index. |
| `backend/answer_generator.py` | Builds the template answer (ported to TS). |
| `backend/test_questions.py` | Ad-hoc question test harness. |
| `backend/askmadhav/settings.py` | Django settings. |
| `backend/askmadhav/urls.py`, `wsgi.py` | Django URL conf / WSGI entry. |
| `backend/api/models.py` | Django models: Scripture → Chapter → Verse, ChatHistory, etc. |
| `backend/api/views.py`, `urls.py`, `serializers.py`, `admin.py` | DRF views, routes, serializers, admin. |
| `backend/api/management/commands/seed_data.py` | `manage.py seed_data` — seeds the DB. |
| `backend/api/migrations/0001_initial.py` | Initial migration. |
| `backend/data/verses.json`, `stories.json` | Backend's data copies. |
| `backend/requirements.txt`, `runtime.txt`, `Procfile`, `railway.toml` | Python deps + Railway deploy config. |
| `backend/manage.py` | Django management entry point. |
