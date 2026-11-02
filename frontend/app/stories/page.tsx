import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import StoryLibrary from '@/components/gita/StoryLibrary'
import { STORIES } from '@/lib/verseEngine'

export const metadata: Metadata = {
  title: 'Mahabharata stories — Ask Madhav',
  description: 'Stories from the Mahabharata, retold in our own words, each with a lesson and a question to think about.',
}

export default function StoriesPage() {
  const stories = STORIES.map(({ slug, title, description, characters }) => ({ slug, title, description, characters }))
  return (
    <main className="darshan-page min-h-screen px-6 pb-24 pt-32">
      <Navbar />
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <p className="eyebrow mb-5">The Mahabharata</p>
          <h1 className="section-title">Stories that <em className="gold-leaf">ask</em> something of you</h1>
          <p className="section-lede mx-auto mt-4 max-w-xl">
            Retold in our own words, based on the Critical Edition. Each ends with a question, not an answer.
          </p>
        </header>
        <StoryLibrary stories={stories} />
      </div>
    </main>
  )
}
