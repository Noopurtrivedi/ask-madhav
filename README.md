# Ask Madhav — Bhagavad Gita Guidance App

A spiritual guidance application that answers real-life questions using wisdom from the Bhagavad Gita. Every response is grounded in real Sanskrit verses with transliteration, Hindi and English meanings, and practical daily-life action steps.

> **Architecture note (May 2026):** the app now runs entirely on **Next.js** and deploys to **Vercel's free tier** with **no separate backend required**. The original Python keyword engine has been ported to TypeScript and runs inside Next.js API routes. The `backend/` directory is kept for reference but is no longer needed to run or deploy the app.

---

## ✨ Features

| Feature | What it does |
|---|---|
| **Ask Madhav (RAG chat)** | Multi-turn, context-aware guidance. Verses are retrieved by the keyword engine, then an LLM (Google Gemini, free tier) composes a grounded, compassionate reply. Falls back to a deterministic template when no API key is set. |
| **Daily Verse** | A rotating verse of the day with Sanskrit, transliteration, meanings, and a practical step. |
| **Sacred Audio** | Recites the verse transliteration aloud (browser Speech Synthesis) with live word highlighting, plus a meditation loop mode. |
| **Wisdom Cards + Daily Ritual** | One-tap shareable verse-card images (generated with `next/og`) and an opt-in daily verse email (Resend + a Vercel Cron job). |
| **Sankalpa Journal** | Sign in with a magic link to save verses, set a daily intention, build a reflection streak, and see your recurring themes (Supabase auth + Postgres). |
| **Stories** | Five Mahabharata narratives that frame the Gita's teaching. |

Each external integration is **optional** and **gated by env vars** — with none configured, the app still runs fully on the keyword engine.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  Next.js 14 app on Vercel                      │
│         TypeScript · Tailwind · App Router · API routes        │
│                                                                │
│  UI: Hero · DailyVerse · ChatInterface · StoryCards            │
│      SubscribeRitual · /verse/[ref] · /journal                 │
│                                                                │
│  API routes (lib/verseEngine.ts — keyword retrieval):          │
│    POST /api/ask          → retrieve verses → (Gemini RAG)     │
│    GET  /api/daily-verse  → verse of the day                   │
│    GET  /api/stories      → Mahabharata stories                │
│    GET  /api/og           → shareable Wisdom Card (PNG)         │
│    POST /api/subscribe    → Daily Ritual sign-up               │
│    GET  /api/cron/daily-ritual → send daily email (Cron)       │
└───────────┬──────────────────────┬──────────────────┬─────────┘
            │ (optional)            │ (optional)       │ (optional)
        Gemini API             Supabase             Resend
       (free tier)        (auth + Postgres)      (email free tier)
```

Data lives in `frontend/data/verses.json` (30 verses) and `frontend/data/stories.json` (5 stories), bundled into the build.

---

## Quick Start

```bash
cd frontend
npm install
cp .env.example .env.local   # optional — see below; app works with none set
npm run dev                  # http://localhost:3000
```

That's it. No Python, no database, no API keys required to run the core app.

```bash
npm run build   # production build
npm run lint    # ESLint
```

---

## Environment Variables (all optional)

Set these in `frontend/.env.local` (local) or the Vercel dashboard (production). See `frontend/.env.example`.

| Variable | Enables | Where to get it (free) |
|---|---|---|
| `GEMINI_API_KEY` | AI chat (RAG). Without it, chat uses the template engine. | https://aistudio.google.com/apikey |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sankalpa Journal (auth, saved verses, streaks). | https://supabase.com |
| `SUPABASE_SERVICE_ROLE_KEY` | Daily Ritual subscriber writes + cron (server-only). | Supabase dashboard → API |
| `RESEND_API_KEY`, `DAILY_RITUAL_FROM_EMAIL` | Daily Ritual email delivery. | https://resend.com |
| `CRON_SECRET` | Protects the daily-ritual cron endpoint. | any random string |
| `NEXT_PUBLIC_SITE_URL` | Absolute share/OG URLs. | your deployed URL |

---

## Deploy for free (Vercel)

1. Push this repo to GitHub.
2. Import it on [Vercel](https://vercel.com). Set **Root Directory = `frontend/`**. Vercel auto-detects Next.js.
3. (Optional) Add any env vars above to enable AI / journal / email.
4. Deploy. The included `vercel.json` also registers a daily Cron at 13:00 UTC for the Daily Ritual email.

**Enabling the optional services (all free tiers):**

- **AI chat:** create a Gemini key and add `GEMINI_API_KEY`.
- **Journal:** create a Supabase project, run `frontend/supabase/schema.sql` in the SQL editor, then add the three Supabase env vars.
- **Daily email:** create a Resend key, verify a sender, add `RESEND_API_KEY` + `DAILY_RITUAL_FROM_EMAIL` + `CRON_SECRET`.

---

## Adding more verses

Edit `frontend/data/verses.json` and append objects following the existing schema (`keywords` drive search — use 5–8 emotionally resonant words; `themes` add secondary matching). Rebuild to pick up changes.

---

## Safety & Disclaimer

This application provides spiritual guidance **inspired by** the Bhagavad Gita. It is **not** a substitute for medical, legal, or financial advice, does **not** claim to speak as the divine Krishna, and does **not** represent any religious authority. Verses are from the public-domain Bhagavad Gita.

If you are in crisis, please contact a mental-health professional or a crisis helpline.

---

## License

MIT License — use freely with attribution. Built with reverence for the eternal wisdom of the Bhagavad Gita.
