'use client'

/**
 * DashavatarOrbit — the ten descents as a living, touchable ring.
 *
 * Ten portraits orbit the cosmic form. The whole stage tilts with the pointer,
 * so the ring has real depth. Touching a descent stops the orbit and brings that
 * form to the centre with its name and meaning; the arrow keys walk the ring in
 * order. "Behold the one form" gathers all ten inward — the descents returning
 * to the one they were always part of.
 *
 * The orbit is a CSS animation (compositor only); the pointer writes two custom
 * properties and never renders React. Under reduced motion the ring holds still
 * and everything stays reachable: only the motion goes, never the content.
 *
 * Portraits are original FLUX.1 [schnell] renders, docs/AVATAR.md.
 */

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { DASHAVATAR } from './Dashavatar'

interface Props {
  /** Reveal progress for the arrivals, 0..1. */
  arrival: number
  /** The ten have gathered into the one form. */
  gathered: boolean
  reduced: boolean
  onGather: () => void
  /** Any deliberate interaction: keeps the bounded reveal open. */
  onTouch: () => void
}

const portrait = (id: string) => `/art/dash/${id}.jpg`

export default function DashavatarOrbit({ arrival, gathered, reduced, onGather, onTouch }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = selected === null ? null : DASHAVATAR[selected]
  const count = DASHAVATAR.length

  // Pointer → tilt, at most once a frame.
  useEffect(() => {
    if (reduced) return
    const root = rootRef.current
    if (!root) return
    let raf = 0
    let x = 0
    let y = 0
    const onMove = (e: PointerEvent) => {
      x = e.clientX / window.innerWidth - 0.5
      y = e.clientY / window.innerHeight - 0.5
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        root.style.setProperty('--px', x.toFixed(3))
        root.style.setProperty('--py', y.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduced])

  // The arrow keys walk the ring, starting from wherever the seeker is.
  useEffect(() => {
    if (gathered) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      onTouch()
      const step = e.key === 'ArrowRight' ? 1 : -1
      setSelected((s) => (s === null ? (step > 0 ? 0 : count - 1) : (s + step + count) % count))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gathered, count, onTouch])

  const choose = (i: number) => {
    onTouch()
    setSelected((s) => (s === i ? null : i))
  }

  return (
    <div
      ref={rootRef}
      className={`orbit-root ${gathered ? 'orbit-gathered' : ''} ${selected !== null ? 'orbit-held' : ''}`}
    >
      {active && !gathered && (
        <div key={`bg-${active.id}`} className="orbit-bloom" aria-hidden="true">
          <Image src={portrait(active.id)} alt="" fill sizes="50vw" className="object-cover" />
        </div>
      )}

      <div className="orbit-stage">
        <span className="orbit-halo orbit-halo-1" aria-hidden="true" />
        <span className="orbit-halo orbit-halo-2" aria-hidden="true" />

        {/* The centre: the one form, or the descent the seeker has touched. */}
        <div className="orbit-centre">
          <div className={`orbit-disc ${active && !gathered ? 'orbit-disc-dim' : ''}`} aria-hidden="true">
            <Image src={portrait('vishwaroop-viraat')} alt="" fill sizes="(min-width: 768px) 60vh, 80vw" className="object-cover object-[50%_30%]" priority />
          </div>
          {active && !gathered && (
            <div key={active.id} className="orbit-disc orbit-disc-form" aria-hidden="true">
              <Image src={portrait(active.id)} alt="" fill sizes="(min-width: 768px) 60vh, 80vw" className="object-cover" />
            </div>
          )}
          <div className="orbit-caption" aria-live="polite">
            {active && !gathered ? (
              <div key={active.id}>
                <p className="font-display text-[clamp(1.5rem,3.6vh,2.25rem)] font-semibold leading-none text-moonlight">
                  {active.name}
                </p>
                <p className="mt-1 text-sm text-gold-soft" lang="sa" style={{ fontFamily: 'var(--font-sanskrit), var(--font-hindi), serif' }}>
                  {active.sanskrit}
                </p>
                <p className="mx-auto mt-2 max-w-[17rem] text-[0.82rem] leading-snug text-moonlight/85">{active.meaning}</p>
              </div>
            ) : !gathered ? (
              <p className="text-xs uppercase tracking-[0.22em] text-moonlight/70">Touch a form to behold it</p>
            ) : null}
          </div>
        </div>

        <div className="orbit-ring">
          {DASHAVATAR.map((glyph, i) => {
            const angle = (i / count) * 360 + 180 / count
            const shown = reduced || arrival >= (i / count) * 0.9
            return (
              <div key={glyph.id} className="orbit-seat" style={{ ['--a' as string]: `${angle}deg` }}>
                <div className="orbit-counter">
                  <button
                    type="button"
                    onClick={() => choose(i)}
                    aria-pressed={selected === i}
                    aria-label={`${glyph.name}: ${glyph.meaning}`}
                    tabIndex={shown && !gathered ? 0 : -1}
                    className={`orbit-medal ${shown ? 'orbit-medal-in' : ''} ${selected === i ? 'orbit-medal-on' : ''}`}
                  >
                    <span className="orbit-medal-art">
                      <Image src={portrait(glyph.id)} alt="" fill sizes="110px" className="object-cover" />
                    </span>
                    <span className="orbit-medal-name">{glyph.name}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {!gathered && arrival >= 0.9 && (
        <button type="button" onClick={onGather} className="btn-leaf orbit-gather px-6 py-3">
          Behold the one form
        </button>
      )}
    </div>
  )
}
