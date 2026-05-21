import type { Metadata } from 'next'
import JournalApp from '@/components/journal/JournalApp'

export const metadata: Metadata = {
  title: 'Sankalpa Journal — Ask Madhav',
  description: 'Save verses, set a daily intention, and grow your reflection streak.',
}

export default function JournalPage() {
  return <JournalApp />
}
