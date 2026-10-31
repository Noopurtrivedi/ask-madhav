'use client'

/**
 * FloatingOfferings — lotus and mor pankh adrift over the obsidian page.
 *
 * Real photographic cut-outs fall slowly along the page margins and tumble in
 * 3D. Scrolling is the wind: a fast scroll gusts them along with it and sets
 * them spinning, then they settle back to their own quiet fall.
 *
 * One rAF loop writes transforms only. It is hidden over the hero film, whose
 * ivory the cut-outs were not matted for, and sleeps there. `lite` gets three,
 * and reduced motion or the `still` tier gets none: this layer is decoration.
 */

import { useEffect, useRef } from 'react'
import { useDarshanOptional } from './DarshanProvider'
import { useReducedMotion } from '@/lib/motion'

interface Offering {
  src: string
  /** Horizontal home, fraction of the viewport. Kept to the margins. */
  x: number
  /** Starting height, fraction of the viewport. */
  y: number
  /** Width in px. */
  w: number
  /** 0..1: nearer offerings fall faster and catch more of the wind. */
  depth: number
  phase: number
}

const LOTUS = '/art/lotus.webp'
const FEATHER = '/art/feather.webp'

const OFFERINGS: Offering[] = [
  { src: FEATHER, x: 0.05, y: 0.1, w: 64, depth: 0.8, phase: 0.4 },
  { src: LOTUS, x: 0.93, y: 0.3, w: 92, depth: 0.7, phase: 2.1 },
  { src: FEATHER, x: 0.95, y: 0.75, w: 48, depth: 0.4, phase: 3.7 },
  { src: LOTUS, x: 0.03, y: 0.62, w: 66, depth: 0.45, phase: 1.2 },
  { src: FEATHER, x: 0.12, y: 1.0, w: 38, depth: 0.25, phase: 5.0 },
  { src: LOTUS, x: 0.87, y: 0.02, w: 48, depth: 0.25, phase: 4.3 },
  { src: FEATHER, x: 0.84, y: 1.15, w: 54, depth: 0.55, phase: 2.9 },
]

const WRAP = 1.5 // viewport heights: one sprite's travel before it re-enters.

export default function FloatingOfferings() {
  const engine = useDarshanOptional()
  const reduced = useReducedMotion()
  const tier = engine?.tier ?? 'lite'
  const count = reduced || tier === 'still' ? 0 : tier === 'full' ? OFFERINGS.length : 3
  const shown = OFFERINGS.slice(0, count)
  const refs = useRef<(HTMLImageElement | null)[]>([])

  useEffect(() => {
    if (!count) return
    const ys = shown.map((o) => o.y)
    const spin = shown.map(() => 0)
    let raf = 0
    let last = performance.now()
    let lastScroll = window.scrollY
    let gust = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const scroll = window.scrollY
      const delta = scroll - lastScroll
      lastScroll = scroll
      if (document.documentElement.hasAttribute('data-hero-covers')) return

      gust += (delta / window.innerHeight - gust) * 0.12
      const W = window.innerWidth
      const H = window.innerHeight
      const t = now / 1000
      shown.forEach((o, i) => {
        const el = refs.current[i]
        if (!el) return
        // Scrolling down carries them up the screen with the page, and back.
        ys[i] += (0.018 + 0.03 * o.depth) * dt - gust * (0.4 + o.depth) * 0.4
        ys[i] = ((ys[i] + 0.25) % WRAP + WRAP) % WRAP - 0.25
        spin[i] += gust * 240 * o.depth
        const sway = Math.sin(t * 0.32 + o.phase) * (18 + 26 * o.depth)
        const px = o.x * W + sway - o.w / 2
        const py = ys[i] * H
        const rz = Math.sin(t * 0.22 + o.phase) * 24 + spin[i]
        const rx = Math.sin(t * 0.4 + o.phase * 2) * 48
        const ry = Math.cos(t * 0.31 + o.phase) * 52
        el.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) perspective(700px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotateZ(${rz.toFixed(1)}deg)`
      })
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // `shown` is derived from `count`, so `count` is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  if (!count) return null
  return (
    <div className="offerings" aria-hidden="true">
      {shown.map((o, i) => (
        // Plain <img>: a transparent sprite this small gains nothing from next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          src={o.src}
          alt=""
          width={o.w}
          loading="lazy"
          decoding="async"
          className="offering"
          style={{ width: o.w, opacity: 0.55 + 0.4 * o.depth }}
        />
      ))}
    </div>
  )
}
