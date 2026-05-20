import { NextRequest, NextResponse } from 'next/server'
import { scoreVerses, buildTemplateAnswer } from '@/lib/verseEngine'
import { generateGuidance, type ChatTurn } from '@/lib/gemini'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: { question?: string; history?: ChatTurn[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 })
  }

  const question = (body.question || '').trim()
  if (question.length < 3) {
    return NextResponse.json({ detail: 'Please ask a meaningful question.' }, { status: 400 })
  }

  const matched = scoreVerses(question)

  // RAG: ground an LLM reply in the retrieved verses. Falls back to the
  // deterministic template engine when no GEMINI_API_KEY is set.
  const answer = await generateGuidance(question, matched, body.history || [])

  const base = buildTemplateAnswer(question, matched)
  return NextResponse.json({
    ...base,
    answer: answer ?? base.answer,
    source: answer ? 'ai' : 'template',
  })
}
