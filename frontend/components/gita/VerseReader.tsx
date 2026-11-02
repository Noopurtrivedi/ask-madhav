'use client'

/**
 * VerseReader — one page of a chapter, read in the language the seeker chooses.
 *
 * Each verse can be marked as read, opened on its own page, or carried into the
 * chat. The chat is one choice among several here, never the only way forward.
 */

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { readSet, rememberVerse, setRead, PROGRESS_EVENT } from '@/lib/readingProgress'

export interface ReaderVerse {
  reference: string
  verse_number: number
  sanskrit_text: string
  transliteration: string
  hindi_meaning: string
  english_meaning: string
  practical_guidance: string
  themes: string[]
}

type Language = 'english' | 'hindi' | 'both'

const LANGUAGE_KEY = 'askmadhav_reading_language'
const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'english', label: 'English' },
  { id: 'hindi', label: 'हिंदी' },
  { id: 'both', label: 'Both' },
]

function discuss(reference: string) {
  try {
    sessionStorage.setItem('madhav:prefill', `Help me understand Bhagavad Gita ${reference} and how it applies to my life.`)
  } catch {
    // Storage blocked: the chat still opens.
  }
  window.location.href = '/#chat'
}

export default function VerseReader({ verses }: { verses: ReaderVerse[] }) {
  const [language, setLanguage] = useState<Language>('english')
  const [showRoman, setShowRoman] = useState(true)
  const [read, setReadState] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY) as Language | null
      if (saved && LANGUAGES.some((l) => l.id === saved)) setLanguage(saved)
    } catch {
      // English is the default without storage.
    }
    const sync = () => setReadState(readSet())
    sync()
    window.addEventListener(PROGRESS_EVENT, sync)
    return () => window.removeEventListener(PROGRESS_EVENT, sync)
  }, [])

  useEffect(() => {
    if (verses[0]) rememberVerse(verses[0].reference)
  }, [verses])

  const choose = useCallback((next: Language) => {
    setLanguage(next)
    try {
      localStorage.setItem(LANGUAGE_KEY, next)
    } catch {
      // The choice still holds for this page.
    }
  }, [])

  return (
    <div>
      <div className="reader-tools">
        <div role="group" aria-label="Translation language" className="reader-segment">
          {LANGUAGES.map((l) => (
            <button key={l.id} type="button" aria-pressed={language === l.id} onClick={() => choose(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <button type="button" aria-pressed={showRoman} onClick={() => setShowRoman((s) => !s)} className="reader-toggle">
          Transliteration
        </button>
      </div>

      <div className="mt-6 space-y-5">
        {verses.map((v) => {
          const isRead = read.has(v.reference)
          return (
            <article key={v.reference} id={`v${v.verse_number}`} className={`reader-verse ${isRead ? 'reader-verse-read' : ''}`}>
              <div className="flex items-baseline justify-between gap-4">
                <Link href={`/verse/${v.reference}`} className="gold-leaf font-display text-2xl font-semibold">
                  {v.reference}
                </Link>
                {v.themes.length > 0 && (
                  <p className="truncate text-[0.68rem] capitalize tracking-wide text-moonlight/45">
                    {v.themes.slice(0, 2).join(' · ')}
                  </p>
                )}
              </div>

              <p className="mt-4 text-center font-sanskrit text-[1.3rem] leading-[1.8] text-moonlight sm:text-[1.5rem]" lang="sa">
                {v.sanskrit_text}
              </p>
              {showRoman && (
                <p className="mt-2 text-center text-sm italic leading-relaxed text-moonlight/50">{v.transliteration}</p>
              )}

              <div className={`mt-5 grid gap-5 ${language === 'both' ? 'md:grid-cols-2' : ''}`}>
                {language !== 'hindi' && <p className="leading-relaxed text-moonlight/85">{v.english_meaning}</p>}
                {language !== 'english' && (
                  <p className="font-hindi leading-relaxed text-moonlight/85" lang="hi">{v.hindi_meaning}</p>
                )}
              </div>

              <details className="reader-practice">
                <summary>Try this today</summary>
                <p>{v.practical_guidance}</p>
              </details>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gold/10 pt-4 text-xs">
                <button type="button" aria-pressed={isRead} onClick={() => setRead(v.reference, !isRead)} className="reader-mark">
                  <span aria-hidden="true">{isRead ? '✓' : '○'}</span> {isRead ? 'Read' : 'Mark as read'}
                </button>
                <Link href={`/verse/${v.reference}`} className="text-moonlight/60 transition-colors hover:text-gold-soft">
                  Go deeper
                </Link>
                <button type="button" onClick={() => discuss(v.reference)} className="text-moonlight/60 transition-colors hover:text-gold-soft">
                  Discuss with Madhav
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
