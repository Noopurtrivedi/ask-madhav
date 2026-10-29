'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * Guided Paths — curated multi-verse journeys for seekers who feel something
 * but don't yet have the words to ask. Each path is a short arc of verses
 * around one life theme; steps link to the verse pages, and a single tap walks
 * the whole path with Madhav. Pure curation over the existing verse data —
 * no new API surface.
 */
interface Step {
  ref: string
  line: string
}
interface Path {
  id: string
  icon: IconName
  title: string
  yoga: string
  intro: string
  steps: Step[]
}

type IconName = 'wave' | 'flame' | 'dove' | 'diya'

/** Fine-line glyphs drawn for the paths — one stroke weight, gold, no emoji. */
function PathIcon({ name }: { name: IconName }) {
  const d: Record<IconName, string> = {
    wave: 'M3 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2M3 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2M6 11c0-3.3 2.7-6 6-6 2 0 3.6.9 4.6 2.4-1.9-.4-4 .6-4.6 2.6',
    flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.2-3.9 2.5-5 .2 1.8 1 2.8 2 3.2C11 8.6 11.3 5.6 12 3zM12 21a2.2 2.2 0 0 1-2.2-2.2c0-1.4 1.2-2.2 2.2-3.6 1 1.4 2.2 2.2 2.2 3.6A2.2 2.2 0 0 1 12 21z',
    dove: 'M4 15c3 0 5.5-1 7.5-3.5L15 7c1-1.2 2.6-1.6 4-.8l1.5.8-2 .6c-.6 4.8-3.6 8.4-8.5 8.4H7l-3 3v-4zM11.5 11.5L8 6',
    diya: 'M3 13h18c-.8 3.6-4.6 6-9 6s-8.2-2.4-9-6zM12 4c.9 1.6 2 2.6 2 4.1a2 2 0 0 1-4 0C10 6.6 11.1 5.6 12 4zM8 21h8',
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d[name]} />
    </svg>
  )
}

const PATHS: Path[] = [
  {
    id: 'letting-go',
    icon: 'wave',
    title: 'Letting Go of Outcomes',
    yoga: 'Karma Yoga',
    intro: 'Act with all your heart, then release your grip on the result.',
    steps: [
      { ref: '2.47', line: 'Your right is to the action, never to its fruits.' },
      { ref: '2.48', line: 'Steadiness in success and failure — that is yoga.' },
      { ref: '3.19', line: 'Do your work without attachment, and reach the highest.' },
      { ref: '18.66', line: 'Surrender, and let go of fear.' },
    ],
  },
  {
    id: 'facing-fear',
    icon: 'flame',
    title: 'Facing Fear & Anxiety',
    yoga: 'Sankhya & Dhyana Yoga',
    intro: 'Steady the restless mind and meet what frightens you.',
    steps: [
      { ref: '2.14', line: 'Sensations come and go — learn to endure them.' },
      { ref: '2.40', line: 'No effort on this path is ever wasted.' },
      { ref: '6.5', line: 'Lift yourself by your own mind; be your own friend.' },
      { ref: '4.10', line: 'Freed from fear and anger, take refuge in truth.' },
    ],
  },
  {
    id: 'grief',
    icon: 'dove',
    title: 'Walking Through Grief',
    yoga: 'Sankhya Yoga',
    intro: 'For when you have lost someone, or something, dear.',
    steps: [
      { ref: '2.13', line: 'The soul passes through bodies as through ages.' },
      { ref: '2.20', line: 'The Self is never born and never dies.' },
      { ref: '2.22', line: 'As we change worn clothes, the soul changes bodies.' },
      { ref: '2.27', line: 'Death is certain for the born — do not grieve the inevitable.' },
    ],
  },
  {
    id: 'purpose',
    icon: 'diya',
    title: 'Finding Your Purpose',
    yoga: 'Dharma',
    intro: 'Discover your own work — and why it is yours to do.',
    steps: [
      { ref: '3.35', line: 'Better your own dharma, imperfectly, than another’s well.' },
      { ref: '2.31', line: 'For a true cause, do not waver from your duty.' },
      { ref: '3.8', line: 'Do your allotted work; action is better than inaction.' },
      { ref: '18.47', line: 'One’s own duty, though flawed, frees from sin.' },
    ],
  },
]

function walkWithMadhav(title: string) {
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  window.dispatchEvent(
    new CustomEvent('madhav:prefill', {
      detail: {
        question: `Walk me through the Gita's teaching on ${title.toLowerCase()} — I want to understand it and live it.`,
      },
    }),
  )
}

export default function GuidedPaths() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section id="paths" className="py-20 sm:py-28 px-6" >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="eyebrow mb-5">
            Guided Journeys
          </p>
          <h2
            className="section-title mb-4"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Walk a <em className="gold-leaf">path</em>
          </h2>
          <p className="section-lede max-w-lg mx-auto">
            Not sure what to ask? Choose what your heart is carrying. Each path is a short journey
            of verses — read them, or walk through them with Madhav.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 items-start">
          {PATHS.map((path) => {
            const isOpen = open === path.id
            return (
              <div
                key={path.id}
                className={`sacred-card rounded-2xl ${isOpen ? 'ring-1 ring-gold-soft/25' : 'hover:-translate-y-0.5'}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : path.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-6"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-soft/30 bg-gold-soft/[0.06] text-gold-soft">
                      <PathIcon name={path.icon} />
                    </span>
                    <div>
                      <p
                        className="text-moonlight text-[1.4rem] font-medium leading-snug"
                        style={{ fontFamily: 'var(--font-display), serif' }}
                      >
                        {path.title}
                      </p>
                      <p className="font-caps text-[0.62rem] tracking-[0.2em] uppercase text-gold-soft/70 mt-0.5">{path.yoga} · {path.steps.length} verses</p>
                    </div>
                    <span
                      className={`ml-auto text-gold-soft/55 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      ▾
                    </span>
                  </div>
                  <p className="text-moonlight/65 text-sm leading-relaxed">{path.intro}</p>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gold/15">
                      <ol className="space-y-2.5 mt-3">
                        {path.steps.map((step, i) => (
                          <li key={step.ref} className="flex gap-3">
                            <span className="text-gold-soft/55 text-sm font-semibold w-5 flex-shrink-0">
                              {i + 1}.
                            </span>
                            <div>
                              <Link
                                href={`/verse/${step.ref}`}
                                className="text-saffron text-sm font-medium hover:underline"
                              >
                                Gita {step.ref}
                              </Link>
                              <p className="text-moonlight/72 text-sm leading-relaxed">{step.line}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <button
                        onClick={() => walkWithMadhav(path.title)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                                   border border-gold/35 text-saffron hover:bg-gold-soft/[0.10] transition-colors mt-2"
                      >
                        🪷 Walk this path with Madhav →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
