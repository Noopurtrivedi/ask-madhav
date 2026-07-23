'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import SudarshanChakra, { type ChakraState } from './SudarshanChakra'
import {
  CHAKRA_LOGO_ATTR,
  announceDarshanReady,
  hasLaunchedThisSession,
  markLaunched,
  subscribeDarshanReplay,
} from '@/lib/darshan-launch'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * ChakraLaunch — the arrival ritual, and the release.
 *
 * A deep-indigo veil covers the page; the Sudarshan Chakra gathers light at the
 * centre, then is *thrown*: it comes at the viewer flat and spinning, passes
 * close, then recedes across the page and lands in the navbar logo. The veil
 * dissolves and the hero takes its first breath.
 *
 * ── The flight is a real discus, not a slide ─────────────────────────────
 * The veil establishes a perspective, and the chakra travels in Z as well as
 * X/Y. It starts tilted almost edge-on (`rotateX(74deg)`) — a discus lying
 * flat — opens toward the viewer as it rushes in, then flattens back out as it
 * flies away to the logo. The disc's own spin comes from `SudarshanChakra`'s
 * internal rotation, driven to `processing` speed for the throw and eased down
 * to `settling` as it lands, so it decelerates like a thrown object rather than
 * stopping dead.
 *
 * Design rules this obeys:
 *  - **Once per session.** A ritual repeated on every navigation is an
 *    obstacle, not a welcome (`askmadhav_darshan_launched`).
 *  - **Releasable on demand.** Clicking the logo chakra throws it again, harder
 *    and faster (`FAST` timings) — the seeker's own release.
 *  - **Always skippable.** Click/tap anywhere, the Skip button, or Escape.
 *  - **Reduced motion → no ritual at all**, and no replay either.
 *  - **Fail-open.** The flight is measured from the live logo rect; if the logo
 *    is missing it flies to a sensible top-left. Any throw, any missing API, and
 *    the veil still lifts — the hero also self-reveals on a timer.
 */

/**
 * The welcome: unhurried, ceremonial.
 *
 * Roughly doubled from the first tuning. The original sequence was over in
 * ~2.5s, which is long enough to *notice* the chakra but not long enough to
 * watch it — the discus gathered, flew and landed before the eye had settled on
 * it. A ritual you cannot follow is just a transition.
 */
const WELCOME = {
  flightDelay: 2400, // the chakra gathers light — let it hold before the throw
  flightMs: 2100, // the throw itself, at viewer and away
  veilDelay: 4000,
  veilMs: 1200,
  doneMs: 5400,
}

/**
 * The release: the seeker threw it. Krishna's discus does not amble — it is
 * loosed. Roughly half the durations and almost no wind-up.
 */
const FAST = {
  flightDelay: 180,
  flightMs: 1150,
  veilDelay: 900,
  veilMs: 520,
  doneMs: 1750,
}

/** Depth the chakra recedes to before the throw, and how close it passes. */
const Z_BACK = -300
const Z_NEAR = 620

