import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import GitaLibrary from '@/components/gita/GitaLibrary'

export const metadata: Metadata = {
  title: 'The Bhagavad Gita, 18 chapters — Ask Madhav',
  description: 'Read all 18 chapters and 701 verses of the Bhagavad Gita in Sanskrit, Hindi and English.',
}

export default function GitaPage() {
  return (
    <main className="darshan-page min-h-screen px-6 pb-24 pt-32">
      <Navbar />
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <p className="eyebrow mb-5">18 chapters · 701 verses</p>
          <h1 className="section-title">The Bhagavad <em className="gold-leaf">Gita</em></h1>
          <p className="section-lede mx-auto mt-4 max-w-xl">
            Read it from the first doubt to the final surrender, one verse at a time.
          </p>
        </header>
        <GitaLibrary />
      </div>
    </main>
  )
}
