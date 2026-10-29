'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import ChakraLaunch from './darshan/ChakraLaunch'
import CosmicBackdrop from './darshan/CosmicBackdrop'
import EngineChakra from './darshan/EngineChakra'
import { TempleSkyline } from './darshan/CosmicForms'
import MorPankh from './darshan/MorPankh'
import QuoteReflection from './darshan/QuoteReflection'
import { darshanNotReady, isDarshanReady, subscribeDarshanReady } from '@/lib/darshan-launch'

const ENTRY_POINTS = [
  { label: 'Walk a path', href: '#paths' },
  { label: "Today's shloka", href: '#daily-verse' },
  { label: '18 chapters', href: '#chapters' },
  { label: 'Stories', href: '#stories' },
]

// One tap from the hero to a real answer — the questions people most often bring.
const STARTERS = ['I feel anxious about the future', 'I am afraid of failing', 'What is my purpose?']

/** Hand a question to the chat below and send it there. */
function askMadhav(raw: string) {
  const question = raw.trim()
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  if (!question) return
  window.dispatchEvent(new CustomEvent('madhav:prefill', { detail: { question, send: true } }))
}

/**
 * Hero — the Darshan.
 *
 * Three layers, as designed:
 *  1. **Presence** — the Sudarshan Chakra at full scale, lit from within and
 *     driven by the Darshan engine (it turns faster while Madhav thinks).
 *  2. **Reflection** — the shloka on glass, mirrored on the surface below it,
 *     with the four ways in (Teach me · Guide me · Explain · Ask).
 *  3. **Sacred interaction** — the Sudarshan Chakra launch ritual and the
 *     drifting mor pankh, both once and both reduced-motion aware.
 *
 * The content stays veiled until the chakra lands in the logo
 * (`madhav:darshan-ready`). A 3.5s failsafe reveals it regardless, so a broken
 * or blocked animation can never leave the page empty.
 */
export default function Hero() {
  // Subscribed rather than event-listened by hand: ChakraLaunch is a child, so
  // its effect (and the landing it announces) runs *before* this component's
  // effects. `useSyncExternalStore` re-reads the snapshot on subscribe and so
  // never misses that announcement.
  const landed = useSyncExternalStore(subscribeDarshanReady, isDarshanReady, darshanNotReady)
  const [failsafe, setFailsafe] = useState(false)

  useEffect(() => {
    // The hero reveals itself even if the ritual never reports back.
    // Must outlast the launch ritual (~7s). If this fires first, the hero
    // reveals — and Madhav's arrival plays — while the veil is still up, and the
    // seeker misses the entire descent. It is a failsafe, not a schedule.
    const t = window.setTimeout(() => setFailsafe(true), 9000)
    return () => clearTimeout(t)
  }, [])

  const revealed = landed || failsafe
  const [question, setQuestion] = useState('')

  return (
    <>
      <ChakraLaunch />

      <section
        id="darshan"
        className="relative min-h-screen flex items-center px-6 overflow-hidden pt-24 pb-16"
      >
        <CosmicBackdrop />
        <MorPankh />

        {/* The city, silhouetted along the base — foreground world, cosmos behind.
            Custom vector (components/darshan/CosmicForms.tsx), never sourced art. */}
        <TempleSkyline className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[74px] w-full opacity-90 md:h-[112px]" />

        <div
          className={`relative z-10 mx-auto w-full max-w-6xl transition-[opacity,transform] duration-1000 ease-out ${
            revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Mobile is one column ordered word → invitation → darshan, so the ask
              bar sits in a phone's first fold; desktop is two columns with the
              word and the invitation stacked on the left. `contents` dissolves
              the left wrapper on mobile so its halves order around the darshan. */}
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:items-center">
            <div className="contents lg:block lg:text-left">
              {/* ── Word ───────────────────────────────────────── */}
              <div className="order-1 text-center lg:text-left">
                <p className="eyebrow mb-6">The Bhagavad Gita · 700 Verses</p>

                <h1 className="hero-title mb-6">
                  Seek wisdom.
                  <br />
                  <em className="shimmer-text">Find peace.</em>
                </h1>

                <p className="text-moonlight/68 text-base md:text-[1.075rem] leading-[1.8] max-w-[34rem] mx-auto lg:mx-0">
                  Bring the question you carry. Madhav answers from the Bhagavad Gita &mdash; one
                  verse, one truth, and one step you can take today.
                </p>
              </div>

              {/* ── Invitation ─────────────────────────────────── */}
              <div className="order-2 text-center lg:text-left lg:mt-9">
                {/* Ask from the first fold: the question goes straight to the
                    chat below (`madhav:prefill` with send) — no second step. */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    askMadhav(question)
                  }}
                  className="ask-bar max-w-[34rem] mx-auto lg:mx-0"
                >
                  <label htmlFor="hero-ask" className="sr-only">
                    Ask Madhav a question
                  </label>
                  <input
                    id="hero-ask"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    maxLength={1000}
                    placeholder="What weighs on your heart?"
                    className="min-w-0 flex-1 bg-transparent py-3 text-[0.95rem] text-moonlight placeholder:text-moonlight/40 focus:outline-none"
                  />
                  <button type="submit" className="btn-leaf shrink-0 px-5 py-3 text-sm sm:px-6">
                    <span className="sm:hidden">Ask</span>
                    <span className="hidden sm:inline">Ask Madhav</span>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => askMadhav(s)}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-moonlight/62 transition-colors hover:border-gold-soft/50 hover:text-moonlight"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <nav
                  aria-label="Other ways in"
                  className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start"
                >
                  {ENTRY_POINTS.map((item, i) => (
                    <span key={item.label} className="flex items-center gap-6">
                      {i > 0 && <span className="hidden h-1 w-1 rotate-45 bg-gold-soft/45 sm:block" aria-hidden="true" />}
                      <a href={item.href} className="caps-link">
                        {item.label}
                      </a>
                    </span>
                  ))}
                </nav>

                <p className="mt-8 text-moonlight/35 text-xs max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Guidance inspired by the Bhagavad Gita &mdash; for reflection, not a substitute for
                  medical, legal, or financial advice.
                </p>
              </div>
            </div>

            {/* ── Darshan: presence + the verse resting beneath it ── */}
            <div className="order-3 flex flex-col items-center">
              <div className="relative mb-6">
                {/* Breathing aura */}
                <div className="darshan-aura lotus-pulse" aria-hidden="true" />
                {/* Turning halo of light behind the window */}
                <div className="darshan-halo halo-turn" aria-hidden="true" />

                {/* The Sudarshan Chakra is the darshan: the brand mark at full
                    scale, engine-driven, so it gathers speed while Madhav is
                    thinking and settles when he answers — the same motion as the
                    navbar logo. Aniconic by design: light, not likeness. */}
                <div className="hero-chakra" aria-hidden="true">
                  <div className="hero-chakra-glow" />
                  <EngineChakra size={380} className="hero-chakra-mark" />
                </div>
              </div>

              {/* Glass surface the verse rests on */}
              <div className="darshan-surface" aria-hidden="true" />
              <div className="w-full">
                <QuoteReflection tone="cosmic" reflect />
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
