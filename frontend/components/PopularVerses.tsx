'use client'

import { useEffect, useState } from 'react'
import { getVerses } from '@/lib/api'
import type { Verse } from '@/types'

// Curated from the most-loved Gita verses. The Sanskrit + meanings are fetched
// from the verse engine; this list only carries the editorial framing.
const POPULAR_VERSES = [
  { reference: '2.47', yoga: 'Karm Yog', label: 'The Most Famous Verse' },
  { reference: '2.20', yoga: 'Sankhya Yog', label: 'The Eternal Soul' },
  { reference: '4.7', yoga: 'Jnan Karm Sanyas Yog', label: 'Avatar Vani' },
  { reference: '18.66', yoga: 'Moksh Sanyas Yog', label: 'The Final Teaching' },
  { reference: '2.14', yoga: 'Sankhya Yog', label: 'On Pleasure & Pain' },
  { reference: '6.5', yoga: 'Dhyan Yog', label: 'Elevate Yourself' },
  { reference: '9.22', yoga: 'Raj Vidya Yog', label: 'The Promise' },
  { reference: '3.21', yoga: 'Karm Yog', label: 'Lead By Example' },
  { reference: '12.13', yoga: 'Bhakti Yog', label: 'The True Devotee' },
]

function askMadhav(question: string) {
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  window.dispatchEvent(new CustomEvent('madhav:prefill', { detail: { question } }))
}

export default function PopularVerses() {
  const [verseMap, setVerseMap] = useState<Record<string, Verse>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getVerses(POPULAR_VERSES.map((v) => v.reference)).then((verses) => {
      const map: Record<string, Verse> = {}
      verses.forEach((v) => (map[v.reference] = v))
      setVerseMap(map)
    })
  }, [])

  return (
    <section className="py-14 sm:py-20 px-6" >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-gold-soft/65 text-xs font-medium uppercase tracking-widest mb-3">
            Timeless Wisdom
          </p>
          <h2
            className="text-3xl md:text-4xl text-moonlight mb-3"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Popular Verses
          </h2>
          <p className="text-moonlight/58 text-sm max-w-md mx-auto">
            The shlokas people return to again and again — in moments of doubt, grief, and searching.
            Tap a verse to unfold its meaning.
          </p>
        </div>

        {/* Verse grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {POPULAR_VERSES.map((meta) => {
            const verse = verseMap[meta.reference]
            const isOpen = expanded === meta.reference
            return (
              <div
                key={meta.reference}
                className={`group border rounded-xl overflow-hidden transition-all duration-300
                  ${isOpen ? 'border-gold/40 bg-white shadow-lg shadow-saffron/10' : 'border-saffron/15 bg-saffron/[0.04] hover:border-gold/35 hover:shadow-md hover:shadow-saffron/10'}`}
              >
                {/* Card head — toggles the meaning */}
                <button
                  onClick={() => setExpanded(isOpen ? null : meta.reference)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-2 py-0.5 bg-saffron/20 text-saffron text-xs font-medium rounded-full">
                      {meta.reference}
                    </span>
                    <span className="text-moonlight/38 text-xs">{meta.yoga}</span>
                  </div>

                  <p
                    className="text-moonlight text-base font-semibold mb-3 group-hover:text-saffron transition-colors"
                    style={{ fontFamily: 'Crimson Text, serif' }}
                  >
                    {meta.label}
                  </p>

                  {/* Sanskrit shloka — the verse itself, not a translation */}
                  {verse ? (
                    <p
                      className="text-moonlight/90 text-lg leading-relaxed"
                      style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
                      lang="sa"
                    >
                      {verse.sanskrit_text}
                    </p>
                  ) : (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-gold-soft/[0.10] rounded w-full" />
                      <div className="h-4 bg-gold-soft/[0.10] rounded w-4/5" />
                    </div>
                  )}

                  <p className="text-gold-soft/55 text-xs mt-4 flex items-center gap-1 group-hover:text-gold-soft/85 transition-colors">
                    {isOpen ? 'Hide meaning' : 'See meaning'}
                    <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                  </p>
                </button>

                {/* Expanding meaning panel */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    {verse && (
                      <div className="px-5 pb-5 pt-1 space-y-4 border-t border-gold/15">
                        {verse.transliteration && (
                          <p className="text-gold-soft/75 text-xs italic leading-relaxed">
                            {verse.transliteration}
                          </p>
                        )}
                        <div>
                          <p className="text-gold-soft/65 text-[11px] tracking-wider uppercase mb-1">हिंदी अर्थ</p>
                          <p className="text-moonlight/80 text-sm leading-relaxed" lang="hi">
                            {verse.hindi_meaning}
                          </p>
                        </div>
                        <div>
                          <p className="text-gold-soft/65 text-[11px] tracking-wider uppercase mb-1">English Meaning</p>
                          <p className="text-moonlight/72 text-sm leading-relaxed">{verse.english_meaning}</p>
                        </div>

                        {/* AI is optional — only if deeper reflection is wanted */}
                        <button
                          onClick={() =>
                            askMadhav(`Help me understand Bhagavad Gita ${meta.reference} and how to live it.`)
                          }
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                                     border border-gold/35 text-saffron hover:bg-gold-soft/[0.10] transition-colors"
                        >
                          🪷 Reflect on this with Madhav →
                        </button>
                      </div>
                    )}
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
