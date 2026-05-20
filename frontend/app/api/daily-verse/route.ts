import { NextResponse } from 'next/server'
import { dailyVerse } from '@/lib/verseEngine'

export const runtime = 'nodejs'
// Cache for the day — the verse only changes once per day.
export const revalidate = 3600

export async function GET() {
  const verse = dailyVerse()
  return NextResponse.json({
    date: new Date().toISOString().slice(0, 10),
    verse,
  })
}
