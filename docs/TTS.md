# Text-to-Speech (read-aloud) — architecture & provider options

How Madhav's voice works today, and the evaluated options for changing it.
**This document contains no secrets — only environment-variable names.** All
TTS keys are server-side, env-gated, and configured in Vercel (never committed,
never `NEXT_PUBLIC_*`).

## Current architecture

The read-aloud feature is a single Next.js route handler, `app/api/tts/route.ts`
(`runtime = 'nodejs'`):

1. Reads `{ text }` from the request (bounded to 1800 chars).
2. Calls **Google Gemini TTS** (`gemini-2.5-flash-preview-tts`, voice **"Charon"** —
   a calm male voice) via REST, using `GEMINI_API_KEY`.
3. Wraps the returned PCM as a WAV and streams it back (`audio/wav`, `no-store`).
4. **Fail-open:** if `GEMINI_API_KEY` is unset or the call fails/times out (25s),
   the route returns `503` and the client (`components/SpeakButton.tsx`) falls
   back to the browser's built-in `SpeechSynthesis` voice.

This mirrors the chat pipeline's fallback discipline (see [`CLAUDE.md`](../CLAUDE.md)):
a good path that degrades gracefully rather than hard-failing.

### Why TTS stayed on Gemini (not Vertex)

When chat moved to Vertex AI (`lib/vertex.ts`), TTS deliberately stayed on the
Gemini API key: the `gemini-2.5-flash-preview-tts` model has limited/region-specific
availability on Vertex. Keeping TTS on the Gemini key is the low-risk choice.

## The Hinglish nuance (drives provider choice)

Madhav answers in English, Devanagari Hindi, **or Romanized Hinglish**
("kya haal hai"). Traditional neural TTS expects proper script and mispronounces
Romanized Hindi with English phonetics. **LLM-based TTS (Gemini, OpenAI) handles
code-mixed/Hinglish text far better** — this is why Gemini works well here, and a
key factor when choosing an alternative.

## Provider options evaluated

| Provider | Multilingual / Hindi | Hinglish | Integration effort | Cost / License |
|---|---|---|---|---|
| **Gemini TTS** (current) | ✅ | ✅ (LLM-based) | Already integrated | Free tier |
| **OpenAI `gpt-4o-mini-tts`** | ✅ incl. Hindi | ✅ (LLM-based) | ⭐ Easiest — one key, one POST, returns mp3 directly (no WAV wrapping) | Cheap, pay-as-you-go |
| **Google Cloud TTS** (≠ Gemini) | ✅ excellent `hi-IN` neural male voices | ⚠️ weak (wants Devanagari) | Easy REST; can reuse the GCP service account used for Vertex | Generous free tier (~1M chars/mo) |
| **ElevenLabs** | ✅ incl. Hindi; voice cloning | ✅ | Easy REST | Paid (small free tier) |
| **XTTS-v2** (Coqui, open source) | ✅ incl. Hindi; voice cloning | ✅ | ❌ Hard — ~1.8GB GPU model, **cannot run on Vercel serverless**; needs a separate GPU host (Replicate/fal/Modal/Runpod) | ⚠️ **License: Coqui Public Model License is non-commercial** — verify before any public/commercial use |

## Recommended integration pattern (if/when we add a provider)

Keep it env-gated and fail-open, extending the existing chain. The route picks the
first configured provider, then degrades:

```
<chosen provider, if its key is set>  →  Gemini TTS (GEMINI_API_KEY)  →  browser SpeechSynthesis
```

- **Easiest drop-in:** OpenAI `gpt-4o-mini-tts` — would add an optional
  `OPENAI_API_KEY`; absent → behaviour is unchanged (Gemini → browser).
- **Stay in Google's ecosystem:** Google Cloud TTS — reuses the Vertex service
  account; best for English + Devanagari Hindi, weaker on Hinglish.
- **Status quo is valid:** Gemini TTS already covers all three languages for free.

## Security notes

- Every TTS provider key is **server-side only** (read in the `nodejs` route via
  `process.env`), never prefixed `NEXT_PUBLIC_`, never sent to the browser.
- Keys live only in the Vercel dashboard — never in the repo (`.env*` is
  gitignored; `.env.example` lists names only).
- The route bounds input length and never echoes the key; audio is returned with
  `Cache-Control: no-store`.
