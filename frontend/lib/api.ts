import type { AskResponse, DailyVerseResponse, StoriesResponse } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function askQuestion(question: string): Promise<AskResponse> {
  const res = await fetch(`${API_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to get response from Madhav')
  }
  return res.json()
}

export async function getDailyVerse(): Promise<DailyVerseResponse> {
  const res = await fetch(`${API_URL}/daily-verse`)
  if (!res.ok) throw new Error('Failed to fetch daily verse')
  return res.json()
}

export async function getStories(): Promise<StoriesResponse> {
  const res = await fetch(`${API_URL}/stories`)
  if (!res.ok) throw new Error('Failed to fetch stories')
  return res.json()
}
