'use client'

/**
 * DivineShadow — the form behind Madhav while he speaks.
 *
 * The effect this reproduces: a translucent divine silhouette rising behind the
 * figure in the foreground, so the mortal frame and the vastness behind it are
 * visible at once. Here it is bound to *speech* — it swells while Madhav is
 * answering and recedes when he is done, so the seeker sees the depth behind
 * the words exactly when the words are arriving.
 *
 * Two triggers, either of which is enough:
 *   · the engine's `answering` / `blessing` states (a reply is on screen), and
 *   · the `madhav:voice` bus, which `SpeakButton` already drives with live
 *     amplitude while an answer is read aloud — so when Madhav is *literally*
 *     speaking, the form pulses on his voice.
 *
 * It is deliberately faint and slow. This sits behind body text that people are
 * reading; the moment it competes with the words it has failed. Reduced motion
 * removes it entirely rather than freezing it, because a static silhouette
 * behind a paragraph is just clutter.
 */

import { useEffect, useRef, useState } from 'react'
import { DivineSilhouette } from './CosmicForms'
import { useDarshanOptional } from './DarshanProvider'
import { useReducedMotion } from '@/lib/motion'

type VoiceDetail = { id?: string; level?: number; active?: boolean }

interface Props {
  /** Peak opacity. Keep low — there is text in front of this. */
  intensity?: number
  className?: string
}

export default function DivineShadow({ intensity = 0.3, className = '' }: Props) {
  const engine = useDarshanOptional()
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [speaking, setSpeaking] = useState(false)

  const state = engine?.state
  const engineActive = state === 'answering' || state === 'blessing' || state === 'thinking'

  // Live voice amplitude → a CSS variable, written outside React so the ~60
  // events per second of an amplitude stream never trigger a render.
  useEffect(() => {
    if (reduced) return
    const root = rootRef.current
    if (!root) return

    let raf: number | null = null
    let target = 0
    let current = 0

    const loop = () => {
      current += (target - current) * 0.12
      root.style.setProperty('--voice', current.toFixed(3))
      if (current > 0.005 || target > 0.005) {
        raf = requestAnimationFrame(loop)
      } else {
        raf = null
        root.style.setProperty('--voice', '0')
      }
    }

    const onVoice = (e: Event) => {
      const d = (e as CustomEvent<VoiceDetail>).detail
      if (!d) return
      if (typeof d.active === 'boolean') setSpeaking(d.active)
      target = d.active === false ? 0 : Math.max(0, Math.min(1, d.level ?? 0.4))
      if (raf == null) raf = requestAnimationFrame(loop)
    }

    window.addEventListener('madhav:voice', onVoice)
    return () => {
      window.removeEventListener('madhav:voice', onVoice)
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [reduced])

  // Stillness means stillness — no ghost behind the text.
  if (reduced) return null

  const visible = speaking || engineActive

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`divine-shadow ${visible ? 'is-present' : ''} ${className}`}
      style={{ ['--peak' as string]: intensity }}
    >
      <DivineSilhouette color="#8FD3D8" glow="#3A4FA8" opacity={1} className="h-full w-full" />
    </div>
  )
}
