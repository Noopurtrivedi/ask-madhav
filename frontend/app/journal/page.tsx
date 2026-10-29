import type { Metadata } from 'next'
import AuthGate from '@/components/auth/AuthGate'
import JournalApp from '@/components/journal/JournalApp'

export const metadata: Metadata = {
  title: 'Sankalpa Journal — Ask Madhav',
  description: 'A private Gita-based practice for sankalpa, gratitude, self-inquiry, and next right action.',
}

export default function JournalPage() {
  // The Journal is account-bound (saved verses, streaks, reflections), so it is
  // the one route behind sign-in; verses, chat and stories stay open.
  return (
    <AuthGate>
      <JournalApp />
    </AuthGate>
  )
}
