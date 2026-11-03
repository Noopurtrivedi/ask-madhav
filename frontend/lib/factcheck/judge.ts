/**
 * Independent review by Gemini on Vertex. Claude writes the post; a different
 * model scores it, so the writer never grades its own work.
 *
 * Two calls: a grounded one that reads current Google Search results about the
 * post's topic and date, then a scoring call that returns strict JSON. The
 * scores feed the gate in route.ts; the model never decides alone.
 */
import { findVerse } from '@/lib/verseEngine'
import { vertexGenerateContent } from '@/lib/vertex'
import type { PostDraft } from './rules'

export const FACTCHECK_MODEL = process.env.FACTCHECK_MODEL || 'gemini-3.5-flash-lite'

export interface HistoryItem {
  date: string
  kind: string
  hook: string
  likes: number
  comments: number
  saves?: number
  shares?: number
}

export interface Scores {
  credibility: { score: number; translation: number; attribution: number; claims: number; guardrails: number; cultural: number; notes: string }
  trend: { score: number; hook: number; emotion: number; timeliness: number; shareability: number; format: number; cta: number; history: number; notes: string }
  fixes: string[]
}

// The app's own guardrails (CLAUDE.md "Safety constraint" and the persona in lib/gemini.ts).
const APP_GUARDRAILS = `- Guidance is inspired by the Gita; not medical, legal or financial advice.
- Never foster dependency, demand worship, encourage blind belief or create fear.
- Awaken people to their own consciousness; crisis topics point to qualified help.
- Calm, warm, never preachy or shallow-motivational; never overload with Sanskrit.
- Quotes attributed to Krishna must be real Gita verses, never invented lines.
- Panchang posts never claim science proves a ritual, never say the moon pulls body water, no detox claims; give the tradition's own reason and state evidence gaps.`

type Part = { text?: string }
type Candidate = { content?: { parts?: Part[] } }

