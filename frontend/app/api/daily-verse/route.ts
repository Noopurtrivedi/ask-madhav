import { NextResponse } from 'next/server'
import { dailyVerse, VERSES } from '@/lib/verseEngine'

export const runtime = 'nodejs'
// Cache for the day — the verse only changes once per day.
export const revalidate = 3600

export async function GET() {
  try {
    const verse = dailyVerse()
    return NextResponse.json({ date: new Date().toISOString().slice(0, 10), verse })
  } catch (err) {
    console.error('daily-verse error', err)
    // Fallback to the first verse so the section always has content.
    return NextResponse.json({ date: new Date().toISOString().slice(0, 10), verse: VERSES[0] ?? null })
  }
}
