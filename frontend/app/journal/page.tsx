import type { Metadata } from 'next'
import JournalApp from '@/components/journal/JournalApp'

export const metadata: Metadata = {
  title: 'The Final Journal — Ask Madhav',
  description: 'A private Gita-based practice for sankalpa, gratitude, self-inquiry, and next right action.',
}

export default function JournalPage() {
  return <JournalApp />
}
