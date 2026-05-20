import { NextResponse } from 'next/server'
import { STORIES } from '@/lib/verseEngine'

export const runtime = 'nodejs'
export const revalidate = 86400

export async function GET() {
  return NextResponse.json({ stories: STORIES })
}
