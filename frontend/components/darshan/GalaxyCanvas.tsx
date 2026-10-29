'use client'

/**
 * GalaxyCanvas — the Vishwaroop moment of the hero journey.
 *
 * "Behold, Arjuna, the entire universe — moving and unmoving — gathered here
 * in My body" (Gita 11.7). As the seeker scrolls through the Sudarshan Chakra,
 * a spiral galaxy bursts out of its centre and keeps turning.
 *
 * Every star is generated in code (no footage, no licence question) and drawn
 * on one 2D canvas with additive blending. The parent drives it through a
 * mutable ref — `burst` (0 = all light still inside the chakra, 1 = the full
 * galaxy) and `active` — so scrolling never causes a React render, and the
 * rAF loop sleeps whenever the galaxy is off-screen or not yet revealed.
 */

import { useEffect, useRef, type RefObject } from 'react'

export interface GalaxyDrive {
  /** 0..1 — how far the galaxy has unfolded out of the chakra. */
  burst: number
  /** Draw at all? False while the galaxy is hidden or scrolled away. */
  active: boolean
}

// Core → rim: white-gold heart, gold, rose, then violet / peacock blue arms.
const PALETTE = [
  'rgba(255,250,232,1)',
  'rgba(250,222,150,0.95)',
  'rgba(240,178,126,0.85)',
  'rgba(222,150,200,0.8)',
  'rgba(160,140,255,0.8)',
  'rgba(120,200,240,0.75)',
]

const ARMS = 4
const TWIST = 5.4

function gauss() {
  // Box–Muller, clipped — enough for a soft spread around each arm.
  const u = Math.random() || 1e-6
  const v = Math.random()
  return Math.max(-2.5, Math.min(2.5, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)))
}

export default function GalaxyCanvas({ drive, count }: { drive: RefObject<GalaxyDrive>; count: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // ── Stars, generated once and grouped by colour so the draw loop only
    //    switches fillStyle six times a frame.
    const r = new Float32Array(count)
    const a = new Float32Array(count)
    const s = new Float32Array(count)
    const c = new Uint8Array(count)
    for (let i = 0; i < count; i++) {
      const halo = Math.random() < 0.16
      const rad = halo ? Math.pow(Math.random(), 0.45) : Math.pow(Math.random(), 0.62)
      const arm = (i % ARMS) * ((Math.PI * 2) / ARMS)
      r[i] = rad
      a[i] = halo ? Math.random() * Math.PI * 2 : arm + rad * TWIST + gauss() * (0.3 * (1.08 - rad))
      s[i] = rad < 0.08 ? 2.2 + Math.random() * 2 : 0.9 + Math.random() * (rad < 0.4 ? 2 : 1.5)
      c[i] = rad < 0.07 ? 0 : rad < 0.2 ? 1 : rad < 0.38 ? 2 : rad < 0.55 ? 3 : Math.random() < 0.55 ? 4 : 5
    }
    // A few dozen bright stars with soft halos, scattered along the arms.
    const glints = Array.from({ length: Math.round(count / 70) }, () => {
      const i = Math.floor(Math.random() * count)
      return { i, size: 6 + Math.random() * 10 }
    })
    const order = Array.from({ length: count }, (_, i) => i).sort((x, y) => c[x] - c[y])

    let w = 0
    let h = 0
    let dpr = 1
    const resize = () => {
      // Stars are points of light — a high pixel ratio buys nothing but fill cost.
      dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let raf = 0
    let painted = false
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      const d = drive.current
      if (!d || !d.active) {
        if (painted) {
          ctx.clearRect(0, 0, w, h)
          painted = false
        }
        return
      }
      painted = true
      const burst = d.burst
      const cx = w / 2
      const cy = h / 2
      const R = Math.max(w, h) * 0.44 * (0.12 + 0.88 * burst)
      const spin = t * 0.000045

      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      // Nebula — two slow coloured veils behind the arms, and the bright core.
      const veils: [number, string][] = [
        [spin * 0.6, 'rgba(120,80,220,0.16)'],
        [spin * 0.6 + Math.PI, 'rgba(40,150,190,0.12)'],
      ]
      for (const [ang, col] of veils) {
        const vx = cx + Math.cos(ang) * R * 0.32
        const vy = cy + Math.sin(ang) * R * 0.2
        const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, R * 0.75)
        g.addColorStop(0, col)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.32)
      core.addColorStop(0, `rgba(255,236,190,${0.75 * (0.4 + 0.6 * burst)})`)
      core.addColorStop(0.35, 'rgba(240,190,110,0.28)')
      core.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = core
      ctx.fillRect(0, 0, w, h)

      // Stars — differential rotation (the heart turns faster than the rim),
      // tilted into an ellipse so the galaxy reads as a disc in space.
      let current = -1
      for (let k = 0; k < count; k++) {
        const i = order[k]
        if (c[i] !== current) {
          current = c[i]
          ctx.fillStyle = PALETTE[current]
        }
        const ang = a[i] + spin * (1.9 - r[i])
        const rr = r[i] * R
        const size = s[i]
        ctx.fillRect(cx + Math.cos(ang) * rr - size / 2, cy + Math.sin(ang) * rr * 0.58 - size / 2, size, size)
      }
      for (const { i, size } of glints) {
        const ang = a[i] + spin * (1.9 - r[i])
        const gx = cx + Math.cos(ang) * r[i] * R
        const gy = cy + Math.sin(ang) * r[i] * R * 0.58
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, size)
        g.addColorStop(0, 'rgba(255,246,220,0.9)')
        g.addColorStop(1, 'rgba(255,246,220,0)')
        ctx.fillStyle = g
        ctx.fillRect(gx - size, gy - size, size * 2, size * 2)
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [count, drive])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
}
