'use client'

/**
 * MadhavPresence — the hero's avatar stage.
 *
 * Decides *what* stands in the darshan window, in this order:
 *   1. the 3D presence — only when the engine reports `full` tier with working
 *      WebGL, and only after hydration (the bundle is dynamically imported, so
 *      a phone on Data Saver never downloads three.js at all);
 *   2. the existing Kurukshetra artwork — the static hero fallback, which is
 *      also the poster shown underneath while the canvas warms up;
 *   3. the artwork again, if the 3D layer throws for any reason.
 *
 * The artwork is always rendered and always carries the alt text. The canvas is
 * `aria-hidden` decoration layered over it, so the accessible experience is
 * identical in all three cases and a screen reader never hears about WebGL.
 */

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Component, useEffect, useState, type ReactNode } from 'react'
import { useDarshanOptional } from './DarshanProvider'
import { profileOf } from '@/lib/darshan/states'

// ssr:false is required — the scene touches WebGL on import.
const MadhavAvatarScene = dynamic(() => import('./three/MadhavAvatarScene'), {
  ssr: false,
  loading: () => null,
})

/**
 * A lost WebGL context, an out-of-memory GPU, a driver bug — none of it may
 * reach the seeker. Anything thrown below drops us to the static artwork.
 */
class PresenceBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    // Never throw from the handler itself; the hero must survive.
    if (process.env.NODE_ENV === 'development') {
      console.warn('[darshan] 3D presence failed, using the static hero.', error)
    }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function MadhavPresence() {
  const engine = useDarshanOptional()
  const [canvasReady, setCanvasReady] = useState(false)

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
  const imageSrc = engine?.config.hero.fallback_image ?? '/art/scene-2.png'
  const imageAlt =
    engine?.config.hero.fallback_image_alt ??
    'Krishna, as the charioteer Madhav, delivers the Bhagavad Gita to the warrior Arjuna on the battlefield of Kurukshetra at dawn'

  // Cross-fade the artwork out once the canvas has had a frame to paint —
  // swapping instantly shows a single black frame on some GPUs.
  useEffect(() => {
    if (!use3D) {
      setCanvasReady(false)
      return
    }
    const t = setTimeout(() => setCanvasReady(true), 420)
    return () => clearTimeout(t)
  }, [use3D])

  return (
    <>
      {/* The static hero: always present, always the accessible description. */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={1536}
        height={1024}
        priority
        sizes="(max-width: 640px) 240px, 292px"
        className={`h-full w-full scale-[1.35] object-cover object-[62%_28%] transition-opacity duration-1000 ${
          canvasReady ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {use3D && (
        <div className="absolute inset-0" aria-hidden="true">
          <PresenceBoundary>
            <MadhavAvatarScene
              palette={palette}
              energy={energy}
              tempo={tempo}
              modelUrl={modelUrl}
            />
          </PresenceBoundary>
        </div>
      )}
    </>
  )
}
