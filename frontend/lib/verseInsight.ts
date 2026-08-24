/**
 * Verse Insight — the "Go deeper" engine behind Daily Wisdom and verse pages.
 *
 * Turns one verse into a structured deep-dive a seeker can expand:
 *   essence    — what the shloka actually teaches, in plain words
 *   context    — where this moment sits in the Krishna–Arjuna dialogue
 *   analogy    — ONE modern mirror for the teaching
 *   practice   — one small, doable act for today
 *   reflection — one inward question to sit with
 *
 * Same fallback discipline as the chat pipeline (CLAUDE.md): the deterministic
 * template built from the verse's own data ALWAYS exists, and the LLM overlay
 * (Vertex → Gemini key) merely upgrades it. This function never throws and
 * never returns null for a real verse. AI results are cached in-memory per
 * server instance (verse insights are stable), and the API route adds CDN
 * caching on top.
 */

import { findVerse, type RawVerse } from '@/lib/verseEngine'
import { isVertexConfigured, vertexGenerateContent } from '@/lib/vertex'

export interface VerseInsight {
  reference: string
  source: 'ai' | 'template'
  essence: string
  context: string
  analogy: string
  practice: string
  reflection: string
}

const MODEL = 'gemini-2.5-flash'
const TIMEOUT_MS = 15000

/** AI-generated insights only — a temporarily failing model must not pin the
 *  template into the cache for the life of the instance. */
const cache = new Map<string, VerseInsight>()

// ── Deterministic fallback ──────────────────────────────────────────────────

function templateInsight(v: RawVerse): VerseInsight {
  const theme = (v.themes && v.themes[0]) || 'steady wisdom'
  return {
    reference: v.reference,
    source: 'template',
    essence: v.english_meaning,
    context:
      `Krishna offers this to Arjuna in Chapter ${v.chapter_number} — a moment in their battlefield ` +
      `dialogue where the teaching turns to ${theme}.`,
    analogy:
      `Hold today's version of Arjuna's dilemma — a duty you face, a result you cannot control — ` +
      `and read the verse against it: the counsel is the same.`,
    practice: v.practical_guidance || 'Choose one moment today to act sincerely and release your grip on the result.',
    reflection: 'What is mine to do, what is not mine to control, and what would a steadier self choose?',
  }
}

// ── LLM overlay ─────────────────────────────────────────────────────────────

function buildRequest(v: RawVerse): unknown {
  const prompt =
    `You are writing a short study companion for one Bhagavad Gita verse, for a modern seeker. ` +
    `Ground EVERYTHING in the verse provided — never invent Sanskrit, verse numbers, or teachings beyond it. ` +
    `Warm, clear, plain language; no preaching, no markdown.\n\n` +
    `Verse ${v.reference} (Chapter ${v.chapter_number}, Verse ${v.verse_number})\n` +
    `Sanskrit: ${v.sanskrit_text}\n` +
    `English meaning: ${v.english_meaning}\n` +
    `Hindi meaning: ${v.hindi_meaning}\n` +
    `Themes: ${(v.themes || []).join(', ')}\n` +
    `Practical guidance: ${v.practical_guidance}\n\n` +
    `Return ONLY a JSON object with exactly these string fields:\n` +
    `"essence"    — 2–3 sentences: what this shloka actually teaches, in plain modern words.\n` +
    `"context"    — 2 sentences: where this moment sits in Krishna and Arjuna's dialogue and why it was spoken.\n` +
    `"analogy"    — 2–3 sentences: ONE vivid analogy from modern daily life (work, family, phones, study) that carries the teaching.\n` +
    `"practice"   — 1–2 sentences: one small, concrete act the reader can do today.\n` +
    `"reflection" — exactly one gentle question for the reader to sit with.`

  return {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 900,
      // Reasoning off — a study card needs no thinking budget, and thinking
      // tokens would eat the output allowance (same trap as lib/gemini.ts).
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
    },
  }
}

function extractText(data: unknown): string | null {
  const text = (
    data as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  )?.candidates?.[0]?.content?.parts?.[0]?.text
  return typeof text === 'string' && text.trim() ? text : null
}

async function geminiApiCall(body: unknown): Promise<unknown | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(body),
      },
    )
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.json()
  } catch {
    clearTimeout(timeout)
    return null
  }
}

function parseInsight(reference: string, raw: string): VerseInsight | null {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    const fields = ['essence', 'context', 'analogy', 'practice', 'reflection'] as const
    const out: Record<string, string> = {}
    for (const f of fields) {
      const val = obj[f]
      if (typeof val !== 'string' || !val.trim()) return null
      out[f] = val.trim()
    }
    return {
      reference,
      source: 'ai',
      essence: out.essence,
      context: out.context,
      analogy: out.analogy,
      practice: out.practice,
      reflection: out.reflection,
    }
  } catch {
    return null
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Deep-dive for a verse reference ("2.47"). Null only when the verse itself
 *  doesn't exist; otherwise always an insight (AI when possible, template else). */
export async function getVerseInsight(reference: string): Promise<VerseInsight | null> {
  const verse = findVerse(reference)
  if (!verse) return null

  const hit = cache.get(verse.reference)
  if (hit) return hit

  try {
    const body = buildRequest(verse)
    let data: unknown | null = null
    if (isVertexConfigured()) data = await vertexGenerateContent(MODEL, body, TIMEOUT_MS)
    if (!data) data = await geminiApiCall(body)
    const text = data ? extractText(data) : null
    const parsed = text ? parseInsight(verse.reference, text) : null
    if (parsed) {
      cache.set(verse.reference, parsed)
      return parsed
    }
  } catch (err) {
    console.error('verse insight generation failed', err)
  }
  return templateInsight(verse)
}
