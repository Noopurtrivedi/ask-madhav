'use client'

/** The eighteen chapters: search them, jump to a verse, resume where you left off. */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CHAPTERS, VERSES_PER_PAGE } from '@/lib/chapters'
import { lastVerse, readInChapter, readSet, PROGRESS_EVENT } from '@/lib/readingProgress'

function verseHref(reference: string) {
  const [chapter, verse] = reference.split('.').map(Number)
  const page = Math.ceil(verse / VERSES_PER_PAGE)
  return `/gita/${chapter}${page > 1 ? `?page=${page}` : ''}#v${verse}`
}

export default function GitaLibrary() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [read, setReadState] = useState<Set<string>>(new Set())
  const [last, setLast] = useState<string | null>(null)
  const [jump, setJump] = useState('')
  const [jumpError, setJumpError] = useState(false)

  useEffect(() => {
    const sync = () => setReadState(readSet())
    sync()
    setLast(lastVerse())
    window.addEventListener(PROGRESS_EVENT, sync)
    return () => window.removeEventListener(PROGRESS_EVENT, sync)
  }, [])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CHAPTERS
    return CHAPTERS.filter((c) => `${c.n} ${c.yoga} ${c.short} ${c.summary}`.toLowerCase().includes(q))
  }, [query])

  const go = (e: FormEvent) => {
    e.preventDefault()
    const match = jump.trim().match(/^(\d{1,2})[.:\s]+(\d{1,3})$/)
    const chapter = match && CHAPTERS.find((c) => c.n === Number(match[1]))
    if (!match || !chapter || Number(match[2]) < 1 || Number(match[2]) > chapter.verses) {
      setJumpError(true)
      return
    }
    setJumpError(false)
    router.push(verseHref(`${chapter.n}.${Number(match[2])}`))
  }

  return (
    <>
      {last && (
        <Link href={verseHref(last)} className="library-resume">
          <span>
            <span className="block text-xs uppercase tracking-[0.2em] text-gold-soft/80">Continue reading</span>
            <span className="font-display text-xl text-moonlight">Verse {last}</span>
          </span>
          <span aria-hidden="true" className="text-xl text-gold-soft">→</span>
        </Link>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapters: devotion, the soul, meditation"
          aria-label="Search chapters"
          className="library-input"
        />
        <form onSubmit={go} className="flex gap-2">
          <input
            value={jump}
            onChange={(e) => {
              setJump(e.target.value)
              setJumpError(false)
            }}
            placeholder="2.47"
            aria-label="Go to a verse, for example 2.47"
            aria-invalid={jumpError}
            className="library-input w-24"
          />
          <button type="submit" className="btn-ghost px-4 py-2 text-xs">Go</button>
        </form>
      </div>
      {jumpError && <p role="alert" className="mt-2 text-sm text-gold-soft">That verse does not exist. Try a reference like 2.47.</p>}

      {shown.length === 0 ? (
        <p className="mt-12 text-center text-moonlight/60">No chapter matches that search.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => {
            const done = readInChapter(read, c.n)
            return (
              <Link key={c.n} href={`/gita/${c.n}`} className="library-card">
                <span className="flex items-start justify-between">
                  <span className="gold-leaf font-display text-[2.4rem] font-semibold leading-none">{c.n}</span>
                  <span className="text-xs text-moonlight/50">{c.verses} verses</span>
                </span>
                <span className="mt-3 block font-display text-lg font-semibold leading-snug text-moonlight">{c.yoga}</span>
                <span className="mt-1 block text-sm text-gold-soft/80">{c.short}</span>
                <span className="mt-3 block text-sm leading-relaxed text-moonlight/60">{c.summary}</span>
                {done > 0 && (
                  <span className="mt-4 block h-1 overflow-hidden rounded-full bg-white/10" aria-label={`${done} of ${c.verses} verses read`}>
                    <span className="block h-full bg-gold-soft" style={{ width: `${(done / c.verses) * 100}%` }} />
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
