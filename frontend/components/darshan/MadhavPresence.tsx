'use client'

/**
 * MadhavPresence — the hero's avatar.
 *
 * Madhav stands here as a **stylised 3D figure** (three/KrishnaFigure.tsx):
 * crown, mor pankh, flute, tribhanga stance, aura — real geometry in the scene,
 * with a camera that drifts and answers the pointer. Faceless by the app's
 * safety constraint; recognisable by silhouette. A commissioned photoreal GLB
 * swaps in via `avatar_forms.model_url` when one exists (docs/ASSETS.md).
 *
 * Fallback ladder: 3D figure (full tier) → the faceless `DivineSilhouette`
 * (SVG, any tier, no WebGL). The Kurukshetra photograph is no longer in the
 * hero at all — it features in its own section. A screen reader always gets a
 * plain sentence; every visual layer is aria-hidden.
 */

import dynamic from 'next/dynamic'
import { DivineSilhouette } from './CosmicForms'
import { Component, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useDarshanOptional } from './DarshanProvider'
import { useReducedMotion } from '@/lib/motion'
import { darshanNotReady, isDarshanReady, subscribeDarshanReady } from '@/lib/darshan-launch'
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

  // The arrival must begin when the hero is actually visible — i.e. when the
  // chakra has landed and the veil lifted — otherwise Madhav resolves behind
  // the veil and the seeker misses the whole descent. Same subscription Hero
  // uses, so the two cannot drift apart.
  const landed = useSyncExternalStore(subscribeDarshanReady, isDarshanReady, darshanNotReady)
  const [failsafe, setFailsafe] = useState(false)
  useEffect(() => {
    // Must outlast the launch ritual (~7s). If this fires first, the hero
    // reveals — and Madhav's arrival plays — while the veil is still up, and the
    // seeker misses the entire descent. It is a failsafe, not a schedule.
    const t = window.setTimeout(() => setFailsafe(true), 9000)
    return () => clearTimeout(t)
  }, [])
  // Reduced motion gets him immediately and fully — no descent, no delay.
  const arriving = !reduced && (landed || failsafe)

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
              // A stylised 3D Krishna figure — crown, mor pankh, flute,
              // tribhanga stance — standing *in* the scene, not a photo plane.
              // See three/KrishnaFigure.tsx. (`scene` mode, which places the
              // artwork on a plane, is kept for the commissioned-GLB fallback.)
              mode="figure"
            />
          </PresenceBoundary>
        </div>
      )}

      {/* The light that carries him in. */}
      {!reduced && (
        <div
          className={`darshan-arrival-light ${arriving ? 'is-arriving' : ''}`}
          aria-hidden="true"
        />
      )}

      {/* The no-WebGL presence: the faceless divine silhouette, not the
          photograph. The Kurukshetra artwork was moved out of the hero (it now
          features in its own section); on a device that can't run the 3D figure,
          the silhouette carries the hero instead — on-theme, and license-clean
          at every tier. */}
      {!use3D && (
        <div className={`madhav-figure ${arriving ? 'is-arriving' : ''}`} aria-hidden="true">
          <DivineSilhouette
            className="absolute inset-0 h-full w-full"
            color="#8FD3D8"
            glow="#3A4FA8"
            opacity={0.85}
          />
        </div>
      )}

      {/* The accessible description — Madhav is a visual presence, so a screen
          reader gets a plain sentence rather than any of the animated layers. */}
      <span className="sr-only">{imageAlt}</span>

      {/* Light falling across him from the cosmos behind — sells the compositing. */}
      {use3D && <div className="madhav-avatar-light" aria-hidden="true" />}
    </div>
  )
}
