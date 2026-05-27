/**
 * WhatsApp channel webhook (Meta Cloud API).
 *
 * Lets a seeker chat with Madhav directly in WhatsApp — scan a QR / wa.me link
 * that opens a chat with the Business number, then text exactly as they would
 * in the web chat. Messages flow through the SAME guidance pipeline as
 * `/api/ask` (retrieval + Gemini), so Madhav's voice is identical everywhere.
 *
 *   GET  — Meta's one-time webhook verification handshake.
 *   POST — inbound messages: dedup → command/greeting handling → guidance →
 *          reply + a follow-up message carrying the grounding verse.
 *
 * Defensive like the rest of the app: a failing LLM falls back to the template,
 * an unconfigured channel is inert, and the handler always returns 200 so Meta
 * does not spam retries.
 */
import { NextRequest, NextResponse } from 'next/server'
import { answerQuestion } from '@/lib/guidance'
import { disclaimer, scoreVerses, verseCard } from '@/lib/verseEngine'
import { checkRateLimit } from '@/lib/ratelimit'
import {
  isWhatsAppConfigured,
  sendWhatsAppText,
  verifySignature,
} from '@/lib/whatsapp/client'
import { getSession, saveSession, markMessageSeen } from '@/lib/whatsapp/memory'
import type { AnswerLanguage } from '@/types'

export const runtime = 'nodejs'

const MAX_QUESTION = 1000

const WELCOME = `🙏 Namaste, Parth. I am Madhav — here to walk beside you, as I once did with Arjuna.

Share whatever weighs on your heart — a worry, a choice, a feeling — and I will reflect with you through the timeless wisdom of the Gita.

You can reply in *English*, *Hindi*, or *Hinglish* — just type that word anytime to switch.`

// Detect a language-switch command. Returns the new language or null.
function parseLanguageCommand(text: string): AnswerLanguage | null {
  const t = text.trim().toLowerCase().replace(/^\/(lang(uage)?)\s+/, '')
  if (t === 'english' || t === 'eng') return 'english'
  if (t === 'hindi' || t === 'हिंदी' || t === 'हिन्दी') return 'hindi'
  if (t === 'hinglish') return 'hinglish'
  return null
}

const GREETINGS = new Set([
  'hi', 'hii', 'hey', 'hello', 'start', '/start', 'namaste', 'namaskar',
  'hare krishna', 'radhe radhe', 'jai shree krishna', 'om',
])

function isGreeting(text: string): boolean {
  return GREETINGS.has(text.trim().toLowerCase())
}

// If the seeker hasn't picked a language and writes in Devanagari, answer in
// Hindi; otherwise keep their stored preference.
function inferLanguage(text: string, stored: AnswerLanguage): AnswerLanguage {
  if (/[ऀ-ॿ]/.test(text)) return 'hindi'
  return stored
}

// Format the grounding verse as a second WhatsApp message (the channel has no
// VerseCard UI, so we send the verse itself in the seeker's language).
function buildVerseMessage(question: string, language: AnswerLanguage): string | null {
  const matched = scoreVerses(question)
  if (matched.length === 0) return null
  const v = verseCard(matched[0])
  const meaning =
    language === 'english'
      ? v.english_meaning
      : v.hindi_meaning || v.english_meaning
  const lines = [
    `📖 *Bhagavad Gita ${v.reference}*`,
    '',
    v.sanskrit,
  ]
  if (v.transliteration) lines.push('', `_${v.transliteration}_`)
  if (meaning) lines.push('', meaning)
  return lines.join('\n')
}

// ── GET: webhook verification handshake ──────────────────────────────────────
export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// ── POST: inbound messages ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Read the raw body once so we can verify the signature, then parse it.
  const rawBody = await req.text()

  if (!verifySignature(rawBody, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // Always 200 from here on so Meta doesn't retry; do the work in try/catch.
  try {
    if (!isWhatsAppConfigured()) {
      console.error('whatsapp webhook hit but channel not configured')
      return NextResponse.json({ ok: true })
    }

    const payload = JSON.parse(rawBody)
    const value = payload?.entry?.[0]?.changes?.[0]?.value
    const message = value?.messages?.[0]

    // Status callbacks (delivered/read) and non-text messages have no usable
    // text — acknowledge and move on.
    if (!message || message.type !== 'text') {
      return NextResponse.json({ ok: true })
    }

    const from: string = message.from // E.164, no '+'
    const messageId: string = message.id
    const text: string = (message.text?.body || '').toString()

    // Idempotency: ignore re-delivered webhooks for a message we already handled.
    if (!(await markMessageSeen(messageId))) {
      return NextResponse.json({ ok: true })
    }

    // Throttle per phone number to bound LLM cost / abuse (shares the limiter).
    if (!(await checkRateLimit(`wa:${from}`))) {
      await sendWhatsAppText(
        from,
        'Take a breath, Parth. Ask me again in a moment. 🙏',
      )
      return NextResponse.json({ ok: true })
    }

    const session = await getSession(from)
    const isFirstContact = session.turns.length === 0

    // Language-switch command.
    const langCmd = parseLanguageCommand(text)
    if (langCmd) {
      session.language = langCmd
      await saveSession(from, session)
      const confirm =
        langCmd === 'hindi'
          ? 'ठीक है, Parth. अब मैं हिंदी में उत्तर दूँगा। 🙏'
          : langCmd === 'hinglish'
            ? 'Theek hai Parth, ab main Hinglish mein baat karunga. 🙏'
            : 'Of course, Parth. I will reply in English now. 🙏'
      await sendWhatsAppText(from, confirm)
      return NextResponse.json({ ok: true })
    }

    // Greeting or empty-ish first message → welcome only.
    if (isGreeting(text) || (isFirstContact && text.trim().length < 3)) {
      await sendWhatsAppText(from, WELCOME)
      return NextResponse.json({ ok: true })
    }

    const question = text.slice(0, MAX_QUESTION).trim()
    if (question.length < 3) {
      await sendWhatsAppText(
        from,
        'Share a little more, Parth, and I will reflect with you. 🙏',
      )
      return NextResponse.json({ ok: true })
    }

    const language = inferLanguage(question, session.language)

    // Same pipeline as the web chat.
    const result = await answerQuestion(question, session.turns, { language })

    // Persist the exchange for context on the next message.
    session.language = language
    session.turns.push({ role: 'user', content: question })
    session.turns.push({ role: 'assistant', content: result.answer })
    await saveSession(from, session)

    // Madhav's reply, then the grounding verse as a follow-up.
    await sendWhatsAppText(from, result.answer)
    const verseMsg = buildVerseMessage(question, language)
    if (verseMsg) await sendWhatsAppText(from, verseMsg)

    // Gentle one-time disclaimer on first contact (mirrors the web footer).
    if (isFirstContact) {
      await sendWhatsAppText(from, `_${disclaimer()}_`)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('whatsapp webhook error', err)
    return NextResponse.json({ ok: true })
  }
}
