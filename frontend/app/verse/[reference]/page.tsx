import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findVerse, VERSES } from '@/lib/verseEngine'
import Navbar from '@/components/Navbar'
import VerseAudio from '@/components/VerseAudio'
import ShareVerse from '@/components/ShareVerse'
import SaveVerseButton from '@/components/SaveVerseButton'
import ChapterBridge from '@/components/ChapterBridge'
import VerseInsight from '@/components/VerseInsight'

interface Props {
  params: Promise<{ reference: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reference } = await params
  const verse = findVerse(decodeURIComponent(reference))
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

export default async function VersePage({ params }: Props) {
  const { reference } = await params
  const verse = findVerse(decodeURIComponent(reference))
  if (!verse) notFound()

  // Neighbours in reading order, so a seeker who lands from a shared link can
  // keep reading the Gita instead of hitting a dead end.
  const i = VERSES.findIndex((v) => v.reference === verse.reference)
  const prev = i > 0 ? VERSES[i - 1] : null
  const next = i >= 0 && i < VERSES.length - 1 ? VERSES[i + 1] : null

  return (
    <main className="darshan-page min-h-screen px-6 pb-24 pt-32">
      <Navbar />

      <div className="mx-auto max-w-3xl">
        {/* Title */}
        <header className="text-center">
          <p className="eyebrow mb-5">
            Bhagavad Gita · Chapter {verse.chapter_number}
          </p>
          <h1 className="section-title">
            Verse <em className="gold-leaf">{verse.reference}</em>
          </h1>
          {(verse.themes || []).length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(verse.themes || []).slice(0, 3).map((t) => (
                <span key={t} className="rounded-full border border-gold/25 px-3 py-1 text-xs capitalize text-gold-soft/85">
                  {t}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* The shloka itself — the centrepiece, set large on the sky. */}
        <section className="mt-12 text-center">
          <p className="font-sanskrit text-[1.7rem] leading-[1.75] text-moonlight sm:text-[2.1rem]" lang="sa">
            {verse.sanskrit_text}
          </p>
          <div className="mt-6 flex justify-center">
            <VerseAudio text={verse.transliteration} meditation />
          </div>
          <div className="ornament-rule mt-10" aria-hidden="true">
            <span className="h-1.5 w-1.5 rotate-45 bg-gold-soft/60" />
          </div>
        </section>

        <div className="sacred-card mt-10 rounded-3xl p-7 sm:p-10">
          {/* Practical step first — guidance for the moment, then the meaning. */}
          <div className="mb-8 border-l-2 border-gold/40 pl-5">
            <p className="font-caps mb-2 text-[0.68rem] uppercase tracking-[0.26em] text-gold-soft/80">Practical step</p>
            <p className="font-display text-xl leading-relaxed text-moonlight/90">{verse.practical_guidance}</p>
          </div>

          <div className="mb-8 grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-gold-soft/75" lang="hi">हिंदी अर्थ</p>
              <p className="font-hindi text-[0.95rem] leading-relaxed text-moonlight/80" lang="hi">{verse.hindi_meaning}</p>
            </div>
            <div>
              <p className="font-caps mb-2 text-[0.68rem] uppercase tracking-[0.26em] text-gold-soft/80">English meaning</p>
              <p className="text-[0.95rem] leading-relaxed text-moonlight/80">{verse.english_meaning}</p>
            </div>
          </div>

          {/* Go deeper — the same study companion Daily Wisdom uses */}
          <div className="mb-8">
            <VerseInsight reference={verse.reference} />
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-gold/15 pt-6">
            <ShareVerse reference={verse.reference} meaning={verse.english_meaning} />
            <SaveVerseButton reference={verse.reference} englishMeaning={verse.english_meaning} themes={verse.themes} />
            <ChapterBridge chapter={verse.chapter_number} />
          </div>
        </div>

        {/* Keep reading */}
        <nav aria-label="Verse navigation" className="mt-10 flex items-center justify-between gap-4">
          {prev ? (
            <Link href={`/verse/${prev.reference}`} className="caps-link">
              ← Verse {prev.reference}
            </Link>
          ) : (
            <span />
          )}
          <Link href="/#chat" className="btn-ghost px-5 py-2.5 text-sm">
            Ask your own question
          </Link>
          {next ? (
            <Link href={`/verse/${next.reference}`} className="caps-link">
              Verse {next.reference} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  )
}
