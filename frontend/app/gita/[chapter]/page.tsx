import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ChapterProgress from '@/components/gita/ChapterProgress'
import VerseReader, { type ReaderVerse } from '@/components/gita/VerseReader'
import { CHAPTERS, cleanMeaning, pageCount, VERSES_PER_PAGE } from '@/lib/chapters'
import { VERSES } from '@/lib/verseEngine'

interface Props {
  params: Promise<{ chapter: string }>
  searchParams: Promise<{ page?: string }>
}

const findChapter = (value: string) => CHAPTERS.find((c) => String(c.n) === value)
const pageHref = (chapter: number, page: number) => `/gita/${chapter}${page > 1 ? `?page=${page}` : ''}`

/** Page numbers with gaps, so a long chapter stays one tidy row. */
function pageList(current: number, total: number): (number | null)[] {
  const wanted = new Set([1, total, current - 1, current, current + 1])
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? [null, p] : [p]))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const chapter = findChapter((await params).chapter)
  if (!chapter) return { title: 'Chapter not found — Ask Madhav' }
  return {
    title: `Chapter ${chapter.n}: ${chapter.yoga} — Bhagavad Gita`,
    description: chapter.summary,
  }
}

export default async function ChapterPage({ params, searchParams }: Props) {
  const chapter = findChapter((await params).chapter)
  if (!chapter) notFound()

  const total = pageCount(chapter.verses)
  const asked = Number((await searchParams).page ?? 1)
  const page = Number.isInteger(asked) && asked >= 1 && asked <= total ? asked : 1

  const verses: ReaderVerse[] = VERSES.filter((v) => v.chapter_number === chapter.n)
    .slice((page - 1) * VERSES_PER_PAGE, page * VERSES_PER_PAGE)
    .map((v) => ({
      reference: v.reference,
      verse_number: v.verse_number,
      sanskrit_text: v.sanskrit_text,
      transliteration: v.transliteration,
      hindi_meaning: cleanMeaning(v.hindi_meaning),
      english_meaning: cleanMeaning(v.english_meaning),
      practical_guidance: v.practical_guidance,
      themes: v.themes ?? [],
    }))

  const prevChapter = CHAPTERS[chapter.n - 2]
  const nextChapter = CHAPTERS[chapter.n]
  const prevHref = page > 1 ? pageHref(chapter.n, page - 1) : prevChapter ? `/gita/${prevChapter.n}` : null
  const nextHref = page < total ? pageHref(chapter.n, page + 1) : nextChapter ? `/gita/${nextChapter.n}` : null

  return (
    <main className="darshan-page min-h-screen px-6 pb-24 pt-32">
      <Navbar />
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-8 text-center text-sm text-moonlight/55">
          <Link href="/gita" className="transition-colors hover:text-gold-soft">The Gita</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Chapter {chapter.n}</span>
        </nav>

        <header className="text-center">
          <p className="eyebrow mb-5">Chapter {chapter.n} · {chapter.verses} verses</p>
          <h1 className="section-title">{chapter.yoga}</h1>
          <p className="mt-2 font-display text-xl text-gold-soft">{chapter.short}</p>
          <p className="section-lede mx-auto mt-4 max-w-xl">{chapter.summary}</p>
          <ChapterProgress chapter={chapter.n} total={chapter.verses} prevHref={prevHref} nextHref={nextHref} />
        </header>

        <div className="mt-10">
          <VerseReader key={`${chapter.n}-${page}`} verses={verses} />
        </div>

        <nav aria-label="Chapter pages" className="reader-pages">
          {prevHref ? (
            <Link href={prevHref} className="caps-link">← {page > 1 ? 'Previous' : `Chapter ${chapter.n - 1}`}</Link>
          ) : (
            <span />
          )}
          <ol className="flex items-center gap-1">
            {pageList(page, total).map((p, i) => (
              <li key={p ?? `gap-${i}`}>
                {p === null ? (
                  <span className="px-1 text-moonlight/40">…</span>
                ) : (
                  <Link
                    href={pageHref(chapter.n, p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    className="reader-page"
                  >
                    {p}
                  </Link>
                )}
              </li>
            ))}
          </ol>
          {nextHref ? (
            <Link href={nextHref} className="caps-link">{page < total ? 'Next' : `Chapter ${chapter.n + 1}`} →</Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  )
}
