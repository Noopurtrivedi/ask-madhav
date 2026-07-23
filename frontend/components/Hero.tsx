'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import ChakraLaunch from './darshan/ChakraLaunch'
import CosmicBackdrop from './darshan/CosmicBackdrop'
import MadhavPresence from './darshan/MadhavPresence'
import { DivineSilhouette, TempleSkyline } from './darshan/CosmicForms'
import MorPankh from './darshan/MorPankh'
import QuoteReflection from './darshan/QuoteReflection'
import { darshanNotReady, isDarshanReady, subscribeDarshanReady } from '@/lib/darshan-launch'

/**
 * Hero — the Darshan.
 *
 * Three layers, as designed:
 *  1. **Presence** — Madhav seen through an arched darshan window, lit from
 *     within, dissolving at its edges into the cosmos. `MadhavPresence` decides
 *     whether that is the 3D scene or the static artwork, from the device tier.
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
    const t = window.setTimeout(() => setFailsafe(true), 3500)
    return () => clearTimeout(t)
  }, [])

  const revealed = landed || failsafe

  const scrollToChat = () => {
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  }

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
          {/* Mobile is one column ordered word → darshan → invitation; desktop is
              two columns with the word and the invitation stacked on the left.
              `contents` dissolves the left wrapper on mobile so its two halves
              can be ordered around the darshan without duplicating any markup. */}
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:items-center">
            <div className="contents lg:block lg:text-left">
              {/* ── Word ───────────────────────────────────────── */}
              <div className="order-1 text-center lg:text-left">
                <p className="text-gold-soft/70 text-[11px] sm:text-xs font-medium tracking-[0.34em] uppercase mb-5">
                  Bhagavad Gita · 700 Verses · Timeless Wisdom
                </p>

                <h1
                  className="text-4xl sm:text-5xl md:text-6xl font-bold text-moonlight mb-5 leading-[1.08]"
                  style={{ fontFamily: 'Crimson Text, serif' }}
                >
                  Seek Wisdom.
                  <br />
                  <span className="shimmer-text">Find Peace.</span>
                </h1>

                <p className="text-moonlight/65 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Bring your daily life questions. Receive guidance rooted in the eternal
                  teachings of the Bhagavad Gita — verse by verse, truth by truth.
                </p>
              </div>

              {/* ── Invitation ─────────────────────────────────── */}
              <div className="order-3 text-center lg:text-left lg:mt-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={scrollToChat}
                    className="px-8 py-4 bg-saffron text-navy font-semibold rounded-full text-lg
                               hover:bg-saffron-light transition-all hover:scale-105 shadow-lg shadow-saffron/25"
                  >
                    Ask a Question
                  </button>
                  <a
                    href="#daily-verse"
                    className="px-8 py-4 border border-gold/40 text-moonlight rounded-full text-lg bg-white/[0.06]
                               backdrop-blur-sm hover:border-gold hover:bg-white/[0.12] transition-all hover:scale-105 inline-block"
                  >
                    Today&apos;s Verse
                  </a>
                </div>

                <p className="mt-6 text-moonlight/35 text-xs max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Guidance inspired by the Bhagavad Gita — for reflection, not a substitute for
                  medical, legal, or financial advice.
                </p>
              </div>
            </div>

            {/* ── Darshan: presence + the verse resting beneath it ── */}
            <div className="order-2 flex flex-col items-center">
              <div className="relative mb-6">
                {/* Breathing aura */}
                <div className="darshan-aura lotus-pulse" aria-hidden="true" />
                {/* Turning halo of light behind the window */}
                <div className="darshan-halo halo-turn" aria-hidden="true" />

                {/* The form behind the form — a translucent divine silhouette
                    rising out of the cosmos behind Madhav. Rendered for every
                    tier (pure SVG), so it is not gated on WebGL. */}
                <DivineSilhouette className="divine-behind" opacity={0.6} />

                <div className="darshan-window">
                  {/* The presence itself: the procedural 3D darshan on capable
                      devices, the Kurukshetra artwork everywhere else. The
                      component owns that decision — see MadhavPresence. */}
                  {/* No frame: Madhav is masked to a soft ellipse and dissolves
                      straight into the sky. See `.darshan-window` in globals.css. */}
                  <MadhavPresence />
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
