'use client'

/**
 * VishwaroopDarshan — the Cosmic Form, as a rare and consented moment.
 *
 * The brief is emphatic that Vishwaroop must never be the default state, so
 * this is a quiet invitation card on the page. Nothing loads, mounts or moves
 * until the seeker taps it: the 3D scene lives behind a dynamic import that is
 * only reached on entry.
 *
 * Arjuna asked to see it, was overwhelmed, and asked for the gentle form back
 * (11.45–11.46). That arc is the interaction model: an explicit request, a
 * bounded experience, and an always-available way out — Escape, the Return
 * button, or simply leaving it: the reveal closes itself after
 * `max_duration_ms` without a touch. Within that, the ten descents are
 * interactive (DashavatarOrbit); the seeker chooses when they gather.
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
import ViraatForm from './ViraatForm'
import DashavatarOrbit from './DashavatarOrbit'
import { useReducedMotion } from '@/lib/motion'
import { darshan } from '@/lib/darshan/events'
import { VISUAL_MOODS } from '@/lib/darshan/registry'

const VishwaroopScene = dynamic(() => import('./three/VishwaroopScene'), {
  ssr: false,
  loading: () => null,
})

// The two acts: I (0 → 0.52) the ten descents arrive and can be explored;
// II (0.52 → 1) they gather and the one form manifests, at the seeker's asking.
const ACT_II = 0.52
const GATHER_AFTER_MS = 4000
// Long enough for every head to emerge and the form to finish growing.
const FORM_HOLD_MS = 20_000

export default function VishwaroopDarshan() {
  const engine = useDarshanOptional()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [gathered, setGathered] = useState(false)
  const [ending, setEnding] = useState(false)
  // The overlay is portalled to <body>, so it needs a mounted flag to stay
  // SSR-safe (there is no `document` on the server).
  const [mounted, setMounted] = useState(false)
  const raf = useRef<number | null>(null)
  const returnFocus = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  const enabled = engine?.config.vishwaroop.enabled ?? true
  const idleMs = engine?.config.vishwaroop.max_duration_ms ?? 90_000
  const idleAt = useRef(0)
  const palette =
    engine?.config.forms.find((f) => f.form_id === 'vishwaroop_darshan')?.color_palette ??
    VISUAL_MOODS.cosmos.palette
  // The scene only runs where the engine has already cleared the device.
  const canRender3D = Boolean(engine?.use3D) && !reduced
  const videoUrl = engine?.config.vishwaroop.video_url ?? null
  const videoPoster = engine?.config.vishwaroop.video_poster ?? null

  const finish = useCallback(() => {
    setOpen(false)
    setProgress(0)
    setGathered(false)
    setEnding(false)
    darshan.idle('vishwaroop')
    // Return focus to the trigger — the overlay took it on entry.
    returnFocus.current?.focus()
  }, [])

  // The form swells past the frame into light before the gentle form returns.
  // A second request while that plays leaves at once; so does stillness.
  const close = useCallback(() => {
    if (reduced || !gathered || ending) {
      finish()
      return
    }
    setEnding(true)
    window.setTimeout(finish, 3400)
  }, [reduced, gathered, ending, finish])

  // The timeline must not restart when `close` changes (it does when the ending
  // begins), so it reaches the latest one through a ref.
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  }, [close])

  const enter = useCallback(() => {
    setOpen(true)
    setProgress(0)
    darshan.vishwaroop('vishwaroop')
  }, [])

  const touch = useCallback(() => {
    idleAt.current = performance.now()
  }, [])
  const gather = useCallback(() => {
    touch()
    setGathered(true)
  }, [touch])

  // Drive `progress`: the ten arrive (0 → ACT_II) and hold while the seeker
  // explores; gathering plays the rest (ACT_II → 1), which holds on the one form.
  // Either way the reveal stays bounded: untouched for `idleMs`, it closes.
  useEffect(() => {
    if (!open) return
    touch()
    const from = gathered ? ACT_II : 0
    const to = gathered ? 1 : ACT_II
    const dur = gathered ? 7000 : 9000
    const start = performance.now()
    const tick = (now: number) => {
      if (now - idleAt.current > idleMs) {
        raf.current = null
        closeRef.current()
        return
      }
      if (!reduced) {
        // The film plays itself: once the ten have arrived and the seeker has
        // left them alone a moment, they gather; the form then grows to its
        // full height and swells into light. Touching a form holds step one.
        if (!gathered && now - Math.max(idleAt.current, start + dur) > GATHER_AFTER_MS) {
          setGathered(true)
          return
        }
        if (gathered && now - start > FORM_HOLD_MS) {
          raf.current = null
          closeRef.current()
          return
        }
      }
      if (!reduced) setProgress(Math.min(to, from + ((to - from) * (now - start)) / dur))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current)
      raf.current = null
    }
  }, [open, reduced, idleMs, gathered, touch])

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

  // Stillness has no timeline: gathering simply shows the form.
  const shown = reduced ? (gathered ? 1 : ACT_II) : progress
  const climax = Math.max(0, Math.min(1, (shown - ACT_II) / (1 - ACT_II)))

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
          to come. Enter only if you wish to. Touch any form to pause on it; otherwise the ten gather into the one, and it returns you.
        </p>

        <button
          ref={returnFocus}
          type="button"
          onClick={enter}
          className="btn-ghost px-9 py-4"
        >
          Behold the Cosmic Form
        </button>

        <p className="mt-4 text-xs text-moonlight/40">
          Press Escape at any time to return
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
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-end pb-8 ${ending ? 'vishwa-ending' : ''}`}
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
              <VishwaroopScene palette={palette} progress={shown} />
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

          {/* The one form, which is everyone. */}
          <ViraatForm show={climax > 0} ending={ending} use3D={canRender3D} />

          {/* Arjuna, kneeling in the light. Without a human figure in frame,
              "vast" is only "large". */}
          {reduced ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="arjuna-witness" src="/art/arjuna-poster.jpg" alt="" aria-hidden="true" />
          ) : (
            <video
              className="arjuna-witness"
              poster="/art/arjuna-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              aria-hidden="true"
            >
              <source src="/art/arjuna.webm" type="video/webm" />
              <source src="/art/arjuna.mp4" type="video/mp4" />
            </video>
          )}

          <DashavatarOrbit
            arrival={Math.min(1, shown / ACT_II)}
            gathered={gathered}
            reduced={reduced}
            onGather={gather}
            onTouch={touch}
          />

          {/* No verse here by design. The cosmic form is the whole point of this
              moment, and a panel of text in front of it — however small — reads
              as a caption on a photograph. The shloka lives on the invitation
              card and on the verse pages, where it can actually be read. */}

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
