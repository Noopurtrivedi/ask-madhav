'use client'

import { PeacockFeather } from '../SacredArt'
import { useReducedMotion } from '@/lib/motion'

/**
 * MorPankh — Krishna's peacock feather, used as a *brand flourish, once*.
 *
 * Three feathers drift diagonally across the hero on first paint and dissolve
 * into it. They do not react to clicks and they do not loop: a feather that
 * flies on every interaction stops being sacred and starts being noise.
 *
 * Reduced motion → a single still feather resting in the corner with a soft
 * glow, so the seeker still gets the emblem without any movement.
 */

interface Drift {
  /** start position, in % of the hero box */
  left: number
  top: number
  /** travel, in viewport units */
  dx: string
  dy: string
  size: number
  rot0: number
  rot1: number
  delay: string
  dur: string
  peak: number
}

const FEATHERS: Drift[] = [
  { left: 74, top: -18, dx: '-32vw', dy: '78vh', size: 78, rot0: 18, rot1: -26, delay: '0.9s', dur: '16s', peak: 0.4 },
  { left: 92, top: 6, dx: '-24vw', dy: '64vh', size: 54, rot0: -12, rot1: 22, delay: '4.2s', dur: '19s', peak: 0.26 },
  { left: 54, top: -26, dx: '-18vw', dy: '86vh', size: 64, rot0: 32, rot1: -8, delay: '8.5s', dur: '18s', peak: 0.22 },
]

export default function MorPankh() {
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute right-[6%] bottom-[12%] opacity-[0.18]">
          <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(232,195,90,0.35),transparent_70%)] blur-xl" />
          <PeacockFeather className="relative w-[70px] h-[190px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {FEATHERS.map((f, i) => (
        <div
          key={i}
          className="mor-pankh absolute"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size * 2.75,
            ['--dx' as string]: f.dx,
            ['--dy' as string]: f.dy,
            ['--r0' as string]: `${f.rot0}deg`,
            ['--r1' as string]: `${f.rot1}deg`,
            ['--peak' as string]: `${f.peak}`,
            animationDelay: f.delay,
            animationDuration: f.dur,
          }}
        >
          <PeacockFeather className="w-full h-full" />
        </div>
      ))}
    </div>
  )
}
