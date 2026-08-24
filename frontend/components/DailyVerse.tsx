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
  const [showDeepening, setShowDeepening] = useState(false)

  useEffect(() => {
    getDailyVerse()
      .then((r) => setVerse(r.verse))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="daily-verse" className="py-14 sm:py-20 px-6" >
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-gold-soft/75 text-xs tracking-[0.3em] uppercase mb-2">Daily Wisdom</p>
        <h2
          className="text-4xl font-bold text-moonlight mb-12"
          style={{ fontFamily: 'Crimson Text, serif' }}
        >
          Daily Wisdom
        </h2>

        {loading && (
          <div className="relative grid md:grid-cols-[320px_1fr] gap-0 rounded-3xl overflow-hidden border border-gold/20 bg-white/[0.05] backdrop-blur-md shadow-2xl shadow-black/50 text-left">
            <div className="skeleton min-h-[280px] md:min-h-full rounded-none" />
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
          <div className="border border-gold/22 rounded-2xl p-8 text-center">
            <span className="text-3xl mb-3 block">🪷</span>
            <p className="text-moonlight/58 mb-2">Could not load today&apos;s verse.</p>
            <p className="text-moonlight/38 text-sm">Please refresh the page in a moment.</p>
          </div>
        )}

        {verse && !loading && (
          <div className="relative fade-up">
            {/* Breathing aura behind the card */}
            <div className="absolute -inset-4 rounded-[2.2rem] bg-gradient-to-br from-peacock/20 via-gold/12 to-lotus/15 blur-3xl lotus-pulse pointer-events-none" />

            <div className="relative grid md:grid-cols-[340px_1fr] gap-0 overflow-hidden rounded-[1.75rem] border border-gold/20 bg-white/[0.055] shadow-2xl shadow-black/60 backdrop-blur-xl">
              {/* Krishna teaching Arjuna — the eternal dialogue */}
              <div className="group relative min-h-[300px] overflow-hidden md:min-h-full">
                <Image
                  src="/art/scene-1.png"
                  alt="Krishna lovingly teaching the Bhagavad Gita to Arjuna at sunset"
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-cover object-[60%_center] transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
                {/* Blend the image into the glass on the seam side, darken for the chip */}
                <div className="absolute inset-0 bg-gradient-to-t from-cosmos-deep/70 via-transparent to-transparent" />
                <div className="absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-r from-transparent to-[#12142e]/70 md:block" />
                <span className="absolute bottom-4 left-4 rounded-full border border-gold/30 bg-cosmos-deep/70 px-3 py-1 text-sm font-medium text-gold-soft shadow backdrop-blur-sm">
                  Chapter {verse.chapter_number} · Verse {verse.verse_number}
                </span>
              </div>

              {/* Verse content */}
              <div className="p-7 text-left sm:p-9">
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  {verse.themes.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-gold/25 bg-gold-soft/[0.06] px-3 py-1 text-xs capitalize tracking-wide text-gold-soft/85"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Sanskrit — the centrepiece, on a faint inset panel */}
                <div className="mb-5 rounded-2xl border border-gold/12 bg-gradient-to-b from-white/[0.05] to-transparent px-5 py-4">
                  <p
                    className="text-[1.6rem] leading-relaxed text-moonlight"
                    style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
                    lang="sa"
                  >
                    {verse.sanskrit_text}
                  </p>
                  {/* Transliteration — recite & meditate */}
                  <div className="mt-3 border-t border-gold/10 pt-3">
                    <VerseAudio text={verse.transliteration} meditation />
                  </div>
                </div>

                {/* Meanings */}
                <div className="mb-6 space-y-4">
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.15em] text-gold-soft/70">हिंदी अर्थ</p>
                    <p className="text-sm leading-relaxed text-moonlight/85" lang="hi">
                      {verse.hindi_meaning}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.15em] text-gold-soft/70">English Meaning</p>
                    <p className="text-sm leading-relaxed text-moonlight/85">{verse.english_meaning}</p>
                  </div>
                </div>

                {/* Practical step — revealed on tap, into a warm highlighted panel */}
                <div className="border-t border-gold/12 pt-5">
                  {showStep ? (
                    <div className="fade-up rounded-2xl border border-gold/25 bg-gold-soft/[0.08] p-4">
                      <p className="mb-2 text-[11px] uppercase tracking-[0.15em] text-gold-soft/80">
                        ✨ Today&apos;s Practical Step
                      </p>
                      <p className="text-sm leading-relaxed text-moonlight/90">{verse.practical_guidance}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowStep(true)}
                      className="rounded-full border border-gold/30 bg-gold-soft/[0.08] px-5 py-2.5 text-sm text-gold-soft
                                 transition-all hover:scale-[1.03] hover:border-gold hover:bg-gold-soft/[0.16]"
                    >
                      ✨ Reveal today&apos;s practical step
                    </button>
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-gold/16 bg-white/[0.035] p-4">
                  <button
                    type="button"
                    onClick={() => setShowDeepening((s) => !s)}
                    aria-expanded={showDeepening}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span>
                      <span className="block text-[11px] uppercase tracking-[0.15em] text-gold-soft/70">
                        Go deeper
                      </span>
                      <span className="mt-1 block text-sm text-moonlight/82">
                        Learn the shloka through meaning, practice, and reflection.
                      </span>
                    </span>
                    <span className={`text-gold-soft/60 transition-transform ${showDeepening ? 'rotate-180' : ''}`}>▾</span>
                  </button>

                  {showDeepening && (
                    <div className="fade-up mt-4 grid gap-3 text-sm text-moonlight/76 sm:grid-cols-3">
                      <div>
                        <p className="mb-1 text-gold-soft/75 text-xs">Meaning</p>
                        <p className="leading-relaxed">
                          Notice the central teaching: {verse.themes[0] || 'steady wisdom'} is not only an idea, but a way to act today.
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-gold-soft/75 text-xs">Practice</p>
                        <p className="leading-relaxed">
                          Choose one moment where you can act sincerely and release your grip on the result.
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-gold-soft/75 text-xs">Reflect</p>
                        <p className="leading-relaxed">
                          Ask: what is mine to do, what is not mine to control, and what would a steadier self choose?
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Share */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <ShareVerse reference={verse.reference} meaning={verse.english_meaning} />
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
                      window.dispatchEvent(
                        new CustomEvent('madhav:prefill', {
                          detail: {
                            question: `Explain Bhagavad Gita ${verse.reference} deeply, with a simple analogy and one action I can practice today.`,
                          },
                        }),
                      )
                    }}
                    className="rounded-full border border-gold/30 px-4 py-2 text-xs text-gold-soft hover:border-gold hover:bg-gold-soft/[0.08] transition-colors"
                  >
                    Ask Madhav to expand this shloka →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
