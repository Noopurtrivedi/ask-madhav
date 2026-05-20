'use client'

import { useEffect, useState } from 'react'
import { getDailyVerse } from '@/lib/api'
import type { Verse } from '@/types'

export default function DailyVerse() {
  const [verse, setVerse] = useState<Verse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getDailyVerse()
      .then((r) => setVerse(r.verse))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="daily-verse" className="py-20 px-6" style={{ background: '#111827' }}>
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-saffron/70 text-xs tracking-[0.3em] uppercase mb-2">Daily Wisdom</p>
        <h2
          className="text-4xl font-bold text-cream mb-12"
          style={{ fontFamily: 'Crimson Text, serif' }}
        >
          Today&apos;s Verse from the Gita
        </h2>

        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <span className="text-5xl lotus-pulse">🪷</span>
            <p className="text-cream/40 text-sm">Loading today&apos;s verse...</p>
          </div>
        )}

        {error && !loading && (
          <div className="border border-saffron/20 rounded-2xl p-8 text-center">
            <span className="text-3xl mb-3 block">🪷</span>
            <p className="text-cream/50 mb-2">Could not load today&apos;s verse.</p>
            <p className="text-cream/30 text-sm">Please ensure the backend is running at localhost:8000</p>
          </div>
        )}

        {verse && !loading && (
          <div className="border border-saffron/20 rounded-2xl p-8 bg-navy/50 text-left">
            {/* Tags */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <span className="px-3 py-1 bg-saffron/20 text-saffron text-sm font-medium rounded-full">
                Chapter {verse.chapter_number}, Verse {verse.verse_number}
              </span>
              {verse.themes.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 border border-saffron/20 text-cream/50 text-xs rounded-full capitalize"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Sanskrit */}
            <p
              className="text-cream text-2xl leading-relaxed mb-3 text-center"
              style={{ fontFamily: 'serif' }}
              lang="sa"
            >
              {verse.sanskrit_text}
            </p>

            {/* Transliteration */}
            <p className="text-cream/40 text-sm italic text-center mb-8">
              {verse.transliteration}
            </p>

            {/* Meanings grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-saffron/60 text-xs tracking-wider uppercase mb-2">हिंदी अर्थ</p>
                <p className="text-cream/80 leading-relaxed text-sm" lang="hi">
                  {verse.hindi_meaning}
                </p>
              </div>
              <div>
                <p className="text-saffron/60 text-xs tracking-wider uppercase mb-2">English Meaning</p>
                <p className="text-cream/80 leading-relaxed text-sm">{verse.english_meaning}</p>
              </div>
            </div>

            {/* Practical step */}
            <div className="border-t border-saffron/10 pt-6">
              <p className="text-saffron/60 text-xs tracking-wider uppercase mb-2">Practical Step</p>
              <p className="text-cream/90 text-sm leading-relaxed">{verse.practical_guidance}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
