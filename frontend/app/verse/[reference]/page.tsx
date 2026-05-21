import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findVerse } from '@/lib/verseEngine'
import VerseAudio from '@/components/VerseAudio'
import ShareVerse from '@/components/ShareVerse'
import SaveVerseButton from '@/components/SaveVerseButton'

interface Props {
  params: { reference: string }
}

export function generateMetadata({ params }: Props): Metadata {
  const verse = findVerse(decodeURIComponent(params.reference))
  if (!verse) return { title: 'Verse not found — Ask Madhav' }

  const title = `Bhagavad Gita ${verse.reference} — Ask Madhav`
  const description = verse.english_meaning.slice(0, 200)
  const ogImage = `/api/og?ref=${encodeURIComponent(verse.reference)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function VersePage({ params }: Props) {
  const verse = findVerse(decodeURIComponent(params.reference))
  if (!verse) notFound()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ background: '#FFFCF5' }}>
      <div className="max-w-2xl w-full border border-saffron/20 rounded-2xl p-8" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="px-3 py-1 bg-saffron/20 text-saffron text-sm font-medium rounded-full">
            Chapter {verse.chapter_number}, Verse {verse.verse_number}
          </span>
          {(verse.themes || []).slice(0, 2).map((t) => (
            <span key={t} className="px-2 py-1 border border-saffron/20 text-ink/50 text-xs rounded-full capitalize">
              {t}
            </span>
          ))}
        </div>

        {/* Practical step FIRST — guidance for the moment, then the scripture. */}
        <div className="mb-6 border-l-2 border-saffron/40 pl-4">
          <p className="text-saffron/60 text-xs tracking-wider uppercase mb-2">Practical Step</p>
          <p className="text-ink/90 text-sm leading-relaxed">{verse.practical_guidance}</p>
        </div>

        <p className="text-ink text-2xl leading-relaxed mb-4 text-center" style={{ fontFamily: 'serif' }} lang="sa">
          {verse.sanskrit_text}
        </p>

        <div className="flex justify-center mb-8">
          <VerseAudio text={verse.transliteration} meditation />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-saffron/60 text-xs tracking-wider uppercase mb-2">हिंदी अर्थ</p>
            <p className="text-ink/80 leading-relaxed text-sm" lang="hi">{verse.hindi_meaning}</p>
          </div>
          <div>
            <p className="text-saffron/60 text-xs tracking-wider uppercase mb-2">English Meaning</p>
            <p className="text-ink/80 leading-relaxed text-sm">{verse.english_meaning}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap border-t border-saffron/10 pt-6">
          <div className="flex items-center gap-4">
            <ShareVerse reference={verse.reference} meaning={verse.english_meaning} />
            <SaveVerseButton
              reference={verse.reference}
              englishMeaning={verse.english_meaning}
              themes={verse.themes}
            />
          </div>
          <Link href="/" className="text-saffron/70 hover:text-saffron text-sm transition-colors">
            ← Ask your own question
          </Link>
        </div>
      </div>
    </main>
  )
}
