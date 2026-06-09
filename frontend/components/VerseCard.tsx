'use client'

import { useState } from 'react'
import type { VerseCard as VerseCardType } from '@/types'
import VerseAudio from './VerseAudio'
import ShareVerse from './ShareVerse'
import SaveVerseButton from './SaveVerseButton'
import ChapterBridge from './ChapterBridge'

interface Props {
  verse: VerseCardType
  compact?: boolean
  // When true, the card starts collapsed to just its reference badge and
  // expands on tap. Used in the chat, where the verse detail sits beneath
  // Madhav's reply and shouldn't crowd the conversation until asked for.
  collapsible?: boolean
}

export default function VerseCard({ verse, compact = false, collapsible = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const showBody = !collapsible || expanded

  return (
    <div className="border border-saffron/20 rounded-xl p-5 bg-saffron/[0.05] hover:border-saffron/40 transition-all">
      {/* Reference badge. When collapsible, the whole row is the expand toggle. */}
      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="w-full flex items-center gap-2 flex-wrap text-left"
        >
          <span className="px-2 py-0.5 bg-saffron/20 text-saffron text-xs font-medium rounded-full">
            Chapter {verse.chapter}, Verse {verse.verse}
          </span>
          <span className="text-ink/30 text-xs font-mono">{verse.reference}</span>
          <span className="ml-auto flex items-center gap-1 text-saffron/60 text-xs">
            {expanded ? 'Hide' : 'Read the verse'}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="px-2 py-0.5 bg-saffron/20 text-saffron text-xs font-medium rounded-full">
            Chapter {verse.chapter}, Verse {verse.verse}
          </span>
          <span className="text-ink/30 text-xs font-mono">{verse.reference}</span>
        </div>
      )}

      {showBody && (
        <div className={collapsible ? 'mt-4' : ''}>
          {/* Practical step FIRST — speak to the moment before the scripture. */}
          {!compact && (
            <div className="mb-4 border-l-2 border-saffron/40 pl-3">
              <p className="text-saffron/70 text-xs font-medium uppercase tracking-wider mb-1">
                Practical Step
              </p>
              <p className="text-ink/90 text-sm leading-relaxed">{verse.practical_guidance}</p>
            </div>
          )}

          {/* Sanskrit shloka */}
          <p
            className="text-ink text-lg leading-relaxed mb-2"
            style={{ fontFamily: 'serif' }}
            lang="sa"
          >
            {verse.sanskrit}
          </p>

          {/* Transliteration — recitable with live word highlighting */}
          <div className="mb-4">
            <VerseAudio text={verse.transliteration} />
          </div>

          {!compact && (
            <>
              {/* Hindi meaning */}
              <div className="mb-3">
                <p className="text-saffron/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Hindi अर्थ
                </p>
                <p className="text-ink/80 text-sm leading-relaxed" lang="hi">
                  {verse.hindi_meaning}
                </p>
              </div>

              {/* English meaning */}
              <div className="mb-4">
                <p className="text-saffron/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Meaning
                </p>
                <p className="text-ink/80 text-sm leading-relaxed">{verse.english_meaning}</p>
              </div>

              {/* Actions + source attribution */}
              <div className="flex justify-between items-center border-t border-saffron/10 pt-4 flex-wrap gap-3">
                <ChapterBridge chapter={verse.chapter} />
                <div className="flex items-center gap-4">
                  <SaveVerseButton
                    reference={verse.reference}
                    englishMeaning={verse.english_meaning}
                    themes={verse.themes}
                  />
                  <ShareVerse reference={verse.reference} meaning={verse.english_meaning} compact />
                </div>
              </div>
              <p className="text-ink/20 text-xs italic mt-3">Gita Press, Gorakhpur</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
