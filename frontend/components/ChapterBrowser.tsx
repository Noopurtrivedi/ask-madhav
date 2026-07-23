'use client'

import { useState } from 'react'

const CHAPTERS = [
  { n: 1, yoga: 'Arjun Vishad Yog', short: "Arjuna's Grief", verses: 47, color: 'from-red-900/30',
    summary: 'Seeing his own kin arrayed for war, Arjuna is overcome with grief and lets his bow slip from his hands. The Gita begins in a very human collapse of resolve.' },
  { n: 2, yoga: 'Sankhya Yog', short: 'Eternal Soul & Duty', verses: 72, color: 'from-orange-900/30',
    summary: 'The core teaching opens: the soul is eternal and indestructible — grieve not for what cannot die. Act from steadiness, not from attachment to results.' },
  { n: 3, yoga: 'Karm Yog', short: 'Path of Action', verses: 43, color: 'from-amber-900/30',
    summary: 'No one can remain actionless. Do your duty without clinging to its fruit; selfless action purifies the heart and sets it free.' },
  { n: 4, yoga: 'Jnan Karm Sanyas Yog', short: 'Knowledge & Action', verses: 42, color: 'from-yellow-900/30',
    summary: 'Knowledge crowns action. I take birth age after age to restore dharma; offer your actions as a sacrifice, and wisdom burns away their binding.' },
  { n: 5, yoga: 'Karm Sanyas Yog', short: 'Renunciation', verses: 29, color: 'from-lime-900/30',
    summary: 'Renunciation and selfless action lead to the same peace. The wise act without ego, resting steadily in the Self.' },
  { n: 6, yoga: 'Dhyan Yog', short: 'Meditation', verses: 47, color: 'from-green-900/30',
    summary: 'The path of meditation: steady the restless mind through practice and detachment. Lift yourself by your own mind — it is both your friend and your foe.' },
  { n: 7, yoga: 'Jnan Vijnan Yog', short: 'Knowledge & Wisdom', verses: 30, color: 'from-teal-900/30',
    summary: 'Knowledge of the Divine in its fullness. All that exists is strung upon Me like beads upon a single thread.' },
  { n: 8, yoga: 'Akshar Brahm Yog', short: 'The Eternal Absolute', verses: 28, color: 'from-cyan-900/30',
    summary: 'On the imperishable Absolute, death, and where the soul travels. Remember the Divine even at the final hour, and you shall reach it.' },
  { n: 9, yoga: 'Raj Vidya Yog', short: 'Royal Knowledge', verses: 34, color: 'from-sky-900/30',
    summary: 'The royal secret is loving devotion. Whatever you offer with a sincere heart, I accept; my devoted ones are never lost.' },
  { n: 10, yoga: 'Vibhuti Yog', short: 'Divine Manifestations', verses: 42, color: 'from-blue-900/30',
    summary: 'The infinite glories of the Divine. Wherever there is excellence, beauty, or power, know it to be a spark of Me.' },
  { n: 11, yoga: 'Vishwarup Darshan Yog', short: 'Cosmic Form', verses: 55, color: 'from-indigo-900/30',
    summary: 'Arjuna beholds the cosmic form — all worlds and time itself contained within the Divine. Awe, terror, and finally surrender.' },
  { n: 12, yoga: 'Bhakti Yog', short: 'Path of Devotion', verses: 20, color: 'from-violet-900/30',
    summary: 'The path of devotion is the most accessible of all. Dear to Me is the one who is humble, compassionate, and even-minded in joy and sorrow.' },
  { n: 13, yoga: 'Kshetra Kshetragya Vibhag Yog', short: 'Field & Its Knower', verses: 35, color: 'from-purple-900/30',
    summary: 'The field — body and nature — and its knower, the soul. Wisdom is to discern the changing from the changeless within you.' },
  { n: 14, yoga: 'Gunatray Vibhag Yog', short: 'Three Modes of Nature', verses: 27, color: 'from-fuchsia-900/30',
    summary: 'The three gunas — sattva, rajas, tamas — bind the soul to nature. Rise above them, and you taste freedom.' },
  { n: 15, yoga: 'Purushottam Yog', short: 'The Supreme Person', verses: 20, color: 'from-pink-900/30',
    summary: 'The Supreme Person beyond the perishable and the imperishable. Cut the deep-rooted tree of worldly entanglement with the axe of detachment.' },
  { n: 16, yoga: 'Daivasur Sampad Vibhag Yog', short: 'Divine & Demonic', verses: 24, color: 'from-rose-900/30',
    summary: 'The divine and the demonic natures that live within us. Cultivate fearlessness, truth, and compassion; shed greed, anger, and pride.' },
  { n: 17, yoga: 'Shraddhatray Vibhag Yog', short: 'Three Kinds of Faith', verses: 28, color: 'from-red-900/30',
    summary: 'Faith takes three forms according to temperament. Even your food, your giving, and your speech reveal which mode of nature rules you.' },
  { n: 18, yoga: 'Moksh Sanyas Yog', short: 'Liberation', verses: 78, color: 'from-orange-900/30',
    summary: 'The grand summation: act, surrender the fruits, and take refuge in the Divine. "Abandon all dharmas and come to Me alone — do not fear."' },
]

function askMadhav(question: string) {
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  window.dispatchEvent(new CustomEvent('madhav:prefill', { detail: { question } }))
}

export default function ChapterBrowser() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-14 sm:py-20 px-6" >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-gold-soft/65 text-xs font-medium uppercase tracking-widest mb-3">
            18 Chapters · 700 Verses
          </p>
          <h2
            className="text-3xl md:text-4xl text-moonlight mb-3"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            The Yogs of the Bhagavad Gita
          </h2>
          <p className="text-moonlight/58 text-sm max-w-md mx-auto">
            Each chapter is a complete yoga — a path. Tap any chapter to read its essence.
          </p>
        </div>

        {/* Chapter grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 items-start">
          {CHAPTERS.map((ch) => {
            const isOpen = open === ch.n
            return (
              <div
                key={ch.n}
                className={`group rounded-xl border bg-gradient-to-br ${ch.color} to-transparent
                  transition-all duration-300 ${
                    isOpen ? 'border-gold/40 shadow-lg shadow-saffron/10' : 'border-gold/15 hover:border-saffron/35'
                  }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : ch.n)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="text-gold-soft/45 text-3xl font-bold leading-none"
                      style={{ fontFamily: 'Crimson Text, serif' }}
                    >
                      {ch.n}
                    </span>
                    <span className="text-moonlight/34 text-xs mt-1">{ch.verses} verses</span>
                  </div>
                  <p
                    className="text-moonlight/90 text-sm font-semibold mb-0.5 group-hover:text-saffron transition-colors leading-snug"
                    style={{ fontFamily: 'Crimson Text, serif' }}
                  >
                    {ch.yoga}
                  </p>
                  <p className="text-moonlight/48 text-xs flex items-center justify-between">
                    {ch.short}
                    <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                  </p>
                </button>

                {/* Expanding essence panel */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gold/15">
                      <p className="text-moonlight/75 text-sm leading-relaxed">{ch.summary}</p>
                      <button
                        onClick={() =>
                          askMadhav(`Tell me the essence of Chapter ${ch.n} of the Bhagavad Gita — ${ch.yoga} — and how it applies to my life.`)
                        }
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                                   border border-gold/35 text-saffron hover:bg-gold-soft/[0.10] transition-colors"
                      >
                        🪷 Explore this chapter with Madhav →
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
