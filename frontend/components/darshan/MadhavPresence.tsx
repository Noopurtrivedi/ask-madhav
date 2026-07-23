'use client'

/**
 * MadhavPresence — the hero's avatar.
 *
 * Madhav is *visible here*: the artwork is the avatar, always rendered, never
 * faded out. An earlier revision replaced him with an abstract orb of light on
 * aniconic grounds; that was the wrong call for this product, which ships
 * Krishna artwork throughout and was specified with a crown, mor pankh and a
 * blessing pose. The engine's job is to bring him alive, not to abstract him
 * away.
 *
 * The avatar is animated on three layers:
 *   1. **Breath** — a slow scale/rise on the artwork itself (CSS, so it costs
 *      nothing and runs on the compositor).
 *   2. **Parallax** — the portrait leans a few pixels against pointer movement,
 *      which is what sells depth inside a flat window.
 *   3. **Atmosphere** — when the device can afford it, a WebGL layer of drifting
 *      light motes and a soft aura sits *behind* him inside the arch.
 *
 * Order of fallback: artwork + atmosphere → artwork + breath → artwork. The
 * artwork always carries the alt text; every animated layer is `aria-hidden`,
 * so the accessible experience is identical in all three cases.
 */

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { useDarshanOptional } from './DarshanProvider'
import { useReducedMotion } from '@/lib/motion'
import { profileOf } from '@/lib/darshan/states'

// ssr:false is required — the scene touches WebGL on import.
const MadhavAvatarScene = dynamic(() => import('./three/MadhavAvatarScene'), {
  ssr: false,
  loading: () => null,
})

/**
 * A lost WebGL context, an out-of-memory GPU, a driver bug — none of it may
 * reach the seeker. Anything thrown below simply removes the atmosphere layer;
 * Madhav himself is untouched, because he is not rendered by WebGL.
 */
class PresenceBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[darshan] atmosphere layer failed; the avatar is unaffected.', error)
    }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function MadhavPresence() {
  const engine = useDarshanOptional()
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)

  const use3D = Boolean(engine?.use3D)
  const palette = engine?.form.color_palette ?? {
    primary: '#F0B830',
    deep: '#12203F',
    accent: '#D4A017',
    glow: '#8FD3D8',
  }
  const energy = engine?.energy ?? 0.3
  const tempo = engine ? profileOf(engine.state).tempo : 1
  const modelUrl = engine?.form.model_url ?? null
  const imageSrc = engine?.config.hero.fallback_image ?? '/art/madhav-avatar.png'
  const imageAlt =
    engine?.config.hero.fallback_image_alt ??
    'Krishna — Madhav — crowned with a peacock feather, raising a hand in teaching, at Kurukshetra'

  // Pointer parallax. Written straight to a CSS variable rather than through
  // React state: this fires on every mousemove and must never cause a render.
  useEffect(() => {
    if (reduced) return
    const el = wrapRef.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      // -1..1 relative to the window's centre, clamped so a pointer far away
      // does not push the portrait to an extreme.
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 2.4)))
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 2.4)))
      el.style.setProperty('--px', (nx * 9).toFixed(2) + 'px')
      el.style.setProperty('--py', (ny * 7).toFixed(2) + 'px')
      el.style.setProperty('--tilt', (nx * 2.2).toFixed(2) + 'deg')
    }
    const onLeave = () => {
      el.style.setProperty('--px', '0px')
      el.style.setProperty('--py', '0px')
      el.style.setProperty('--tilt', '0deg')
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced])

  return (
    <div ref={wrapRef} className="madhav-avatar-wrap">
      {/* Atmosphere behind him — light motes and a soft aura inside the arch. */}
      {use3D && (
        <div className="absolute inset-0" aria-hidden="true">
          <PresenceBoundary>
            <MadhavAvatarScene
              palette={palette}
              energy={energy}
              tempo={tempo}
              modelUrl={modelUrl}
              mode="atmosphere"
            />
          </PresenceBoundary>
        </div>
      )}

      {/* Madhav. Always present, always the accessible description. */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={1123}
        height={1404}
        priority
        sizes="(max-width: 640px) 240px, 292px"
        className={`madhav-avatar-img ${reduced ? '' : 'madhav-breathe'}`}
      />

      {/* Light falling across him from the cosmos behind — sells the compositing. */}
      <div className="madhav-avatar-light" aria-hidden="true" />
    </div>
  )
}
