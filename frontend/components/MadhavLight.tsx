'use client'

import { useEffect, useRef } from 'react'

/**
 * MadhavLight — Madhav rendered as *living light*, not a face.
 *
 * The Gita calls the Self "jyotiṣām api taj jyotiḥ" — "the light of all lights,
 * beyond all darkness" (13.17). We deliberately do NOT depict the divine as a
 * person (a face invites idol-dependency, which the app's safety constraint
 * forbids). Instead Madhav is a warm luminous presence: it breathes softly at
 * rest and *awakens* when he speaks, its radiance pulsing in rhythm with his
 * voice — the spoken guidance made visible.
 *
 * Voice reactivity is decoupled via a window event bus (mirrors the existing
 * `madhav:prefill` idiom): while an answer is read aloud, `SpeakButton`
 * dispatches `madhav:voice` events carrying `{ id, level, active }`, and the
 * light whose `id` matches reacts. Nothing is threaded through the React tree.
 *
 * Fail-open + accessible: with no audio — or under `prefers-reduced-motion` —
 * the light simply rests as a calm static glow. Nothing hard-fails.
 */
interface Props {
  /** The message id this light belongs to — matched against voice events. */
  id?: string
  /** Diameter of the luminous core in px (the bloom extends beyond it). */
  size?: number
  /** Start gently awake — used by the "thinking" loading indicator. */
  thinking?: boolean
}

type VoiceDetail = { id?: string; level?: number; active?: boolean }

export default function MadhavLight({ id, size = 32, thinking = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const targetRef = useRef(0) // where the glow wants to be (0..1)
  const currentRef = useRef(0) // smoothed glow actually rendered
  const activeRef = useRef(false)
  const phaseRef = useRef(0) // sine phase for the amplitude-less shimmer

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const set = (v: number) => root.style.setProperty('--glow', v.toFixed(3))

    // Reduced motion → a calm, static glow with no animation or voice reactivity.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      set(0.5)
      return
    }

    const loop = () => {
      // Speaking but no amplitude arriving (browser-voice fallback has none) →
      // breathe a lively sine so the light still feels alive and present.
      if (activeRef.current && targetRef.current <= 0.001) {
        phaseRef.current += 0.08
        targetRef.current = 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(phaseRef.current))
      }
      // Ease toward the target: fast attack, gentler release — feels organic.
      const t = targetRef.current
      const k = t > currentRef.current ? 0.4 : 0.12
      currentRef.current += (t - currentRef.current) * k
      set(currentRef.current)

      if (activeRef.current || currentRef.current > 0.01) {
        rafRef.current = requestAnimationFrame(loop)
      } else {
        rafRef.current = null
        set(0) // fully at rest → the CSS idle breathe takes over
      }
    }

    const wake = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(loop)
    }

    const onVoice = (e: Event) => {
      const d = (e as CustomEvent<VoiceDetail>).detail
      if (!d || d.id !== id) return
      if (typeof d.active === 'boolean') activeRef.current = d.active
      if (typeof d.level === 'number') {
        targetRef.current = Math.max(0, Math.min(1, d.level))
      }
      if (!activeRef.current) {
        targetRef.current = 0
        phaseRef.current = 0
      }
      wake()
    }

    window.addEventListener('madhav:voice', onVoice)
    if (thinking) {
      activeRef.current = true
      wake()
    }

    return () => {
      window.removeEventListener('madhav:voice', onVoice)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [id, thinking])

  const px = `${size}px`
  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="madhav-light select-none"
      style={{ width: px, height: px, ['--glow' as string]: '0' }}
    >
      {/* outer bloom — spills well beyond the box, brightens with the voice */}
      <span className="madhav-bloom" />
      {/* mid halo */}
      <span className="madhav-halo" />
      {/* bright core */}
      <span className="madhav-core" />
    </div>
  )
}
