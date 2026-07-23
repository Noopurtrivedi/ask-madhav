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
import { ArjunaWitness, DivineSilhouette, VishwaroopForm } from './CosmicForms'
import { DASHAVATAR, AvatarGlyphIcon } from './Dashavatar'
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
  const videoUrl = engine?.config.vishwaroop.video_url ?? null
  const videoPoster = engine?.config.vishwaroop.video_poster ?? null

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

  // ── The two acts ────────────────────────────────────────────────────────
  // I  (0 → 0.52): the ten descents arrive one by one around the form.
  // II (0.52 → 1): they converge inward and the Vishwaroop manifests — the form
  //                Arjuna was actually shown. The Dashavatar is the *prelude*;
  //                this is the moment it builds to.
  const ACT_II = 0.52
  const manifest = Math.max(0, Math.min(1, (progress - ACT_II) / (1 - ACT_II)))
  // Reduced motion has no timeline, so it is shown the climax directly.
  const climax = reduced ? 1 : manifest

  return (
    <section id="vishwaroop" className="relative overflow-hidden px-6 py-24">
      {/* A few stars so the bookend belongs to the same sky as the hero. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(1.4px 1.4px at 12% 62%, rgba(246,241,228,0.55), transparent),' +
            'radial-gradient(1.2px 1.2px at 78% 44%, rgba(246,241,228,0.45), transparent),' +
            'radial-gradient(1.6px 1.6px at 33% 84%, rgba(232,195,90,0.4), transparent),' +
            'radial-gradient(1.2px 1.2px at 62% 74%, rgba(246,241,228,0.4), transparent),' +
            'radial-gradient(1.3px 1.3px at 88% 88%, rgba(246,241,228,0.35), transparent)',
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-gold-soft/75">
          Bhagavad Gita · Chapter 11
        </p>
        <h2 className="mb-4 text-3xl font-bold text-moonlight md:text-4xl">Vishwaroop · Dashavatar</h2>
        <p className="mx-auto mb-8 max-w-xl leading-relaxed text-moonlight/70">
          Arjuna asked to see the form that contains all forms. What opened was
          not one figure but the whole descent — fish, tortoise, boar, man-lion,
          dwarf, axe-bearer, archer, cowherd, the awakened one, and the rider yet
          to come. Enter only if you wish to; it lasts a moment, then returns you.
        </p>

        <button
          ref={returnFocus}
          type="button"
          onClick={enter}
          className="rounded-full border border-gold/40 bg-gold-soft/10 px-8 py-4 text-lg font-semibold text-moonlight shadow-lg shadow-black/40 backdrop-blur-sm transition-all hover:scale-105 hover:border-gold hover:bg-gold-soft/20"
        >
          Behold the Cosmic Form
        </button>

        <p className="mt-4 text-xs text-moonlight/40">
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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-end pb-8"
          style={{ background: palette.deep }}
          role="dialog"
          aria-modal="true"
          aria-label="Vishwaroop Darshan — the Cosmic Form"
        >
          {/* An optional rendered loop, *behind* the real-time layer rather than
              instead of it — so the Dashavatar, the verse and the reduced-motion
              path all keep working whether or not the asset exists. Muted and
              `playsInline`: the app never autoplays audio. */}
          {videoUrl && !reduced && (
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-70"
              src={videoUrl}
              poster={videoPoster ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
          )}
          {videoUrl && reduced && videoPoster && (
            // Stillness gets the first frame, not a frozen video element.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="absolute inset-0 h-full w-full object-cover opacity-70"
              src={videoPoster}
              alt=""
              aria-hidden="true"
            />
          )}

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

          {/* Act I's form, which dissolves as Act II takes over. */}
          <div
            className="pointer-events-none absolute left-1/2 top-[46%] h-[68vh] w-[min(720px,80vw)] -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
            style={{
              opacity: (0.55 + 0.35 * Math.min(1, progress * 2)) * (1 - climax),
              transition: 'opacity 900ms ease-out',
            }}
          >
            <DivineSilhouette
              className="h-full w-full"
              color={palette.glow}
              glow={palette.primary}
              opacity={0.85}
            />
          </div>

          {/* Act II — the Vishwaroop itself. Grows as it manifests, so it opens
              *into* the viewer rather than simply appearing. */}
          {climax > 0 && (
            <div
              className="pointer-events-none absolute left-1/2 top-[44%] h-[92vh] w-[min(1080px,98vw)] -translate-x-1/2 -translate-y-1/2"
              aria-hidden="true"
              style={{
                opacity: Math.min(1, climax * 1.6),
                transform: `translate(-50%, -50%) scale(${(0.72 + 0.28 * climax).toFixed(3)})`,
                transition: 'opacity 900ms ease-out',
              }}
            >
              <VishwaroopForm
                className="h-full w-full"
                color={palette.glow}
                glow={palette.accent}
                intensity={climax}
              />
            </div>
          )}

          {/* Arjuna, kneeling at the foot of it. Without a human figure in frame,
              "vast" is only "large". */}
          <div
            className="pointer-events-none absolute bottom-[9vh] left-1/2 h-[19vh] w-[min(380px,56vw)] -translate-x-1/2"
            aria-hidden="true"
            style={{ opacity: 0.55 + 0.45 * climax, transition: 'opacity 900ms ease-out' }}
          >
            <ArjunaWitness className="h-full w-full" color="#05081C" />
          </div>

          {/* The ten, arriving one after another around the form. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {DASHAVATAR.map((glyph, i) => {
              // Ringed evenly, starting at the top and going clockwise.
              const angle = (i / DASHAVATAR.length) * Math.PI * 2 - Math.PI / 2
              // Each arrives in turn over the first ~75% of the reveal, so the
              // sequence reads as a descent rather than ten simultaneous pops.
              const arrival = (i / DASHAVATAR.length) * 0.75
              const shown = reduced || progress >= arrival
              const R = 'min(38vh, 36vw)'
              return (
                <div
                  key={glyph.id}
                  className="absolute left-1/2 top-[46%] flex flex-col items-center"
                  style={{
                    // They draw inward as Act II begins — the ten gathering back
                    // into the one they were always descents of.
                    transform: `translate(-50%, -50%) translate(calc(${R} * ${(Math.cos(angle) * (1 - 0.72 * climax)).toFixed(4)}), calc(${R} * ${(Math.sin(angle) * (1 - 0.72 * climax)).toFixed(4)}))`,
                    opacity: shown ? 1 - climax : 0,
                    transition: 'opacity 1100ms ease-out, transform 1400ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <AvatarGlyphIcon glyph={glyph} size={56} color={palette.glow} active={shown} />
                  <p className="mt-1 whitespace-nowrap text-[11px] tracking-[0.14em] text-moonlight/75">
                    {glyph.name}
                  </p>
                  <p
                    className="whitespace-nowrap text-[10px] text-gold-soft/60"
                    lang="sa"
                    style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
                  >
                    {glyph.sanskrit}
                  </p>
                </div>
              )
            })}
          </div>

          {/* The verse. Readability wins over the visual: the form is behind a
              soft glass panel so the Sanskrit never has to compete with the
              mandala's brightest rings. */}
          <div
            className="relative z-10 mx-6 max-w-lg rounded-2xl bg-cosmos-deep/45 px-5 py-3 text-center backdrop-blur-[2px] transition-opacity duration-1000"
            style={{ opacity: 1 - 0.72 * climax }}
          >
            {quote && (
              <>
                <p
                  className="mb-1.5 text-sm leading-relaxed text-moonlight/95 md:text-base"
                  style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
                  lang="sa"
                >
                  {quote.sanskrit}
                </p>
                <p className="mb-1.5 text-[11px] italic text-gold-soft/75">{quote.transliteration}</p>
                <p className="text-xs leading-relaxed text-moonlight/75 md:text-sm">
                  “{quote.english_meaning}”
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-gold-soft/60">
                  Bhagavad Gita · {quote.reference}
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={close}
            autoFocus
            className="relative z-10 mt-4 rounded-full border border-gold/40 bg-cosmos-deep/60 px-6 py-2.5 text-sm text-moonlight/80 backdrop-blur-[2px] transition-colors hover:border-gold hover:text-moonlight"
          >
            Return to the gentle form
          </button>
        </div>,
        document.body
      )}
    </section>
  )
}
