'use client'

/** A chapter's reading progress, and the arrow keys that turn its pages. */

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { readInChapter, readSet, PROGRESS_EVENT } from '@/lib/readingProgress'

interface Props {
  chapter: number
  total: number
  prevHref: string | null
  nextHref: string | null
}

export default function ChapterProgress({ chapter, total, prevHref, nextHref }: Props) {
  const router = useRouter()
  const [done, setDone] = useState(0)

  useEffect(() => {
    const sync = () => setDone(readInChapter(readSet(), chapter))
    sync()
    window.addEventListener(PROGRESS_EVENT, sync)
    return () => window.removeEventListener(PROGRESS_EVENT, sync)
  }, [chapter])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft' && prevHref) router.push(prevHref)
      if (e.key === 'ArrowRight' && nextHref) router.push(nextHref)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, prevHref, nextHref])

  const percent = Math.round((done / total) * 100)
  return (
    <div className="mx-auto mt-8 max-w-sm">
      <div className="flex justify-between text-xs text-moonlight/55">
        <span>{done} of {total} verses read</span>
        <span>{percent}%</span>
      </div>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={`Chapter ${chapter} progress`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-gold-soft transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
