'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getDailyVerse } from '@/lib/api'
import type { Verse } from '@/types'
import VerseAudio from './VerseAudio'
import ShareVerse from './ShareVerse'

export default function DailyVerse() {
  const [verse, setVerse] = useState<Verse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  // Practical step stays gently hidden until the seeker asks for it.
  const [showStep, setShowStep] = useState(false)

  useEffect(() => {
    getDailyVerse()
      .then((r) => setVerse(r.verse))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="daily-verse" className="py-14 sm:py-20 px-6" style={{ background: '#FBF4E6' }}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-saffron/70 text-xs tracking-[0.3em] uppercase mb-2">Daily Wisdom</p>
        <h2
          className="text-4xl font-bold text-ink mb-12"
          style={{ fontFamily: 'Crimson Text, serif' }}
        >
          Today&apos;s Verse from the Gita
        </h2>

        {loading && (
          <div className="relative grid md:grid-cols-[300px_1fr] gap-0 rounded-3xl overflow-hidden border border-saffron/25 bg-white shadow-2xl shadow-saffron/10 text-left">
            <div className="skeleton min-h-[260px] md:min-h-full rounded-none" />
            <div className="p-8 space-y-4">
              <div className="flex gap-2">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
              <div className="skeleton h-7 w-11/12" />
              <div className="skeleton h-7 w-3/4" />
              <div className="skeleton h-4 w-full mt-6" />
              <div className="skeleton h-4 w-5/6" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-10 w-56 rounded-full mt-6" />
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="border border-saffron/20 rounded-2xl p-8 text-center">
            <span className="text-3xl mb-3 block">🪷</span>
            <p className="text-ink/50 mb-2">Could not load today&apos;s verse.</p>
            <p className="text-ink/30 text-sm">Please refresh the page in a moment.</p>
          </div>
        )}

        {verse && !loading && (
          <div className="relative fade-up">
            {/* Breathing golden aura */}
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-r from-saffron/20 via-gold/15 to-saffron/20 blur-2xl lotus-pulse pointer-events-none" />

            <div className="relative grid md:grid-cols-[300px_1fr] gap-0 rounded-3xl overflow-hidden border border-saffron/25 bg-white shadow-2xl shadow-saffron/10">
              {/* Krishna teaching Arjuna — the eternal dialogue */}
              <div className="relative min-h-[260px] md:min-h-full overflow-hidden group">
                <Image
                  src="/art/scene-1.png"
                  alt="Krishna lovingly teaching the Bhagavad Gita to Arjuna at sunset"
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 px-3 py-1 bg-white/90 text-saffron text-sm font-medium rounded-full shadow">
                  Chapter {verse.chapter_number}, Verse {verse.verse_number}
                </span>
              </div>

              {/* Verse content */}
              <div className="p-8 text-left">
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  {verse.themes.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 border border-saffron/20 text-ink/50 text-xs rounded-full capitalize"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Sanskrit */}
                <p
                  className="text-ink text-2xl leading-relaxed mb-4"
                  style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
                  lang="sa"
                >
                  {verse.sanskrit_text}
                </p>

                {/* Transliteration — recite & meditate */}
                <div className="mb-6">
                  <VerseAudio text={verse.transliteration} meditation />
                </div>

                {/* Meanings */}
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-saffron/60 text-xs tracking-wider uppercase mb-1">हिंदी अर्थ</p>
                    <p className="text-ink/80 leading-relaxed text-sm" lang="hi">
                      {verse.hindi_meaning}
                    </p>
                  </div>
                  <div>
                    <p className="text-saffron/60 text-xs tracking-wider uppercase mb-1">English Meaning</p>
                    <p className="text-ink/80 leading-relaxed text-sm">{verse.english_meaning}</p>
                  </div>
                </div>

                {/* Practical step — revealed on tap */}
                <div className="border-t border-saffron/10 pt-5">
                  {showStep ? (
                    <div className="fade-up">
                      <p className="text-saffron/60 text-xs tracking-wider uppercase mb-2">
                        Today&apos;s Practical Step
                      </p>
                      <p className="text-ink/90 text-sm leading-relaxed">{verse.practical_guidance}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowStep(true)}
                      className="text-sm px-4 py-2 rounded-full bg-saffron/10 text-saffron border border-saffron/30
                                 hover:bg-saffron/20 transition-colors"
                    >
                      ✨ Reveal today&apos;s practical step
                    </button>
                  )}
                </div>

                {/* Share */}
                <div className="flex mt-6">
                  <ShareVerse reference={verse.reference} meaning={verse.english_meaning} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
