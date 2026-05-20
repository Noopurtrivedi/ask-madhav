import type { VerseCard as VerseCardType } from '@/types'
import VerseAudio from './VerseAudio'
import ShareVerse from './ShareVerse'
import SaveVerseButton from './SaveVerseButton'

interface Props {
  verse: VerseCardType
  compact?: boolean
}

export default function VerseCard({ verse, compact = false }: Props) {
  return (
    <div className="border border-saffron/20 rounded-xl p-5 bg-white/[0.03] hover:border-saffron/40 transition-all">
      {/* Reference badge */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="px-2 py-0.5 bg-saffron/20 text-saffron text-xs font-medium rounded-full">
          Chapter {verse.chapter}, Verse {verse.verse}
        </span>
        <span className="text-cream/30 text-xs font-mono">{verse.reference}</span>
      </div>

      {/* Sanskrit */}
      <p
        className="text-cream text-lg leading-relaxed mb-2"
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
            <p className="text-cream/80 text-sm leading-relaxed" lang="hi">
              {verse.hindi_meaning}
            </p>
          </div>

          {/* English meaning */}
          <div className="mb-4">
            <p className="text-saffron/70 text-xs font-medium uppercase tracking-wider mb-1">
              Meaning
            </p>
            <p className="text-cream/80 text-sm leading-relaxed">{verse.english_meaning}</p>
          </div>

          {/* Practical guidance */}
          <div className="border-t border-saffron/10 pt-4">
            <p className="text-saffron/70 text-xs font-medium uppercase tracking-wider mb-1">
              Practical Step
            </p>
            <p className="text-cream/90 text-sm leading-relaxed">{verse.practical_guidance}</p>
          </div>

          {/* Actions + source attribution */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-cream/20 text-xs italic">
              Gita Press, Gorakhpur
            </span>
            <div className="flex items-center gap-4">
              <SaveVerseButton
                reference={verse.reference}
                englishMeaning={verse.english_meaning}
                themes={verse.themes}
              />
              <ShareVerse reference={verse.reference} meaning={verse.english_meaning} compact />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
