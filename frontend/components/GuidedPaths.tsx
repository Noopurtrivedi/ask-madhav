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
  icon: string
  title: string
  yoga: string
  intro: string
  steps: Step[]
}

const PATHS: Path[] = [
  {
    id: 'letting-go',
    icon: '🌊',
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
    icon: '🔥',
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
    icon: '🕊️',
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
    icon: '🪔',
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
    <section id="paths" className="py-14 sm:py-20 px-6" style={{ background: '#FBF4E6' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-saffron/60 text-xs font-medium uppercase tracking-widest mb-3">
            Guided Journeys
          </p>
          <h2
            className="text-3xl md:text-4xl text-ink mb-3"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Walk a Path
          </h2>
          <p className="text-ink/50 text-sm max-w-md mx-auto">
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
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? 'border-saffron/50 bg-white shadow-lg shadow-saffron/10'
                    : 'border-saffron/15 bg-white/60 hover:border-saffron/40 hover:shadow-md hover:shadow-saffron/10'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : path.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl select-none">{path.icon}</span>
                    <div>
                      <p
                        className="text-ink text-lg font-semibold leading-snug group-hover:text-saffron"
                        style={{ fontFamily: 'Crimson Text, serif' }}
                      >
                        {path.title}
                      </p>
                      <p className="text-saffron/60 text-xs">{path.yoga} · {path.steps.length} verses</p>
                    </div>
                    <span
                      className={`ml-auto text-saffron/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      ▾
                    </span>
                  </div>
                  <p className="text-ink/60 text-sm leading-relaxed">{path.intro}</p>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 space-y-3 border-t border-saffron/10">
                      <ol className="space-y-2.5 mt-3">
                        {path.steps.map((step, i) => (
                          <li key={step.ref} className="flex gap-3">
                            <span className="text-saffron/50 text-sm font-semibold w-5 flex-shrink-0">
                              {i + 1}.
                            </span>
                            <div>
                              <Link
                                href={`/verse/${step.ref}`}
                                className="text-saffron text-sm font-medium hover:underline"
                              >
                                Gita {step.ref}
                              </Link>
                              <p className="text-ink/70 text-sm leading-relaxed">{step.line}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <button
                        onClick={() => walkWithMadhav(path.title)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                                   border border-saffron/40 text-saffron hover:bg-saffron/10 transition-colors mt-2"
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