export default function ChakraLaunch() {
  const veilRef = useRef<HTMLDivElement>(null)
  const flightRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const finished = useRef(false)
  const [gone, setGone] = useState(false)
  const [chakraState, setChakraState] = useState<ChakraState>('idle')
  // Bumped on every replay so the veil's entry animations restart from zero.
  const [runId, setRunId] = useState(0)

  /** Lift the veil now, whatever stage we were at. Safe to call twice. */
  const finish = useCallback((immediate = false) => {
    if (finished.current) return
    finished.current = true
    timers.current.forEach(clearTimeout)
    timers.current = []

    const veil = veilRef.current
    const lift = () => {
      markLaunched()
      announceDarshanReady()
      setGone(true)
      try {
        document.body.style.overflow = ''
      } catch {
        /* noop */
      }
    }

    if (immediate && veil) {
      try {
        veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' })
        timers.current.push(window.setTimeout(lift, 260))
        return
      } catch {
        /* fall through to an instant lift */
      }
    }
    lift()
  }, [])

  /** Run the throw. `timing` chooses the ceremonial welcome or the fast release. */
  const play = useCallback(
    (timing: typeof WELCOME) => {
      const veil = veilRef.current
      const flight = flightRef.current
      if (!veil || !flight) {
        finish()
        return
      }

      // The ritual owns the viewport while it plays.
      document.body.style.overflow = 'hidden'

      try {
        const logo = document.querySelector(`[${CHAKRA_LOGO_ATTR}]`)
        const from = flight.getBoundingClientRect()
        const to = logo?.getBoundingClientRect()

        // Where the chakra comes to rest: the logo slot, or a graceful top-left.
        const targetX = to ? to.left + to.width / 2 : 64
        const targetY = to ? to.top + to.height / 2 : 48
        const targetSize = to && to.width > 4 ? to.width : 30

        const dx = targetX - (from.left + from.width / 2)
        const dy = targetY - (from.top + from.height / 2)
        const scale = targetSize / from.width

        // A thrown discus: flat and far → rushing at the viewer, opening up →
        // past us and away → landing face-on in the logo. The final keyframe
        // sits at translateZ(0) so dx/dy map 1:1 to screen pixels and the
        // landing is exact regardless of the perspective depth.
        flight.animate(
          [
            {
              transform: `translate3d(0, 0, ${Z_BACK}px) rotateX(74deg) rotateZ(0deg)`,
              opacity: 0.85,
              offset: 0,
            },
            {
              transform: `translate3d(${dx * 0.06}px, ${dy * 0.04}px, ${Z_NEAR}px) rotateX(26deg) rotateZ(120deg)`,
              opacity: 1,
              offset: 0.3,
            },
            {
              transform: `translate3d(${dx * 0.3}px, ${dy * 0.22}px, 120px) rotateX(10deg) rotateZ(260deg)`,
              opacity: 1,
              offset: 0.55,
            },
            {
              transform: `translate3d(${dx}px, ${dy}px, 0) rotateX(0deg) rotateZ(420deg) scale(${scale})`,
              opacity: 0.95,
              offset: 1,
            },
          ],
          {
            duration: timing.flightMs,
            delay: timing.flightDelay,
            // Fast out of the hand, long settle into the logo.
            easing: 'cubic-bezier(0.5, 0, 0.2, 1)',
            fill: 'forwards',
          }
        )

        // The disc spins up for the throw, then decelerates into the logo.
        timers.current.push(
          window.setTimeout(() => setChakraState('processing'), timing.flightDelay)
        )
        timers.current.push(
          window.setTimeout(
            () => setChakraState('settling'),
            timing.flightDelay + timing.flightMs * 0.62
          )
        )

        veil.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: timing.veilMs,
          delay: timing.veilDelay,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        })
      } catch {
        // No Web Animations API → skip straight to the page.
        document.body.style.overflow = ''
        finish()
        return
      }

      timers.current.push(window.setTimeout(() => finish(), timing.doneMs))
    },
    [finish]
  )

  // ── The welcome ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Repeat visit within the session, or a seeker who asked for stillness →
    // no ritual. Reveal everything immediately.
    if (hasLaunchedThisSession() || prefersReducedMotion()) {
      finish()
      return
    }

    play(WELCOME)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(true)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      timers.current.forEach(clearTimeout)
      timers.current = []
      document.body.style.overflow = ''
    }
  }, [finish, play])

  // ── The release (logo click) ─────────────────────────────────────────────
  useEffect(
    () =>
      subscribeDarshanReplay(() => {
        // Stillness was asked for; a flying discus is not stillness.
        if (prefersReducedMotion()) return
        finished.current = false
        setChakraState('idle')
        setGone(false)
        setRunId((n) => n + 1)
      }),
    []
  )

  // A replay re-mounts the veil; play the fast throw once it is on screen.
  useEffect(() => {
    if (runId === 0 || gone) return
    // rAF so the veil has laid out and `getBoundingClientRect` is meaningful.
    const id = requestAnimationFrame(() => play(FAST))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(true)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [runId, gone, play, finish])

  if (gone) return null

  return (
    <div
      id="darshan-veil"
      ref={veilRef}
      className="darshan-veil"
      onClick={() => finish(true)}
      role="presentation"
      // The inline script below sets `display:none` on this node *before*
      // hydration, so React finds a `style` attribute the server never wrote.
      // That is the intended behaviour, and the suppression has to live on the
      // mismatching element itself — `suppressHydrationWarning` on <html> only
      // covers <html>'s own attributes, not its descendants'.
      suppressHydrationWarning
    >
      {/* Repeat visits and reduced-motion seekers must never see even a flash
          of the veil, and it must not trap a JS-less browser. Both are handled
          before React hydrates.

          Only on the first run: after one launch the session flag is set, so on
          a replay this same guard would hide the veil the seeker just asked for. */}
      {runId === 0 && (
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var v=document.getElementById('darshan-veil');" +
              "if(v&&(sessionStorage.getItem('askmadhav_darshan_launched')==='1'||" +
              "(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)))" +
              "{v.style.display='none'}}catch(e){}",
          }}
        />
      )}
      <noscript>
        <style>{`#darshan-veil{display:none}`}</style>
      </noscript>

      <div className="darshan-veil-glow" aria-hidden="true" />

      {/* `key` restarts the CSS gather animation on every release. */}
      <div key={runId} ref={flightRef} className="darshan-flight">
        <span className="darshan-ring" aria-hidden="true" />
        <span className="darshan-ring darshan-ring-2" aria-hidden="true" />
        <SudarshanChakra size={196} state={chakraState} className="darshan-launch-chakra" />
      </div>

      <p className="darshan-veil-word" aria-hidden="true">
        Ask Madhav
      </p>

      <button
        type="button"
        className="darshan-skip"
        onClick={(e) => {
          e.stopPropagation()
          finish(true)
        }}
      >
        Skip
      </button>
    </div>
  )
}