function textOf(res: unknown): string {
  const c = (res as { candidates?: Candidate[] } | null)?.candidates?.[0]
  return (c?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim()
}

async function trendContext(post: PostDraft, today: string): Promise<string> {
  const topic = post.verses.map((v) => `Bhagavad Gita ${v.ref}`).join(', ')
  const res = await vertexGenerateContent(
    FACTCHECK_MODEL,
    {
      contents: [{ role: 'user', parts: [{ text: `Today is ${today}. In under 150 words, list what is currently trending or seasonal for Indian and diaspora Instagram audiences that relates to: ${topic}, Krishna, Hindu festivals or panchang dates in the next two weeks, and spiritual self-help. Facts only, no advice.` }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0 },
    },
    25_000,
  )
  return textOf(res) || 'No trend context available.'
}

const SCHEMA = {
  type: 'OBJECT',
  required: ['credibility', 'trend', 'fixes'],
  properties: {
    credibility: {
      type: 'OBJECT',
      required: ['translation', 'attribution', 'claims', 'guardrails', 'cultural', 'notes'],
      properties: {
        translation: { type: 'INTEGER', description: '0-30: Hindi and English faithful to the verse and the reference translations' },
        attribution: { type: 'INTEGER', description: '0-20: every Krishna or Gita quote is a real verse, correctly numbered' },
        claims: { type: 'INTEGER', description: '0-20: every factual claim and date is accurate and sourced; no overreach' },
        guardrails: { type: 'INTEGER', description: '0-20: within the app guardrails' },
        cultural: { type: 'INTEGER', description: '0-10: respectful and accurate about tradition, names and iconography' },
        notes: { type: 'STRING' },
      },
    },
    trend: {
      type: 'OBJECT',
      required: ['hook', 'emotion', 'timeliness', 'shareability', 'format', 'cta', 'history', 'notes'],
      properties: {
        hook: { type: 'INTEGER', description: '0-25: first line or frame stops the scroll' },
        emotion: { type: 'INTEGER', description: '0-20: speaks to a real, common feeling or struggle' },
        timeliness: { type: 'INTEGER', description: '0-15: fits the current season, festival or trend context' },
        shareability: { type: 'INTEGER', description: '0-15: people would save it or send it to someone' },
        format: { type: 'INTEGER', description: '0-10: right length and format for its kind' },
        cta: { type: 'INTEGER', description: '0-5: one clear, honest call to comment or share' },
        history: { type: 'INTEGER', description: '0-10: resembles what performed best on this account' },
        notes: { type: 'STRING' },
      },
    },
    fixes: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Concrete edits that would raise the lowest sub-scores' },
  },
}

const clamp = (n: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)))

export async function judge(post: PostDraft, history: HistoryItem[], today: string): Promise<Scores | null> {
  const reference = post.verses
    .map((v) => {
      const k = findVerse(v.ref)
      return k ? `Gita ${v.ref}\nSanskrit: ${k.sanskrit_text}\nApp Hindi: ${k.hindi_meaning}\nApp English: ${k.english_meaning}` : `Gita ${v.ref}: not in app data`
    })
    .join('\n\n')
  const trends = await trendContext(post, today)

  const prompt = `You are an independent fact checker and social media analyst for Ask Madhav, a Bhagavad Gita guidance app. Score this Instagram ${post.kind} strictly. Use the full range: 90 or above overall means genuinely excellent, not merely acceptable.

POST CAPTION:
${post.caption || '(stories have no caption)'}

WORDS ON THE VISUALS:
${post.onImageText.join('\n')}

VERSES AS THE POST PRESENTS THEM:
${post.verses.map((v) => `Gita ${v.ref}\nSanskrit: ${v.sanskrit}\nHindi: ${v.hindi}\nEnglish: ${v.english}`).join('\n\n')}

REFERENCE FROM THE APP'S CODEBASE (data/verses.json):
${reference}

APP GUARDRAILS:
${APP_GUARDRAILS}

DATES CLAIMED (already checked against Drik Panchang by code):
${(post.dates ?? []).map((d) => `${d.event}: ${d.date}`).join('\n') || 'none'}

CURRENT TREND CONTEXT (${today}):
${trends}

THIS ACCOUNT'S RECENT POSTS AND RESULTS:
${history.map((h) => `${h.date} ${h.kind}: "${h.hook}" likes ${h.likes}, comments ${h.comments}${h.saves != null ? `, saves ${h.saves}` : ''}${h.shares != null ? `, shares ${h.shares}` : ''}`).join('\n') || 'no history yet'}

Judge translation fidelity against the reference meaning, not word for word. Penalise any invented quote, wrong verse number, unsupported health claim, fear, or preachiness. Return only the JSON.`

  const res = await vertexGenerateContent(
    FACTCHECK_MODEL,
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: SCHEMA },
    },
    25_000,
  )
  const raw = textOf(res)
  if (!raw) return null
  let parsed: Record<string, Record<string, unknown>> & { fixes?: unknown }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  const c = parsed.credibility ?? {}
  const t = parsed.trend ?? {}
  const credibility = {
    translation: clamp(c.translation, 30),
    attribution: clamp(c.attribution, 20),
    claims: clamp(c.claims, 20),
    guardrails: clamp(c.guardrails, 20),
    cultural: clamp(c.cultural, 10),
    notes: String(c.notes ?? ''),
  }
  const trend = {
    hook: clamp(t.hook, 25),
    emotion: clamp(t.emotion, 20),
    timeliness: clamp(t.timeliness, 15),
    shareability: clamp(t.shareability, 15),
    format: clamp(t.format, 10),
    cta: clamp(t.cta, 5),
    history: clamp(t.history, 10),
    notes: String(t.notes ?? ''),
  }
  // Totals are summed in code, so the model can't inflate the headline number.
  return {
    credibility: { ...credibility, score: credibility.translation + credibility.attribution + credibility.claims + credibility.guardrails + credibility.cultural },
    trend: { ...trend, score: trend.hook + trend.emotion + trend.timeliness + trend.shareability + trend.format + trend.cta + trend.history },
    fixes: Array.isArray(parsed.fixes) ? parsed.fixes.map(String).slice(0, 8) : [],
  }
}
