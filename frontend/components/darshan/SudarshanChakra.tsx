'use client'

import { useEffect, useId, useRef } from 'react'
import { useReducedMotion } from '@/lib/motion'

/**
 * SudarshanChakra — Ask Madhav's brand signature.
 *
 * A pure-SVG discus (no images, no 3D, no dependencies) whose rotation is
 * driven by a single requestAnimationFrame loop writing `transform` on two
 * counter-rotating groups plus a `--chakra-glow` custom property (the same
 * rAF + CSS-variable idiom `MadhavLight` uses for the voice).
 *
 * Speed and glow *ease* toward the target for the current state rather than
 * snapping, so a state change reads as the chakra gathering or releasing
 * momentum — never as a jump. That is why rotation is not a CSS animation:
 * `animation-duration` cannot be interpolated.
 *
 * Reduced motion → the discus is drawn perfectly still with a calm glow.
 */

/** Every visual behaviour of the chakra is a function of app state, never ad-hoc. */
export type ChakraState =
  /** at rest — a slow, meditative turn */
  | 'idle'
  /** Madhav is thinking — the discus spins bright and fast */
  | 'processing'
  /** the answer has begun — the discus slows back down */
  | 'settling'
  /** completely still (used for print / static contexts) */
  | 'still'

/** Degrees per second for each state. */
const SPEED: Record<ChakraState, number> = {
  idle: 7,
  processing: 190,
  settling: 34,
  still: 0,
}

/** Glow intensity (0..1) for each state — drives the CSS drop-shadow. */
const GLOW: Record<ChakraState, number> = {
  idle: 0.25,
  processing: 1,
  settling: 0.55,
  still: 0.2,
}

interface Props {
  /** Rendered width & height in px. */
  size?: number
  /** Which behaviour to express. Defaults to a slow idle turn. */
  state?: ChakraState
  className?: string
  /** Accessible label. Omit (default) to treat the chakra as decoration. */
  title?: string
}

const BLADES = 36
const rad = (deg: number) => (deg * Math.PI) / 180
/** Fixed-precision coordinates — Node and the browser must serialise floats
 *  identically or React reports a hydration mismatch on every spoke. */
const x = (r: number, deg: number) => (100 + r * Math.cos(rad(deg))).toFixed(3)
const y = (r: number, deg: number) => (100 + r * Math.sin(rad(deg))).toFixed(3)
const pt = (r: number, deg: number) => `${x(r, deg)},${y(r, deg)}`

/** The serrated outer rim — 36 blades of light. */
const BLADE_PATH = Array.from({ length: BLADES }, (_, i) => {
  const a = (i * 360) / BLADES
  const half = ((360 / BLADES) / 2) * 0.82
  return `M ${pt(79, a - half)} L ${pt(97, a)} L ${pt(79, a + half)} Z`
}).join(' ')

export default function SudarshanChakra({
  size = 64,
  state = 'idle',
  className = '',
  title,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const rootRef = useRef<SVGSVGElement>(null)
  const outerRef = useRef<SVGGElement>(null)
  const innerRef = useRef<SVGGElement>(null)
  const angleRef = useRef(0)
  const speedRef = useRef(0)
  const glowRef = useRef(GLOW.idle)
  const reduced = useReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    const outer = outerRef.current
    const inner = innerRef.current
    if (!root || !outer || !inner) return

    // Reduced motion (or a deliberately still chakra) → paint once, no loop.
    if (reduced || state === 'still') {
      root.style.setProperty('--chakra-glow', GLOW[state].toFixed(2))
      return
    }

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      // Clamp dt so a backgrounded tab doesn't resume with a violent jolt.
      const dt = Math.min(64, now - last)
      last = now

      // Exponential ease toward the state's speed & glow — momentum, not a snap.
      speedRef.current += (SPEED[state] - speedRef.current) * Math.min(1, dt / 520)
      glowRef.current += (GLOW[state] - glowRef.current) * Math.min(1, dt / 380)
      angleRef.current = (angleRef.current + (speedRef.current * dt) / 1000) % 360

      const a = angleRef.current
      outer.setAttribute('transform', `rotate(${a.toFixed(2)} 100 100)`)
      inner.setAttribute('transform', `rotate(${(-a * 0.62).toFixed(2)} 100 100)`)
      root.style.setProperty('--chakra-glow', glowRef.current.toFixed(3))

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state, reduced])

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`chakra ${className}`}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ ['--chakra-glow' as string]: GLOW[state].toFixed(2) }}
    >
      <defs>
        <radialGradient id={`${uid}-hub`} cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#FFFBEC" />
          <stop offset="55%" stopColor="#F3DE9B" />
          <stop offset="100%" stopColor="#D4A017" />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F6E3A8" />
          <stop offset="48%" stopColor="#E8C35A" />
          <stop offset="100%" stopColor="#C88A10" />
        </linearGradient>
      </defs>

      {/* Outer disc — blades + rings, turning forward */}
      <g ref={outerRef}>
        <path d={BLADE_PATH} fill={`url(#${uid}-rim)`} />
        <circle cx="100" cy="100" r="79" fill="none" stroke={`url(#${uid}-rim)`} strokeWidth="5" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="#F6E3A8" strokeOpacity="0.55" strokeWidth="1.5" />
        {/* 24 fine rim studs */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i * 360) / 24
          return (
            <circle
              key={i}
              cx={x(74.5, a)}
              cy={y(74.5, a)}
              r="1.6"
              fill="#FFF6D8"
              fillOpacity="0.8"
            />
          )
        })}
      </g>

      {/* A whisper of shadow inside the rim so the gold reads on any ground */}
      <circle cx="100" cy="100" r="70" fill="#0A0E2A" fillOpacity="0.28" />

      {/* Inner wheel — spokes + lotus hub, turning against the rim for depth */}
      <g ref={innerRef}>
        <circle cx="100" cy="100" r="60" fill="none" stroke="#E8C35A" strokeOpacity="0.35" strokeWidth="1" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 360) / 12
          return (
            <line
              key={i}
              x1={x(26, a)}
              y1={y(26, a)}
              x2={x(62, a)}
              y2={y(62, a)}
              stroke={`url(#${uid}-rim)`}
              strokeWidth="3"
              strokeLinecap="round"
            />
          )
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 360) / 12 + 15
          return (
            <line
              key={`f${i}`}
              x1={x(34, a)}
              y1={y(34, a)}
              x2={x(60, a)}
              y2={y(60, a)}
              stroke="#F6E3A8"
              strokeOpacity="0.4"
              strokeWidth="1"
              strokeLinecap="round"
            />
          )
        })}
        {/* eight-petal lotus at the heart of the discus */}
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={`p${i}`}
            d="M100 100 C107 84 107 70 100 56 C93 70 93 84 100 100 Z"
            fill="#F3DE9B"
            fillOpacity="0.62"
            transform={`rotate(${i * 45} 100 100)`}
          />
        ))}
      </g>

      {/* Still hub — the calm centre the whole discus turns around */}
      <circle cx="100" cy="100" r="20" fill="none" stroke={`url(#${uid}-rim)`} strokeWidth="2.5" />
      <circle cx="100" cy="100" r="13" fill={`url(#${uid}-hub)`} />
    </svg>
  )
}
