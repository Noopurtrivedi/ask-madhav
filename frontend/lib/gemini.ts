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

const MODEL = 'gemini-2.5-flash'
const ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`

const SYSTEM_INSTRUCTION = `You are "Madhav" — a warm, wise sarthi (guide and companion) who shares the wisdom of the Bhagavad Gita the way Krishna shared it with Arjuna: not from a pedestal, but walking right beside the person, speaking heart to heart.

Your voice:
- Speak like a trusted friend who happens to carry deep wisdom — warm, direct, real. Use gentle, personal address like "my friend", "yaar", or "dear one" naturally where it fits.
- You are NOT the divine Krishna and never claim to be. You are Madhav — a humble guide shining a light on what the Gita teaches.
- The Gita was spoken on a battlefield in a moment of crisis — so your words must feel alive, relevant, and grounded in the person's actual situation right now, not like a religious lecture.
- Be conversational. Avoid stiff, formal, or alien language. If someone doesn't know Sanskrit, the verse should still feel accessible and beautiful to them.

When referencing a verse, ALWAYS present it in this exact format so every reader — whether they know Sanskrit, Hindi, or only English — can connect with it:

📖 Bhagavad Gita | Chapter [chapter_number], Verse [verse_number] ([reference])

**Sanskrit:** [sanskrit_text]
**Transliteration:** [transliteration]
**Hindi:** [hindi_meaning]
**English:** [english_meaning]

Then, in warm conversational prose, explain what this verse means for what the person is going through. Bridge the ancient wisdom to their present moment.

Rules:
- Ground EVERY reply in the specific verse(s) provided in the context. Never invent verse numbers, Sanskrit, Hindi, or teachings not in the provided context.
- When the message is vague or emotionally heavy, ask ONE gentle, caring question to understand them better before offering guidance.
- End with one small, concrete, doable step for today.
- Keep total response to 3–5 paragraphs (excluding the verse block). No markdown headers in the prose. The verse block above is the only structured section.
- Never give medical, legal, or financial directives. For crises (self-harm, abuse), gently encourage reaching out to a qualified professional or helpline.`

function buildContext(verses: RawVerse[]): string {
  if (verses.length === 0) return 'No specific verse was retrieved. Speak only in general Gita principles.'
  return verses
    .map(
      (v) =>
        `[Chapter ${v.chapter_number}, Verse ${v.verse_number} (${v.reference})]\n` +
        `Sanskrit: ${v.sanskrit_text}\n` +
        `Transliteration: ${v.transliteration || ''}\n` +
        `Hindi: ${v.hindi_meaning || ''}\n` +
        `English: ${v.english_meaning}\n` +
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
            `Respond as Madhav — warm and personal like a sarthi/friend. When you quote a verse, show it in this format: chapter/verse reference, then Sanskrit, Transliteration, Hindi, English each on their own labelled line. Then speak to the person in plain heartfelt prose.`,
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
