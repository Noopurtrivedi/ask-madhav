'use client'

/**
 * QuoteReflection — the Gita Quote Reflection system.
 *
 * Supersedes `HeroVerse`. Where that rotated five inlined shlokas, this reads
 * `lib/darshan/quotes.ts` (the `gita_quotes` seed), so every quote arrives with
 * chapter/verse, Sanskrit, transliteration, a plain-language English meaning,
 * Hindi, a **theme** and a **visual mood** — and the mood repaints the card's
 * accent, its background symbol and the ambient particle density through one
 * declaration. Add a quote to the JSON and it simply appears, correctly styled.
 *
 * Four intents sit under the verse — Teach me · Guide me · Explain this shloka ·
 * Ask Madhav. Each one hands a fully-formed question to the existing chat via
 * the `madhav:prefill` event bus (or `sessionStorage` when we are not on the
 * home page), so the hero is a doorway into the product rather than decoration.
 *
 * Readability is the hard constraint: the Sanskrit sits at a comfortable size on
 * a backdrop-blurred card, the reflection beneath it is `aria-hidden` decoration
 * that disappears entirely under reduced motion, and nothing about the text
 * animates while it is being read — only the cross-fade between quotes moves.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDarshanOptional } from './DarshanProvider'
import { MoodSymbol } from './SacredSymbols'
import { useReducedMotion } from '@/lib/motion'
import { loadQuotes, moodForQuote } from '@/lib/darshan/quotes'
import { QUOTE_CATEGORIES } from '@/lib/darshan/registry'
import type { GitaQuote } from '@/lib/darshan/types'

const PREFILL_EVENT = 'madhav:prefill'
const PREFILL_KEY = 'madhav:prefill'

/**
 * The four ways in. Each builds a real question from the quote in view — the
 * seeker never has to know what to type to get a good first answer.
 */
const INTENTS: { id: string; label: string; build: (q: GitaQuote) => string }[] = [
  {
    id: 'teach',
    label: 'Teach me',
    build: (q) =>
      `Teach me what Bhagavad Gita ${q.reference} means, simply, as if I am new to the Gita.`,
  },
  {
    id: 'guide',
    label: 'Guide me',
    build: (q) =>
      `I am struggling with ${QUOTE_CATEGORIES[q.theme]?.display_name.split(' — ')[1]?.toLowerCase() || q.theme}. Guide me using Bhagavad Gita ${q.reference}.`,
  },
  {
    id: 'explain',
    label: 'Explain this shloka',
    build: (q) =>
      `Explain the shloka "${q.transliteration.split(',')[0]}" (Bhagavad Gita ${q.reference}) word by word, then give me its heart in one line.`,
  },
  {
    id: 'ask',
    label: 'Ask Madhav',
    build: () => '',
  },
]

interface Props {
  /** `cosmic` = on the dark Darshan hero; `light` = on a cream page. */
  tone?: 'light' | 'cosmic'
  /** Mirror the card onto the glass surface below it (cosmic hero only). */
  reflect?: boolean
  /** Rotate through the quote set. Off for a single pinned quote. */
  rotate?: boolean
}

