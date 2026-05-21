import type { AskResponse, DailyVerseResponse, StoriesResponse, UserProfile, Verse } from '@/types'

// The verse engine now runs inside Next.js API routes (same origin), so no
// external backend URL is needed. NEXT_PUBLIC_API_URL is still honored if set,
// for anyone who wants to point at a standalone backend.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export async function askQuestion(
  question: string,
  history: ChatTurn[] = [],
  profile?: UserProfile,
): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history, profile }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to get response from Madhav')
  }
  return res.json()
}

export async function getDailyVerse(): Promise<DailyVerseResponse> {
  const res = await fetch(`${API_BASE}/api/daily-verse`)
  if (!res.ok) throw new Error('Failed to fetch daily verse')
  return res.json()
}

// Fetch full verse data (Sanskrit, Hindi, English, etc.) for a set of
// references — used by the Popular Verses cards. Misses are silently dropped.
export async function getVerses(refs: string[]): Promise<Verse[]> {
  if (refs.length === 0) return []
  const res = await fetch(`${API_BASE}/api/verse?refs=${encodeURIComponent(refs.join(','))}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.verses as Verse[]) || []
}

export async function getStories(): Promise<StoriesResponse> {
  const res = await fetch(`${API_BASE}/api/stories`)
  if (!res.ok) throw new Error('Failed to fetch stories')
  return res.json()
}
