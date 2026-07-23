'use client'

/**
 * VishwaroopDarshan — the Cosmic Form, as a rare and consented moment.
 *
 * The brief is emphatic that Vishwaroop must never be the default state, so
 * this is a quiet invitation card on the page. Nothing loads, mounts or moves
 * until the seeker taps it: the 3D scene lives behind a dynamic import that is
 * only reached on entry, and the reveal ends itself after
 * `config.vishwaroop.max_duration_ms`.
 *
 * Arjuna asked to see it, was overwhelmed, and asked for the gentle form back
 * (11.45–11.46). That arc is the interaction model: an explicit request, a
 * bounded experience, and an always-available way out — Escape, the Return
 * button, or simply waiting.
 *
 * Under reduced motion (or on any device below `full` tier) the same content is
 * offered as a still mandala with the verse — the meaning is never gated behind
 * the ability to run WebGL.
 */

import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDarshanOptional } from './DarshanProvider'
import { CosmicMandala } from './SacredSymbols'
import { useReducedMotion } from '@/lib/motion'
import { quoteByReference } from '@/lib/darshan/quotes'
import { darshan } from '@/lib/darshan/events'
import { VISUAL_MOODS } from '@/lib/darshan/registry'

const VishwaroopScene = dynamic(() => import('./three/VishwaroopScene'), {
  ssr: false,
  loading: () => null,
})

/** Gita 11.12 — the light of a thousand suns. The verse this moment belongs to. */
const VISHWAROOP_REFERENCE = '11.12'

export default function VishwaroopDarshan() {
  const engine = useDarshanOptional()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  // The overlay is portalled to <body>, so it needs a mounted flag to stay
  // SSR-safe (there is no `document` on the server).
  const [mounted, setMounted] = useState(false)
  const raf = useRef<number | null>(null)
  const returnFocus = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  const enabled = engine?.config.vishwaroop.enabled ?? true
  const maxMs = engine?.config.vishwaroop.max_duration_ms ?? 24_000
  const palette =
    engine?.config.forms.find((f) => f.form_id === 'vishwaroop_darshan')?.color_palette ??
    VISUAL_MOODS.cosmos.palette
  // The scene only runs where the engine has already cleared the device.
  const canRender3D = Boolean(engine?.use3D) && !reduced

  const close = useCallback(() => {
    setOpen(false)
    setProgress(0)
    darshan.idle('vishwaroop')
    // Return focus to the trigger — the overlay took it on entry.
    returnFocus.current?.focus()
  }, [])

  const enter = useCallback(() => {
    setOpen(true)
    setProgress(0)
    darshan.vishwaroop('vishwaroop')
  }, [])

  // Drive `progress` 0→1 over the configured duration, then resolve on its own.
  useEffect(() => {
    if (!open) return
    if (reduced) {
      // Stillness: hold the form fully revealed, no timeline, no auto-dismiss.
      setProgress(1)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / maxMs)
      setProgress(p)
      if (p >= 1) {
        raf.current = null
        close()
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current)
      raf.current = null
    }
  }, [open, reduced, maxMs, close])

  // Escape always returns the gentle form. The overlay owns the viewport.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, close])

  if (!enabled) return null

  const quote = quoteByReference(VISHWAROOP_REFERENCE)

  return (
    <section id="vishwaroop" className="px-6 py-20" style={{ background: '#F3E7CD' }}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-saffron/70">
          Bhagavad Gita · Chapter 11
        </p>
        <h2 className="mb-4 text-3xl font-bold text-ink md:text-4xl">Vishwaroop Darshan</h2>
        <p className="mx-auto mb-8 max-w-xl leading-relaxed text-ink/65">
          Arjuna asked to see the form beyond form — and having seen it, asked
          gently for the familiar one back. Enter only if you wish to. It lasts a
          moment, then returns you here.
        </p>

        <button
          ref={returnFocus}
          type="button"
          onClick={enter}
          className="rounded-full bg-cosmos px-8 py-4 text-lg font-semibold text-moonlight shadow-lg shadow-cosmos/25 transition-all hover:scale-105 hover:bg-cosmos-violet"
        >
          Behold the Cosmic Form
        </button>

        <p className="mt-4 text-xs text-ink/40">
          A brief, quiet reveal · press Escape at any time to return
        </p>
      </div>

      {/*
        Portalled to <body> on purpose. This section sits inside a `[data-reveal]`
        wrapper, and ScrollReveal animates that wrapper's `transform` — which
        makes it the containing block for `position: fixed` descendants. Rendered
        in place, the overlay would be trapped inside the section (page and
        navbar showing through) instead of covering the viewport.
      */}
      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: palette.deep }}
          role="dialog"
          aria-modal="true"
          aria-label="Vishwaroop Darshan — the Cosmic Form"
        >
          {/* The reveal itself. */}
          <div className="absolute inset-0" aria-hidden="true">
            {canRender3D ? (
              <VishwaroopScene palette={palette} progress={progress} />
            ) : (
              // Static counterpart — the same meaning without a single moving pixel.
              <div className="flex h-full w-full items-center justify-center">
                <CosmicMandala
                  className="h-[min(80vw,80vh)] w-[min(80vw,80vh)] opacity-70"
                  color={palette.primary}
                />
              </div>
            )}
          </div>

          {/* The verse. Readability wins over the visual: the form is behind a
              soft glass panel so the Sanskrit never has to compete with the
              mandala's brightest rings. */}
          <div className="relative z-10 mx-6 max-w-2xl rounded-3xl bg-cosmos-deep/55 px-8 py-7 text-center backdrop-blur-[3px]">
            {quote && (
              <>
                <p
                  className="mb-3 text-lg leading-relaxed text-moonlight md:text-2xl"
                  style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
                  lang="sa"
                >
                  {quote.sanskrit}
                </p>
                <p className="mb-4 text-sm italic text-gold-soft/80">{quote.transliteration}</p>
                <p className="text-base leading-relaxed text-moonlight/80">
                  “{quote.english_meaning}”
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gold-soft/60">
                  Bhagavad Gita · {quote.reference}
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={close}
            autoFocus
            className="relative z-10 mt-10 rounded-full border border-gold/40 px-6 py-3 text-sm text-moonlight/80 transition-colors hover:border-gold hover:text-moonlight"
          >
            Return to the gentle form
          </button>
        </div>,
        document.body
      )}
    </section>
  )
}
