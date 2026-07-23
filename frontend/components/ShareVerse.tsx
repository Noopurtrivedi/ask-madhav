'use client'

import { useState } from 'react'

interface Props {
  reference: string
  meaning: string
  /** Compact icon-only button for tight spaces (e.g. chat verse cards). */
  compact?: boolean
}

/**
 * Share a verse as a Wisdom Card. Uses the native Web Share API where
 * available (mobile), falling back to copying the link. Also links to the
 * generated OG image so users can save/post the card itself.
 */
export default function ShareVerse({ reference, meaning, compact = false }: Props) {
  const [copied, setCopied] = useState(false)

  const verseUrl = () =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/verse/${encodeURIComponent(reference)}`

  const handleShare = async () => {
    const url = verseUrl()
    const text = `"${meaning.slice(0, 160)}" — Bhagavad Gita ${reference}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `Ask Madhav · Gita ${reference}`, text, url })
        return
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const cardUrl = `/api/og?ref=${encodeURIComponent(reference)}`

  if (compact) {
    return (
      <button
        onClick={handleShare}
        aria-label="Share this verse"
        title={copied ? 'Link copied' : 'Share this verse'}
        className="text-moonlight/48 hover:text-saffron transition-colors text-xs flex items-center gap-1"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {copied ? 'Copied' : 'Share'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleShare}
        className="px-4 py-2 bg-saffron text-navy text-sm font-medium rounded-full hover:bg-saffron-light transition-colors"
      >
        {copied ? '✓ Link copied' : 'Share this wisdom'}
      </button>
      <a
        href={cardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 border border-gold/28 text-moonlight/72 text-sm rounded-full hover:border-saffron/60 transition-colors"
      >
        Wisdom card ↗
      </a>
    </div>
  )
}
