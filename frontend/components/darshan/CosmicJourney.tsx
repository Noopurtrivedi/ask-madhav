'use client'

/**
 * CosmicJourney — one sky for the whole site.
 *
 * Beyond's obsidian: a flat near-black field with three depths of faint stars
 * that parallax on scroll, so the page reads as travelling without a colour
 * wash competing with the art. The film's galaxy (Hero) is the only colour.
 *
 * One rAF-throttled scroll listener writes `--sy` and every layer is pure CSS,
 * so scrolling never triggers a React render. Star counts scale with the motion
 * tier; under reduced motion it is the plain field, with no listener at all.
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
      root.style.setProperty('--sy', String(window.scrollY))
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

  // A `lite` device gets only the far stars — the parallax layers are the
  // expensive part and the least missed.
  const full = tier === 'full'

  return (
    <div ref={rootRef} className="cosmic-journey" aria-hidden="true">
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

    </div>
  )
}
