'use client'

/**
 * JournalMadhav — Madhav as the Journal's own assistant.
 *
 * A chat window that lives inside the Sankalpa Journal: the seeker asks
 * questions right where they write, and every question quietly carries their
 * TODAY's check-in (mood, sankalpa, dharma, releases…) so Madhav's reply is
 * grounded in their actual day — not a cold start. Runs on the same
 * /api/ask RAG pipeline as the main chat (retrieval → template → LLM), so the
 * two Madhavs never drift; the journal context rides inside the question,
 * which also sharpens verse retrieval (an "anxious" day surfaces the verses
 * on anxiety).
 *
 * The parent passes `seed` — a composed "about today" question that auto-sends
 * once (the "Ask Madhav about today" button) — and `journalContext`, rebuilt
 * from the live form on every send.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { askQuestion } from '@/lib/api'
import type { ChatTurn } from '@/lib/api'

interface Msg {
  role: 'user' | 'assistant'
  content: string
  verseRef?: string
}

interface Props {
  /** Question to auto-send when set (each new value sends once). */
  seed: string | null
  /** Compact one-line summary of today's check-in ('' when empty). */
  journalContext: string
}

const GREETING =
  'I am here, Parth — beside your journal, not above it. Ask me anything about your day, your sankalpa, or what you are carrying. I will answer from the Gita.'

export default function JournalMadhav({ seed, journalContext }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const lastSeed = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const contextRef = useRef(journalContext)
  contextRef.current = journalContext

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, busy])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || busy) return
    setBusy(true)
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')

    // History = the visible conversation so far (server caps at 12 turns).
    const history: ChatTurn[] = messages.map((m) => ({ role: m.role, content: m.content }))

    // Today's check-in rides with the question — grounding + retrieval signal.
    // /api/ask bounds questions to 1000 chars, so budget the context.
    const ctx = contextRef.current
    const room = 980 - question.length
    const composed =
      ctx && room > 60 ? `${question}\n\n(From my journal today: ${ctx.slice(0, room - 30)})` : question

    try {
      const res = await askQuestion(composed, history)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer, verseRef: res.verses?.[0]?.reference },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'The connection dimmed for a moment, Parth. Ask me once more.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  // The "Ask Madhav about today" button seeds one auto-sent question.
  useEffect(() => {
    if (seed && seed !== lastSeed.current) {
      lastSeed.current = seed
      send(seed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  return (
    <section
      id="journal-madhav"
      className="border border-gold/22 rounded-2xl mb-8 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.045)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gold/14 px-6 py-4">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-saffron/10 text-lg select-none"
          aria-hidden="true"
        >
          🪷
        </span>
        <div>
          <p className="text-moonlight font-semibold leading-tight" style={{ fontFamily: 'Crimson Text, serif' }}>
            Madhav
          </p>
          <p className="text-moonlight/45 text-xs">Your journal companion — grounded in today&apos;s check-in</p>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-96 space-y-4 overflow-y-auto px-6 py-5">
        <Bubble role="assistant">{GREETING}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.content}
            {m.role === 'assistant' && m.verseRef && (
              <span className="mt-2 block">
                <Link
                  href={`/verse/${m.verseRef}`}
                  className="inline-block rounded-full border border-gold/30 px-2 py-0.5 text-[11px] text-gold-soft hover:border-gold hover:bg-gold-soft/[0.08] transition-colors"
                >
                  Grounded in BG {m.verseRef}
                </Link>
              </span>
            )}
          </Bubble>
        ))}
        {busy && (
          <p className="text-gold-soft/60 text-sm italic lotus-pulse">Madhav is reflecting…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex gap-3 border-t border-gold/14 px-6 py-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Madhav about your day…"
          className="flex-1 bg-saffron/5 border border-gold/22 rounded-xl px-4 py-2.5 text-moonlight text-sm
                     placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="px-5 py-2.5 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      <p className="border-t border-gold/10 px-6 py-2.5 text-moonlight/32 text-[11px]">
        Reflections from the Bhagavad Gita only — not professional, medical, legal, or financial advice.
      </p>
    </section>
  )
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-saffron/15 border border-saffron/25 text-moonlight'
            : 'bg-white/[0.05] border border-gold/16 text-moonlight/85'
        }`}
      >
        {!isUser && (
          <p className="mb-1 text-gold-soft/70 text-[11px] uppercase tracking-[0.15em]">Madhav</p>
        )}
        {children}
      </div>
    </div>
  )
}
