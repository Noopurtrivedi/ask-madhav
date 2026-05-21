import { NextRequest, NextResponse } from 'next/server'
import { scoreVerses, buildTemplateAnswer, disclaimer } from '@/lib/verseEngine'
import { generateGuidance, type ChatTurn } from '@/lib/gemini'
import { checkRateLimit } from '@/lib/ratelimit'
import type { AgeGroup, AnswerLanguage, UserProfile } from '@/types'

export const runtime = 'nodejs'

// Bound input size so a single request can't blow up LLM token cost / memory.
const MAX_QUESTION = 1000
const MAX_HISTORY_TURNS = 12
const MAX_TURN_CHARS = 2000

const AGE_GROUPS: AgeGroup[] = ['under-18', '18-25', '26-40', '41-60', '60-plus']
const LANGUAGES: AnswerLanguage[] = ['english', 'hindi', 'hinglish']

// Validate the two fields independently: language drives the answer language,
// age (optional) tunes the analogies. A bad/absent field is simply dropped —
// never an error. Returns undefined only when nothing usable was provided.
function parseProfile(raw: unknown): UserProfile | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const p = raw as Record<string, unknown>
  const language = LANGUAGES.includes(p.language as AnswerLanguage)
    ? (p.language as AnswerLanguage)
    : undefined
  const ageGroup = AGE_GROUPS.includes(p.ageGroup as AgeGroup)
    ? (p.ageGroup as AgeGroup)
    : undefined
  if (!language && !ageGroup) return undefined
  // language is required on UserProfile; default to english when only age was given.
  return { language: language ?? 'english', ageGroup }
}

export async function POST(req: NextRequest) {
  try {
    let body: { question?: unknown; history?: unknown; profile?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 })
    }

    let question = typeof body.question === 'string' ? body.question.trim() : ''
    if (question.length < 3) {
      return NextResponse.json({ detail: 'Please ask a meaningful question.' }, { status: 400 })
    }

    // Throttle per client IP before doing any expensive (LLM) work.
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json(
        { detail: 'You are asking very quickly. Please pause a moment, then try again.' },
        { status: 429 },
      )
    }
    if (question.length > MAX_QUESTION) question = question.slice(0, MAX_QUESTION)

    // Sanitize conversation history defensively (shape, role, and size).
    const history: ChatTurn[] = (Array.isArray(body.history) ? body.history : [])
      .filter(
        (t): t is ChatTurn =>
          !!t &&
          typeof t === 'object' &&
          (t as ChatTurn).role !== undefined &&
          ((t as ChatTurn).role === 'user' || (t as ChatTurn).role === 'assistant') &&
          typeof (t as ChatTurn).content === 'string',
      )
      .slice(-MAX_HISTORY_TURNS)
      .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_TURN_CHARS) }))

    const profile = parseProfile(body.profile)

    // Verse retrieval is in-memory and always succeeds (returns a daily verse
    // as a last resort), so the template answer is a guaranteed fallback.
    const matched = scoreVerses(question)
    const base = buildTemplateAnswer(question, matched)

    // RAG layer: try the LLM, but never let its failure break the response.
    let answer = base.answer
    let usedAi = false
    try {
      const ai = await generateGuidance(question, matched, history, profile)
      if (ai) {
        answer = ai
        usedAi = true
      }
    } catch (err) {
      console.error('generateGuidance failed', err)
    }

    return NextResponse.json({ ...base, answer, source: usedAi ? 'ai' : 'template' })
  } catch (err) {
    // Last-resort fallback — the chat should never hard-fail.
    console.error('ask route error', err)
    return NextResponse.json({
      question: '',
      answer: 'Madhav is resting for a moment. Please ask again shortly.',
      verses: [],
      disclaimer: disclaimer(),
      source: 'template',
    })
  }
}