export default function QuoteReflection({
  tone = 'light',
  reflect = false,
  rotate = true,
}: Props) {
  const engine = useDarshanOptional()
  const reduced = useReducedMotion()
  const cosmic = tone === 'cosmic'

  const quotes = loadQuotes(engine?.config.quotes.themes ?? [])
  const rotateMs = engine?.config.quotes.rotate_ms ?? 9000
  const showHindi = engine?.config.quotes.show_hindi ?? false

  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [showMeaning, setShowMeaning] = useState(false)
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const quote = quotes[index % quotes.length]
  const mood = moodForQuote(quote)
  const category = QUOTE_CATEGORIES[quote.theme]

  // Rotation. Reduced motion pins the first quote — a shloka that swaps itself
  // out from under a slow reader is an accessibility failure, not a flourish.
  useEffect(() => {
    if (!rotate || reduced || rotateMs <= 0 || quotes.length < 2) return
    const id = setInterval(() => {
      setVisible(false)
      swapTimer.current = setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length)
        setShowMeaning(false)
        setVisible(true)
      }, 600)
    }, rotateMs)
    return () => {
      clearInterval(id)
      if (swapTimer.current) clearTimeout(swapTimer.current)
    }
  }, [rotate, reduced, rotateMs, quotes.length])

  // Keep the engine's mood in step with what is on screen, so the aura and the
  // particles behind the hero are tinted by the verse the seeker is reading.
  useEffect(() => {
    engine?.setQuote(quote)
    // `setQuote` is stable (useState setter); depending on `engine` would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote])

  const prefill = useCallback((text: string) => {
    // Same idiom the verse cards and Guided Paths already use.
    if (typeof window === 'undefined') return
    const onHome = window.location.pathname === '/'
    if (onHome) {
      // An empty string means "just take me there" (the Ask Madhav intent) —
      // the seeker brings their own question.
      if (text) window.dispatchEvent(new CustomEvent(PREFILL_EVENT, { detail: text }))
      document.getElementById('chat')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
    } else if (!text) {
      window.location.href = '/#chat'
    } else {
      try {
        window.sessionStorage.setItem(PREFILL_KEY, text)
      } catch {
        /* storage blocked — the chat simply opens empty */
      }
      window.location.href = '/#chat'
    }
  }, [reduced])

  const goto = (next: number) => {
    setIndex(((next % quotes.length) + quotes.length) % quotes.length)
    setShowMeaning(false)
    setVisible(true)
  }

  const card = (
    <div
      className={`relative overflow-hidden rounded-2xl px-6 py-5 ${
        cosmic
          ? 'border border-gold/25 bg-white/[0.055] backdrop-blur-md shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]'
          : 'border border-saffron/25 bg-white/70 backdrop-blur-sm shadow-lg shadow-saffron/10'
      }`}
    >
      {/* Background symbol for this mood — faint, behind the text, never competing. */}
      <MoodSymbol
        symbol={mood.background_symbol}
        className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 opacity-[0.07]"
        color={cosmic ? mood.palette.primary : mood.palette.accent}
      />

      <div
        className={`relative transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Theme chip — the quote's category, mapped to its mood colour. */}
        <p
          className="mb-3 text-[10px] font-medium uppercase tracking-[0.28em]"
          style={{ color: cosmic ? mood.palette.primary : mood.palette.accent }}
        >
          {category?.display_name ?? quote.theme}
        </p>

        <p
          className={`mb-2 text-lg leading-relaxed md:text-xl ${cosmic ? 'text-moonlight' : 'text-ink'}`}
          style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
          lang="sa"
        >
          {quote.sanskrit}
        </p>

        <p className={`mb-2 text-sm italic ${cosmic ? 'text-gold-soft/85' : 'text-saffron/80'}`}>
          {quote.transliteration}
        </p>

        <p className={`text-sm leading-relaxed md:text-base ${cosmic ? 'text-moonlight/75' : 'text-ink/70'}`}>
          “{quote.english_meaning}”
        </p>

        {showHindi && quote.hindi_meaning && (
          <p
            className={`mt-2 text-sm leading-relaxed ${cosmic ? 'text-moonlight/60' : 'text-ink/60'}`}
            lang="hi"
            style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
          >
            {quote.hindi_meaning}
          </p>
        )}

        {/* Hindi on demand even when it is off by default — one tap, no rotation. */}
        {!showHindi && quote.hindi_meaning && (
          <>
            {showMeaning && (
              <p
                className={`mt-2 text-sm leading-relaxed ${cosmic ? 'text-moonlight/60' : 'text-ink/60'}`}
                lang="hi"
                style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
              >
                {quote.hindi_meaning}
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowMeaning((s) => !s)}
              className={`mt-2 text-xs underline underline-offset-4 transition-colors ${
                cosmic ? 'text-moonlight/45 hover:text-gold-soft' : 'text-ink/40 hover:text-saffron'
              }`}
            >
              {showMeaning ? 'Hide Hindi' : 'हिंदी में पढ़ें'}
            </button>
          </>
        )}

        <p
          className={`mt-3 text-xs uppercase tracking-[0.2em] ${
            cosmic ? 'text-gold-soft/60' : 'text-saffron/60'
          }`}
        >
          Bhagavad Gita · {quote.reference}
        </p>
      </div>

      {/* Rotation dots — clickable, so a seeker can steer instead of waiting. */}
      {quotes.length > 1 && (
        <div className="relative mt-4 flex justify-center gap-1.5">
          {quotes.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => goto(i)}
              aria-label={`Show Bhagavad Gita ${q.reference}`}
              aria-current={i === index ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index
                  ? `w-5 ${cosmic ? 'bg-gold-soft' : 'bg-saffron'}`
                  : `w-1.5 ${cosmic ? 'bg-gold-soft/25' : 'bg-saffron/30'}`
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl">
      {/* Only the real card announces — the reflection is silent decoration. */}
      <div aria-live="polite">{card}</div>

      {/* The verse resting on still water. */}
      {cosmic && reflect && !reduced && (
        <div className="verse-reflection" aria-hidden="true">
          {card}
        </div>
      )}

      {/* ── The four ways in ────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {INTENTS.map((intent) => (
          <button
            key={intent.id}
            type="button"
            onClick={() => prefill(intent.build(quote))}
            className={`rounded-full px-4 py-2 text-sm transition-all hover:scale-[1.03] ${
              cosmic
                ? 'border border-gold/30 bg-white/[0.06] text-moonlight/85 backdrop-blur-sm hover:border-gold hover:bg-white/[0.12]'
                : 'border border-saffron/30 bg-white/70 text-ink/75 hover:border-saffron hover:bg-white'
            }`}
          >
            {intent.label}
          </button>
        ))}
      </div>
    </div>
  )
}
