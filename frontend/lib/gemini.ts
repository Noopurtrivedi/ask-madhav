/**
 * Madhav Dialogue — multi-turn, context-aware guidance grounded in retrieved
 * Gita verses (RAG). Uses Google Gemini's free tier. If GEMINI_API_KEY is not
 * configured, generateGuidance() returns null and the caller falls back to the
 * deterministic template engine, so the app always works.
 */
import type { RawVerse } from '@/lib/verseEngine'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

const MODEL = 'gemini-2.0-flash'
const ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`

const SYSTEM_INSTRUCTION = `You are "Madhav", a warm, wise companion who shares the wisdom of the Bhagavad Gita.

Your role and boundaries:
- You are NOT the divine Krishna and you never claim to be. You are a humble guide pointing to the Gita's teachings.
- You speak with compassion, calm, and brevity — like a trusted mentor, not a preacher.
- You ground EVERY reply in the specific verse(s) provided in the context below. Quote or paraphrase only those verses. Never invent verse numbers, Sanskrit, or teachings that are not in the provided context.
- When the person's message is vague or emotionally heavy, ask ONE gentle, reflective follow-up question to understand them before offering guidance.
- Reference the chapter and verse number (e.g. "In Chapter 2, verse 47...") when you draw on a teaching.
- End with one small, concrete, doable step for today.
- Keep replies to 3–5 short paragraphs maximum. No markdown headers. Plain, heartfelt prose.
- Never give medical, legal, or financial directives. For crises (self-harm, abuse), gently encourage reaching out to a qualified professional or helpline.`

function buildContext(verses: RawVerse[]): string {
  if (verses.length === 0) return 'No specific verse was retrieved. Speak only in general Gita principles.'
  return verses
    .map(
      (v) =>
        `[Chapter ${v.chapter_number}, Verse ${v.verse_number} (${v.reference})]\n` +
        `Sanskrit: ${v.sanskrit_text}\n` +
        `Meaning: ${v.english_meaning}\n` +
        `Themes: ${(v.themes || []).join(', ')}\n` +
        `Practical guidance: ${v.practical_guidance}`,
    )
    .join('\n\n')
}

/**
 * Returns Madhav's reply, or null if no API key is configured / the call fails
 * (so the caller can fall back to the template engine).
 */
export async function generateGuidance(
  question: string,
  verses: RawVerse[],
  history: ChatTurn[] = [],
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const context = buildContext(verses)

  // Map prior turns, then append the current question with retrieved context.
  const contents = [
    ...history.slice(-8).map((t) => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: t.content }],
    })),
    {
      role: 'user',
      parts: [
        {
          text:
            `Retrieved Gita verses to ground your reply:\n\n${context}\n\n` +
            `The person says: "${question}"\n\n` +
            `Respond as Madhav, grounded only in the verses above.`,
        },
      ],
    },
  ]

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)
    const res = await fetch(ENDPOINT(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
          topP: 0.95,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error('Gemini error', res.status, await res.text().catch(() => ''))
      return null
    }
    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('')
      .trim()
    return text || null
  } catch (err) {
    console.error('Gemini request failed', err)
    return null
  }
}

export function isAiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}
