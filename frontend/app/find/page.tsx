import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import SpeakButton from '@/components/SpeakButton'
import { cleanMeaning, FEELINGS } from '@/lib/chapters'
import { VERSES } from '@/lib/verseEngine'

export const metadata: Metadata = {
  title: 'Find your verse — Ask Madhav',
  description: 'Tell us how you feel and find a verse of the Bhagavad Gita for this moment.',
}

interface Props {
  searchParams: Promise<{ feeling?: string; n?: string }>
}

export default async function FindPage({ searchParams }: Props) {
  const { feeling, n } = await searchParams
  const chosen = FEELINGS.find((f) => f.id === feeling)
  const themes: readonly string[] = chosen?.themes ?? []
  const matches = chosen ? VERSES.filter((v) => (v.themes ?? []).some((t) => themes.includes(t))) : []

  // A stable walk through the matches, so "another verse" never repeats early.
  const step = Math.max(1, Math.floor(matches.length * 0.381))
  const index = Math.max(0, Number(n) || 0)
  const verse = matches.length ? matches[(index * step) % matches.length] : null

  return (
    <main className="darshan-page min-h-screen px-6 pb-24 pt-32">
      <Navbar />
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <p className="eyebrow mb-5">A verse for this moment</p>
          <h1 className="section-title">How do you <em className="gold-leaf">feel?</em></h1>
          <p className="section-lede mx-auto mt-4 max-w-lg">Choose what is closest. There is no wrong answer.</p>
        </header>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {FEELINGS.map((f) => (
            <Link key={f.id} href={`/find?feeling=${f.id}`} aria-current={f.id === chosen?.id ? 'true' : undefined} className="feeling-chip">
              {f.label}
            </Link>
          ))}
        </div>

        {chosen && verse && (
          <section className="sacred-card find-verse mt-10 rounded-3xl p-7 sm:p-10" key={verse.reference}>
            <p className="text-center text-sm text-gold-soft/85">{chosen.prompt}</p>
            <p className="mt-5 text-center font-sanskrit text-[1.5rem] leading-[1.8] text-moonlight sm:text-[1.8rem]" lang="sa">
              {verse.sanskrit_text}
            </p>
            <p className="mt-6 text-lg leading-relaxed text-moonlight/90">{cleanMeaning(verse.english_meaning)}</p>
            <div className="mt-6 border-l-2 border-gold/40 pl-5">
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-gold-soft/80">Try this today</p>
              <p className="leading-relaxed text-moonlight/85">{verse.practical_guidance}</p>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href={`/find?feeling=${chosen.id}&n=${index + 1}`} className="btn-leaf px-5 py-2.5 text-xs">Another verse</Link>
              <Link href={`/verse/${verse.reference}`} className="btn-ghost px-5 py-2.5 text-xs">Verse {verse.reference}</Link>
              <SpeakButton text={cleanMeaning(verse.english_meaning)} />
            </div>
          </section>
        )}

        <p className="mt-10 text-center text-sm text-moonlight/50">
          If you are in crisis or thinking of harming yourself, please reach out to a local helpline or someone you trust.
        </p>
      </div>
    </main>
  )
}
