import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SpeakButton from '@/components/SpeakButton'
import StoryQuestion from '@/components/gita/StoryQuestion'
import { STORIES } from '@/lib/verseEngine'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return STORIES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const story = STORIES.find((s) => s.slug === slug)
  if (!story) return { title: 'Story not found — Ask Madhav' }
  return { title: `${story.title} — Ask Madhav`, description: story.description }
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params
  const i = STORIES.findIndex((s) => s.slug === slug)
  if (i < 0) notFound()
  const story = STORIES[i]
  const prev = STORIES[i - 1]
  const next = STORIES[i + 1]
  const narration = story.narration ?? story.description

  return (
    <main className="darshan-page min-h-screen px-6 pb-24 pt-32">
      <Navbar />
      <article className="mx-auto max-w-2xl">
        <nav aria-label="Breadcrumb" className="mb-8 text-center text-sm text-moonlight/55">
          <Link href="/stories" className="transition-colors hover:text-gold-soft">Stories</Link>
        </nav>
        <header className="text-center">
          <p className="eyebrow mb-5">{story.characters.slice(0, 3).join(' · ')}</p>
          <h1 className="section-title">{story.title}</h1>
          <div className="mt-5 flex justify-center">
            <SpeakButton text={`${story.title}. ${narration}`} />
          </div>
        </header>

        <div className="mt-10 space-y-5 text-[1.08rem] leading-[1.85] text-moonlight/85">
          {narration.split(/\n\n+/).map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        </div>

        <section className="sacred-card mt-10 rounded-3xl p-7 sm:p-9">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold-soft/80">Inspiration</p>
          <p className="font-display text-xl leading-relaxed text-moonlight/90">{story.moral}</p>
          <p className="mb-2 mt-7 text-xs uppercase tracking-[0.2em] text-gold-soft/80">Lesson</p>
          <p className="leading-relaxed text-moonlight/85">{story.lesson}</p>
          {(story.gita_refs ?? []).length > 0 && (
            <>
              <p className="mb-2 mt-7 text-xs uppercase tracking-[0.2em] text-gold-soft/80">In the Gita</p>
              <ul className="space-y-2">
                {(story.gita_refs ?? []).map((r) => (
                  <li key={r.ref} className="text-sm leading-relaxed text-moonlight/75">
                    <Link href={`/verse/${r.ref}`} className="font-semibold text-gold-soft hover:underline">{r.ref}</Link> {r.line}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <StoryQuestion title={story.title} question={story.reflection} />

        <nav aria-label="More stories" className="mt-10 flex items-center justify-between gap-4">
          {prev ? <Link href={`/stories/${prev.slug}`} className="caps-link">← Previous</Link> : <span />}
          {next ? <Link href={`/stories/${next.slug}`} className="caps-link">Next story →</Link> : <span />}
        </nav>
      </article>
    </main>
  )
}
