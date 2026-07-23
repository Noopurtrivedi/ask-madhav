'use client'

/**
 * KurukshetraMoment — a home for the wide battlefield artwork.
 *
 * The hero used to be a cropped photograph; it is now a 3D figure, and this is
 * where the full Kurukshetra scene (`scene-2`) lives instead — a single quiet,
 * cinematic band that frames *the moment the Gita was spoken*: the two armies
 * drawn up, Arjuna's despair, Krishna as his charioteer. It earns its place by
 * being about the origin of everything the app teaches, rather than sitting as
 * decoration behind the headline.
 *
 * A slow parallax on scroll (the image drifts a touch against the text) and a
 * gold gradient scrim keep the type readable and give the still some life
 * without turning it into a slideshow.
 */

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/lib/motion'

export default function KurukshetraMoment() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // A gentle scroll parallax on the image — written to a CSS var outside React.
  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    let raf: number | null = null
    const read = () => {
      raf = null
      const r = el.getBoundingClientRect()
      // -1..1 as the band crosses the viewport.
      const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight
      el.style.setProperty('--par', (Math.max(-1, Math.min(1, p)) * 28).toFixed(1) + 'px')
    }
    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [reduced])

  return (
    <section className="px-6 py-16">
      <div
        ref={ref}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-gold/20 shadow-2xl shadow-black/50"
        style={{ ['--par' as string]: '0px' }}
      >
        <div className="relative aspect-[16/8] w-full">
          <Image
            src="/art/scene-2.png"
            alt="Krishna, as the charioteer Madhav, delivers the Bhagavad Gita to the warrior Arjuna on the battlefield of Kurukshetra at dawn"
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover object-center will-change-transform"
            style={{ transform: 'translateY(var(--par)) scale(1.08)' }}
          />
          {/* Scrims: darken the lower-left for the text, warm the top edge. */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cosmos-deep/90 via-cosmos-deep/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cosmos-deep/70" />
        </div>

        {/* The caption. */}
        <div className="absolute bottom-0 left-0 max-w-lg p-6 sm:p-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-gold-soft/80">
            Where it was spoken
          </p>
          <h2
            className="mb-3 text-2xl font-bold leading-tight text-moonlight sm:text-3xl"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            The Field of Kurukshetra
          </h2>
          <p className="text-sm leading-relaxed text-moonlight/75">
            Two armies drawn up, a warrior undone by grief, and a charioteer who
            answered him not with orders but with the whole of the Gita. Every
            verse here begins in that moment — bring your own, and Madhav will
            meet you in it.
          </p>
        </div>
      </div>
    </section>
  )
}
