'use client'

import Image from 'next/image'
import Link from 'next/link'

/**
 * ThreePaths — the Gita's three yogas as three illustrated cards, directly
 * after the hero's Vishwaroop moment: the universe has opened, now choose the
 * way in. Each card reads its verse and can hand the path to Madhav.
 *
 * Art is the existing Kurukshetra set (public/art), cropped differently per
 * card — no new assets.
 */

const PATHS = [
  {
    yoga: 'Karma Yoga',
    chapter: 'Chapter 3',
    title: 'The Path of Action',
    line: 'Do the work in front of you with your whole heart — and set down your grip on the result.',
    ref: '2.47',
    art: '/art/scene-2.png',
    focus: '62% 40%',
    ask: 'Teach me Karma Yoga — how do I act fully without being attached to the outcome?',
  },
  {
    yoga: 'Jnana Yoga',
    chapter: 'Chapter 4',
    title: 'The Path of Knowledge',
    line: 'Nothing in this world purifies like true understanding. See clearly, and fear loosens.',
    ref: '4.38',
    art: '/art/scene-1.png',
    focus: '50% 30%',
    ask: 'Teach me Jnana Yoga — how does knowing who I truly am bring peace?',
  },
  {
    yoga: 'Bhakti Yoga',
    chapter: 'Chapter 12',
    title: 'The Path of Devotion',
    line: 'Rest your mind in what is highest. Love, offered fully, is itself the way.',
    ref: '12.8',
    art: '/art/scene-3.png',
    focus: '45% 45%',
    ask: 'Teach me Bhakti Yoga — what does devotion look like in an ordinary day?',
  },
]

function askAbout(question: string) {
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  window.dispatchEvent(new CustomEvent('madhav:prefill', { detail: { question } }))
}

export default function ThreePaths() {
  return (
    <section id="three-paths" className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 grid items-end gap-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow eyebrow-left mb-5">Three yogas · one truth</p>
            <h2 className="section-title">
              Three paths to the
              <br />
              <em className="gold-leaf">same light.</em>
            </h2>
          </div>
          <p className="section-lede md:pb-2">
            The Gita does not ask everyone to walk the same way. Some seekers come through work,
            some through understanding, some through love. Begin with the one that sounds like you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PATHS.map((p, i) => (
            <article key={p.yoga} className="path-card group">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={p.art}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
                  style={{ objectPosition: p.focus }}
                />
                <span className="absolute right-4 top-4 rounded-full border border-gold-soft/40 bg-black/50 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold-soft backdrop-blur-sm">
                  {p.chapter}
                </span>
                <span className="path-wipe" style={{ animationDelay: `${i * 180}ms` }} aria-hidden="true" />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-gold-soft">{p.yoga}</p>
                <h3 className="mt-2 font-display text-[1.6rem] font-semibold leading-tight text-moonlight">{p.title}</h3>
                <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-moonlight/70">{p.line}</p>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-gold/15 pt-5">
                  <Link href={`/verse/${p.ref}`} className="caps-link">
                    Gita {p.ref}
                  </Link>
                  <button type="button" onClick={() => askAbout(p.ask)} className="btn-ghost px-4 py-2 text-[0.7rem]">
                    Walk this path →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
