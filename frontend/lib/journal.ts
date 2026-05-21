'use client'

import { getBrowserClient } from '@/lib/supabase/client'

export interface SavedVerse {
  id: string
  reference: string
  english_meaning: string | null
  themes: string[]
  created_at: string
}

export interface JournalEntry {
  id?: string
  entry_date: string
  mood: string | null
  intention: string | null
  reflection: string | null
}

export const MOODS = ['😟 Anxious', '😔 Low', '😐 Neutral', '🙂 Calm', '😌 Peaceful', '🔥 Driven']

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function fetchSavedVerses(): Promise<SavedVerse[]> {
  const supabase = getBrowserClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('saved_verses')
    .select('id, reference, english_meaning, themes, created_at')
    .order('created_at', { ascending: false })
  return (data as SavedVerse[]) || []
}

export async function saveVerse(
  userId: string,
  reference: string,
  englishMeaning: string,
  themes: string[],
): Promise<boolean> {
  const supabase = getBrowserClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('saved_verses')
    .upsert(
      { user_id: userId, reference, english_meaning: englishMeaning, themes },
      { onConflict: 'user_id,reference' },
    )
  return !error
}

export async function removeVerse(reference: string): Promise<boolean> {
  const supabase = getBrowserClient()
  if (!supabase) return false
  const { error } = await supabase.from('saved_verses').delete().eq('reference', reference)
  return !error
}

export async function fetchJournal(): Promise<JournalEntry[]> {
  const supabase = getBrowserClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('journal_entries')
    .select('id, entry_date, mood, intention, reflection')
    .order('entry_date', { ascending: false })
  return (data as JournalEntry[]) || []
}

export async function upsertTodayEntry(
  userId: string,
  entry: Omit<JournalEntry, 'entry_date' | 'id'>,
): Promise<boolean> {
  const supabase = getBrowserClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('journal_entries')
    .upsert(
      { user_id: userId, entry_date: todayISO(), ...entry },
      { onConflict: 'user_id,entry_date' },
    )
  return !error
}

/** Consecutive-day streak ending today or yesterday. */
export function computeStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0
  const dates = new Set(entries.map((e) => e.entry_date))
  let streak = 0
  const cursor = new Date()
  // Allow the streak to count from today; if no entry today, start from yesterday.
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Top recurring themes across saved verses, for the insight line. */
export function computeThemeInsights(saved: SavedVerse[]): { theme: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const v of saved) {
    for (const t of v.themes || []) {
      const key = t.toLowerCase()
      counts.set(key, (counts.get(key) || 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
}
