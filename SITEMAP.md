# SITEMAP

An annotated, file-level map of the Ask Madhav codebase. **One line per file.**

> **Maintenance rule:** when you add, delete, move, or significantly repurpose any file, update this map in the same change. This keeps every future session oriented without re-exploring the tree. Keep `CLAUDE.md` (the "why/how") and this file (the "what/where") in sync.

The live application is everything under `frontend/`. The repo root holds data-generation tooling; `backend/` is a retired reference implementation.

---

## `frontend/` — the live Next.js 16 app (App Router)

### `frontend/app/` — routes & pages
| File | Description |
|---|---|
| `app/layout.tsx` | Root layout — fonts, metadata, global chrome; wraps every route in `AuthProvider` + `AuthGate` (email-OTP sign-in gate, fail-open without Supabase). |
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
| `api/auth-email/route.ts` | Supabase **Send Email Hook** receiver — verifies the Standard-Webhooks signature, composes the branded sign-in email (one-time code + link), sends via Resend. Env-gated by `SEND_EMAIL_HOOK_SECRET`/`RESEND_API_KEY`/`AUTH_EMAIL_FROM`. |
| `api/verse-insight/route.ts` | "Go deeper" endpoint — per-verse structured deep-dive via `lib/verseInsight.ts`; CDN-cached a day; never hard-fails (template fallback). |
| `api/og/route.tsx` | Generates a shareable Wisdom Card PNG via `next/og`. `?ref=` → verse card; `?quote=&q=` → conversation/quote card (Madhav's line + the question). `runtime=nodejs`. |
| `api/subscribe/route.ts` | Daily Ritual email sign-up (writes subscriber to Supabase). |
| `api/unsubscribe/route.ts` | Daily Ritual unsubscribe (GET link from email). |
| `api/cron/daily-ritual/route.ts` | Sends the daily verse email to subscribers; guarded by `CRON_SECRET`. Vercel Cron @ 13:00 UTC. |

### `frontend/lib/` — server + client logic
| File | Description |
|---|---|
| `lib/verseEngine.ts` | **Keyword/theme retrieval engine** (TS port of the Python original). In-memory index, scoring, template answer, daily/lookup helpers, disclaimer. |
| `lib/gemini.ts` | Gemini RAG layer — `SYSTEM_INSTRUCTION` (Madhav persona), context builder, `generateGuidance()`. Prefers Vertex (via `lib/vertex.ts`) when configured, else the Gemini API key; returns null when neither is set / on failure. |
| `lib/vertex.ts` | Vertex AI transport — service-account OAuth (`google-auth-library`) + `vertexGenerateContent()` against the aiplatform endpoint. `isVertexConfigured()` gates it; spends GCP Vertex credits. Returns null on failure so chat falls back. |
| `lib/guidance.ts` | **Shared guidance pipeline** — `answerQuestion()`: retrieval → template answer → optional Gemini overlay. Used by both `/api/ask` and the WhatsApp webhook so channels never drift. |
| `lib/whatsapp/client.ts` | Meta WhatsApp Cloud API client — `sendWhatsAppText()` (chunks long replies), `isWhatsAppConfigured()`, `verifySignature()` (X-Hub-Signature-256). |
| `lib/whatsapp/memory.ts` | Per-phone conversation memory + message-id dedup over Upstash Redis (fail-open; stateless without it). Roadmap: migrate to Supabase at scale. |
| `lib/darshan-launch.ts` | Contract between the launch ritual and the page it unveils — the `madhav:darshan-ready` event (+ a `useSyncExternalStore` subscribe/snapshot pair), the `data-chakra-logo` target attribute, and the once-per-session flag. |
| `lib/motion.ts` | Motion preference — `prefersReducedMotion()` + the `useReducedMotion()` hook. The lightweight gate the ritual components check; `lib/darshan/tier.ts` builds the full tiering on top. |
| `lib/darshan/types.ts` | **Darshan engine types** — 1:1 with the `supabase/darshan-schema.sql` tables (sacred assets, forms, quotes, moods, transitions, motion prefs). |
| `lib/darshan/states.ts` | The 12-state machine: `DARSHAN_STATES` tuning profiles, the explicit `TRANSITIONS` table (illegal transitions are ignored, never thrown), `chakraStateFor()` bridge to `ChakraState`. `reduced_motion` is terminal. |
| `lib/darshan/tier.ts` | Device + preference → `full` / `lite` / `still`. Real WebGL probe, deviceMemory/cores/saveData budget, persisted seeker preference (`askmadhav_motion_pref`). Gates whether three.js is ever downloaded. |
| `lib/darshan/registry.ts` | 7 visual moods (palette + background symbol + particle density), 9 quote categories, the sacred-symbol registry. |
| `lib/darshan/config.ts` | `DEFAULT_DARSHAN_CONFIG` + the nine-form architecture (1 active, 1 Vishwaroop, 7 reserved & unnamed pending review) and `resolveDarshanConfig()` — the seam a CMS plugs into. |
| `lib/darshan/quotes.ts` | Quote source over `data/quotes.json` — theme filtering, deterministic `dailyQuote()`, mood resolution. |
| `lib/darshan/events.ts` | The `madhav:darshan` event bus + the `darshan.thinking()/answering()/blessing()/error()` facade. Lets any component drive the engine without importing it. |
| `lib/ratelimit.ts` | Two-layer fail-open rate limiter: Upstash Redis → in-memory sliding window (20/60s). |
| `lib/api.ts` | Client-side fetch wrappers for the API routes (`askQuestion`, `getDailyVerse`, …). |
| `lib/email.ts` | Resend email helpers + `isEmailEnabled()` gate for the Daily Ritual. The daily verse email includes a theme-aware reflection prompt + a "set today's intention & keep your streak" Journal CTA. |
| `lib/journal.ts` | Sankalpa Journal data ops (saved verses, intentions, moods, streaks) over Supabase. |
| `lib/verseInsight.ts` | "Go deeper" engine — per-verse structured deep-dive (essence/context/analogy/practice/reflection); Vertex → Gemini → deterministic template fallback; in-memory AI cache. |
| `lib/profileSync.ts` | Mirrors the seeker profile (age band + language) into Supabase auth user_metadata for signed-in seekers; localStorage stays the synchronous source of truth. Fail-open. |
| `lib/useTTS.ts` | Shared client narration hook — server voice (`/api/tts`) with SpeechSynthesis fallback; powers story narration. |
| `lib/supabase/client.ts` | Browser Supabase client (anon key, RLS) + `isSupabaseConfigured()`. |
| `lib/supabase/admin.ts` | Server Supabase client (service-role key) for subscriber writes & cron. |

### `frontend/components/`
| File | Description |
|---|---|
| `components/Hero.tsx` | **The Darshan** — cosmic-indigo landing hero: `CosmicBackdrop` + `MorPankh` + the arched darshan window (`public/art/scene-2.png`) + the shloka on glass + CTAs. Stays veiled until the chakra lands (`madhav:darshan-ready`), with a 3.5s failsafe reveal. |
| `components/Navbar.tsx` | Top navigation bar. `overlay` (home only) starts it transparent over the dark hero and switches to cream glass on scroll; the logo is the Sudarshan Chakra and carries `data-chakra-logo` — the target the launch ritual flies into. Shows a quiet Sign out when a seeker is signed in. |
| `components/ChatInterface.tsx` | Multi-turn "Ask Madhav" chat UI; profile (age/language) + auto-read toggle, mic input, per-answer Listen/Copy/Share; **persists the conversation to `localStorage`** (capped 20 turns) with a returning-seeker recap + "Start a new conversation"; rotating suggested prompts; per-answer "Make this my intention" → Journal; always-present crisis helpline line. Calls `/api/ask`. |
| `components/GuidedPaths.tsx` | "Walk a Path" — 4 curated multi-verse journeys (Letting Go, Facing Fear, Grief, Purpose); steps link to verse pages, CTA prefills the chat. Pure curation, no API. |
| `components/BackToTop.tsx` | Floating lotus "↑ top" button; appears after ~1 viewport of scroll. |
| `components/ChapterBridge.tsx` | "Read all of Chapter N" link on a verse card; prefills the chat (or stashes to `sessionStorage` + navigates home when off the home page). |
| `components/DailyVerse.tsx` | Verse-of-the-day — two-column card with `scene-1` image, breathing aura, reveal-on-tap practical step, and the expandable `VerseInsight` deep-dive. |
| `components/VerseCard.tsx` | Reusable verse renderer (Sanskrit/transliteration/Hindi/English); `compact` mode; full mode shows Save/Share + a `ChapterBridge` "Read all of Chapter N". |
| `components/PopularVerses.tsx` | Curated grid; shows Sanskrit, expands (via `/api/verse`) to Hindi+English meaning; AI ("Reflect with Madhav") is optional. |
| `components/ChapterBrowser.tsx` | 18 chapter cards; expand to read each chapter's essence; AI ("Explore with Madhav") is optional. |
| `components/StoryCards.tsx` | Mahabharata story cards — expand to the full hand-written narration + lesson + Gita verse anchors; "Hear the story" narrates via `lib/useTTS` (server Gemini voice, browser fallback); unfairness button prefills the chat. |
| `components/VerseInsight.tsx` | Expandable "Go deeper" study panel for one verse (essence/context/analogy/practice/reflection); lazy-fetches `/api/verse-insight`. Used by DailyVerse + verse pages. |
| `components/VerseAudio.tsx` | Browser SpeechSynthesis recitation w/ word highlighting + meditation loop. |
| `components/SpeakButton.tsx` | Reads an answer aloud — server TTS (`/api/tts`, guaranteed male voice) with SpeechSynthesis fallback; `autoPlay` for hands-free/accessible use. Emits `madhav:voice` events (live amplitude via a Web Audio analyser) so the matching `MadhavLight` avatar pulses with the voice. |
| `components/MadhavLight.tsx` | Madhav rendered as *living light* (not a face) — a luminous orb that breathes at rest and awakens/pulses with his voice via the `madhav:voice` event bus. Fail-open + reduced-motion aware. Used as the chat avatar + "thinking" indicator. |
| `components/MicButton.tsx` | Voice question input via Web Speech API (SpeechRecognition); language-aware; hidden where unsupported. |
| `components/ShareVerse.tsx` | Share controls (links to the OG Wisdom Card). |
| `components/SaveVerseButton.tsx` | Save a verse to the journal (Supabase, auth-gated). |
| `components/SubscribeRitual.tsx` | Daily Ritual email sign-up form → `/api/subscribe`. |
| `components/SacredArt.tsx` | Decorative sacred art / motifs (sun rays, peacock feather, lotus, petals). |
| `public/art/scene-1..3.png` | Krishna & Arjuna at Kurukshetra (AI-generated); `scene-2` is the hero image. |
| `components/ScrollReveal.tsx` | Scroll-triggered reveal animation wrapper. |
| `components/darshan/SudarshanChakra.tsx` | **Brand signature.** Pure-SVG discus; one rAF loop eases rotation speed + a `--chakra-glow` var toward the target for the current `ChakraState` (`idle`/`processing`/`settling`/`still`), so state changes read as momentum. Still + calm under reduced motion. |
| `components/darshan/ChakraLaunch.tsx` | The arrival ritual — indigo veil, the chakra gathers light, releases a ring, flies into the navbar logo (measured live from `data-chakra-logo`), veil dissolves. Once per session, skippable (click / Skip / Escape), skipped entirely under reduced motion. |
| `components/darshan/CosmicBackdrop.tsx` | The hero sky — indigo→peacock→violet gradient, seeded (hydration-safe) star field, turning lotus mandala + orbit rings, gold horizon, bottom dissolve into the warm page. |
| `components/darshan/MorPankh.tsx` | Krishna's peacock feather as a one-shot flourish: 3 feathers drift across on first paint. Reduced motion → one still feather with a soft glow. |
| `components/darshan/DarshanProvider.tsx` | **The engine runtime.** Owns state, device tier, config and the active quote; guards transitions; listens to the event bus and to `madhav:darshan-ready`. `useDarshan()` / `useDarshanOptional()`. Wraps the whole app in `app/layout.tsx`. |
| `components/darshan/EngineChakra.tsx` | The chakra bound to engine state (navbar logo turns while Madhav thinks) + `ChakraLoader`, the chat's processing indicator. |
| `components/darshan/QuoteReflection.tsx` | **Gita Quote Reflection module.** Sanskrit + IAST + plain English + Hindi-on-demand, theme chip, mood-mapped background symbol, glass reflection, and the four intents (Teach me · Guide me · Explain this shloka · Ask Madhav) that prefill the chat. Supersedes the old `HeroVerse`. |
| `components/darshan/MadhavPresence.tsx` | Picks the hero avatar: the 3D `KrishnaFigure` at `full` tier, the faceless `DivineSilhouette` (SVG) otherwise. The Kurukshetra photo is no longer here — it moved to `KurukshetraMoment`. Error boundary drops to the silhouette on any WebGL failure; an sr-only sentence carries the description. |
| `components/darshan/three/KrishnaFigure.tsx` | **The living 3D Krishna avatar** — a stylised, animated figure built from geometry: tribhanga stance, mukuta crown, three mor pankh (each swaying on its own phase), flute (Venugopala pose), lotus pedestal, aura + halo, key/rim/fill rig. Articulated pivot groups animate breath, weight-shift, head-tilt toward the flute, a playing lilt in the arms, a vertex-waved uttariya sash, and 'flute-song' light motes rising from the bansuri — all scaled by engine `energy`/`tempo`. Faceless by the safety constraint; recognisable by silhouette. Placeholder until a commissioned GLB (docs/ASSETS.md). |
| `components/darshan/KurukshetraMoment.tsx` | Cinematic band featuring the wide `scene-2` battlefield artwork (moved out of the hero) with a scroll parallax and caption — "The Field of Kurukshetra". |
| `components/darshan/three/MadhavAvatarScene.tsx` | The hero's R3F scene — aniconic luminous presence built from canvas-generated radial-gradient sprites (no lit solids, no downloaded assets), aura shells, crown ring, light motes, and the commissioned-GLB slot. Lazily imported; only reached at `full` tier. |
| `components/darshan/VishwaroopDarshan.tsx` | The opt-in Cosmic Form — invitation card, consented full-screen reveal (portalled to `<body>`, since `[data-reveal]`'s transform would otherwise trap `position:fixed`), self-ending after `max_duration_ms`, Escape always returns. Static mandala under reduced motion. |
| `components/darshan/three/VishwaroopScene.tsx` | The Vishwaroop R3F scene — starfield, opening mandala rings, nested wireframe shells, core of light. Deliberately abstract: no faces, no horror, no strobing. |
| `components/darshan/CosmicJourney.tsx` | **The travelling sky.** One fixed layer behind every route: five cosmic scenes cross-faded across the scroll, three parallax star depths, drifting nebulae and rare shooting stars. One rAF-throttled listener writes `--sy`/`--sp`; everything else is pure CSS, so scrolling never causes a React render. Tier-scaled; collapses to a static gradient under reduced motion. |
| `components/darshan/CosmicForms.tsx` | **The form behind the form.** `DivineSilhouette` — a four-armed luminous silhouette (crown, raised + lowered arms, dhoti), faceless and heavily softened, rendered behind Madhav in the hero and at the centre of Vishwaroop. `TempleSkyline` — a shikhara/mandapa/deep-stambha city silhouetted along the hero's base. Both vector-drawn here; gradient ids are `useId`-scoped so two instances don't collide. |
| `components/darshan/Dashavatar.tsx` | The ten descents as luminous glyphs (Matsya → Kalki) with Sanskrit + Roman names and a one-line meaning each. Seed for `avatar_forms`; `reviewer_note` records that traditions differ on the ninth. |
| `components/darshan/DivineShadow.tsx` | The divine form swelling behind Madhav **while he speaks** — bound to the engine's answering/blessing states *and* to live voice amplitude from the `madhav:voice` bus. Sits behind chat text, so deliberately faint; removed entirely under reduced motion. |
| `components/darshan/SacredSymbols.tsx` | Vector motifs a mood can call for (still water, lamp flame, cosmic mandala, chakra glyph) + `MoodSymbol`. Drawn in code, never loaded from a URL — the licensing guarantee. |
| `components/darshan/MotionPreferenceToggle.tsx` | The seeker's own motion control (Automatic / Full / Calm / Text only), persisted and outranking the OS setting. In the footer. |
| `components/darshan/DarshanDebugPanel.tsx` | `?darshan=debug` QA panel — drive all 12 states by hand, inspect tier/energy/mood. Dev-only. |
| `components/journal/JournalApp.tsx` | Sankalpa Journal — Gita check-in (sankalpa/gratitude/dharma/release/lesson/next action/reflection) upserted onto the seeker's LOCAL calendar day, streaks, **Past Reflections** history, saved verses; "Ask Madhav about today" prefills the chat with today's check-in; auth from the app-wide `AuthProvider`; consumes the `askmadhav_pending_intention` handoff. |
| `components/journal/JournalMadhav.tsx` | Madhav as the Journal's in-page assistant — chat window on the /journal page; every question carries today's check-in as grounding context into the shared `/api/ask` pipeline; "Ask Madhav about today" auto-seeds it. |
| `components/auth/AuthProvider.tsx` | App-wide auth context (`useAuth()`) over the browser Supabase client — session, loading, signOut. Fail-open when Supabase is unconfigured. |
| `components/auth/AuthGate.tsx` | The doorway — full-screen email one-time-code sign-in every seeker passes before the app renders. Invisible without Supabase env vars. |

### `frontend/` — data, types, config
| File | Description |
|---|---|
| `data/verses.json` | **The dataset bundled into the app — all 701 clean verses** (Sanskrit + IAST transliteration + Hindi + English + keywords/themes/guidance). Generated by `build_verses.py`. |
| `data/verses.curated.json` | The 30 hand-curated rich verses — stable override source for `build_verses.py` (never overwritten by the build). |
| `data/quotes.json` | **Gita Quote Reflection seed** — 14 curated quotes across all 9 themes, with mood/theme metadata. Generated by `scripts/gen_quotes.js`; the seed for the `gita_quotes` CMS table. |
| `data/stories.json` | 5 Mahabharata stories — short description + full `narration` (TTS-sized), `moral`, `lesson`, and `gita_refs` verse anchors. |
| `types/index.ts` | Shared client types (`Verse`, `Story`, `VerseCard`, `AskResponse`, `ChatMessage`, …). |
| `supabase/schema.sql` | Postgres schema for journal/subscribers — run in the Supabase SQL editor. |
| `supabase/darshan-schema.sql` | **Darshan admin/CMS schema** — the 10 tables (sacred assets, licence records, forms, quotes, categories, moods, animation states, transition settings, review notes, motion prefs), RLS, constraints that block unreviewed/unlicensed content, and the seed. |
| `scripts/gen_quotes.js` | Builds `data/quotes.json` from `data/verses.json` — copies Sanskrit/transliteration/Hindi verbatim, adds curated plain-language English + theme/mood, normalises transliteration to IAST. |
| `vercel.json` | Vercel config: Next.js preset + daily-ritual cron registration. |
| `next.config.js` | Next.js config. |
| `tailwind.config.ts` | Tailwind theme/config. |
| `postcss.config.js` | PostCSS/Tailwind pipeline. |
| `tsconfig.json` | TS config; `@/*` alias → `frontend/` root. |
| `eslint.config.mjs` | ESLint flat config (ESLint 9 + eslint-config-next/core-web-vitals); run via `eslint .`. |
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
| `docs/TTS.md` | Read-aloud architecture + evaluated TTS provider options (Gemini/OpenAI/Google Cloud/ElevenLabs/XTTS-v2), the Hinglish nuance, and the env-gated fallback pattern. Secrets-free (env-var names only). |
| `WHATSAPP_SETUP.md` | WhatsApp Cloud API channel setup (env-var names + Meta dashboard steps; no real values). |
| `docs/DEFERRED_CHANGES.md` | Notes on a deferred "retrieval confidence" feature archived as a patch, not shipped. |
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
