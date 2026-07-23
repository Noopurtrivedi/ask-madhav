'use client'

/**
 * CosmicJourney — one sky for the whole site, and it *travels*.
 *
 * A single fixed layer behind every page. As the seeker scrolls, three things
 * happen at once:
 *
 *  1. **The scenery changes.** Five cosmic "scenes" are stacked and cross-faded
 *     across the scroll — deep space → a peacock nebula → a violet field →
 *     a warm golden expanse → the still deep again. You never scroll past the
 *     sky; you move *through* it.
 *  2. **The stars parallax.** Three depths drift at different rates, which is
 *     what actually produces the sensation of travelling rather than of a
 *     background sliding by.
 *  3. **Nebulae drift** slowly and independently of scroll, so the sky is alive
 *     even when the page is still.
 *
 * ── How it stays cheap ────────────────────────────────────────────────────
 * One rAF-throttled scroll listener writes two custom properties (`--sy`,
 * `--sp`) and nothing else; every layer is pure CSS driven off those, so
 * scrolling never triggers a React render. Only `transform` and `opacity`
 * animate, so it all stays on the compositor. Star counts scale with the
 * engine's motion tier, and under reduced motion the whole thing collapses to a
 * single static gradient with no listener attached at all.
 */

import { useEffect, useRef } from 'react'
import { useDarshanOptional } from './DarshanProvider'
import { useReducedMotion } from '@/lib/motion'

/** Deterministic seeded RNG — server and client must generate identical stars. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

interface Star {
  left: number
  top: number
  size: number
  opacity: number
  delay: number
  dur: number
}

function makeStars(count: number, seed: number): Star[] {
  const rand = seeded(seed)
  return Array.from({ length: count }, () => ({
    left: +(rand() * 100).toFixed(2),
    top: +(rand() * 100).toFixed(2),
    size: +(0.8 + rand() * 1.8).toFixed(2),
    opacity: +(0.2 + rand() * 0.55).toFixed(2),
    delay: +(rand() * 8).toFixed(2),
    dur: +(3 + rand() * 5).toFixed(2),
  }))
}

/**
 * Three depths. The near layer is sparse and large, the far layer dense and
 * fine — the same cue a real night sky gives, and the reason the parallax reads
 * as distance rather than as two things sliding.
 */
const FAR = makeStars(110, 20470428)
const MID = makeStars(58, 71828182)
const NEAR = makeStars(26, 31415926)

function StarLayer({ stars, depth, twinkle }: { stars: Star[]; depth: number; twinkle: boolean }) {
  return (
    <div
      className="cosmic-stars absolute inset-0"
      style={{ ['--depth' as string]: depth }}
      aria-hidden="true"
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className={twinkle ? 'star absolute rounded-full bg-moonlight' : 'absolute rounded-full bg-moonlight'}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            ['--star-min' as string]: `${s.opacity}`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function CosmicJourney() {
  const engine = useDarshanOptional()
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const tier = engine?.tier ?? 'lite'

  useEffect(() => {
    if (reduced) return
    const root = rootRef.current
    if (!root) return

    let raf: number | null = null
    const read = () => {
      raf = null
      const y = window.scrollY
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      root.style.setProperty('--sy', String(y))
      root.style.setProperty('--sp', (y / max).toFixed(4))
    }
    const onScroll = () => {
      // Coalesce to one write per frame — scroll fires far faster than paint.
      if (raf == null) raf = requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [reduced])

  // Stillness gets the sky, just not the journey.
  if (reduced) {
    return <div className="cosmic-journey cosmic-journey-still" aria-hidden="true" />
  }

  // A `lite` device gets the scenery and the nebulae but only the far stars —
  // the parallax layers are the expensive part and the least missed.
  const full = tier === 'full'

  return (
    <div ref={rootRef} className="cosmic-journey" aria-hidden="true">
      {/* The five scenes, cross-faded across the scroll. */}
      <div className="cosmic-scene cosmic-scene-1" />
      <div className="cosmic-scene cosmic-scene-2" />
      <div className="cosmic-scene cosmic-scene-3" />
      <div className="cosmic-scene cosmic-scene-4" />
      <div className="cosmic-scene cosmic-scene-5" />

      {/* Nebulae — drifting on their own clock, so the sky lives while you read. */}
      <div className="cosmic-nebula cosmic-nebula-a" />
      <div className="cosmic-nebula cosmic-nebula-b" />
      {full && <div className="cosmic-nebula cosmic-nebula-c" />}

      {/* Depth. */}
      <StarLayer stars={FAR} depth={0.06} twinkle />
      {full && <StarLayer stars={MID} depth={0.16} twinkle />}
      {full && <StarLayer stars={NEAR} depth={0.32} twinkle={false} />}

      {/* A rare shooting star. Long interval on purpose — a sky that streaks
          every few seconds is a screensaver, not a darshan. */}
      {full && (
        <>
          <span className="cosmic-shooting cosmic-shooting-a" />
          <span className="cosmic-shooting cosmic-shooting-b" />
        </>
      )}

      {/* A soft vignette keeps text legible over the brightest scenes. */}
      <div className="cosmic-vignette" />
    </div>
  )
}
