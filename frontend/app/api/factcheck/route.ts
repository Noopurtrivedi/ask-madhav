import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { isVertexConfigured } from '@/lib/vertex'
import { drikCheck, iitkCheck } from '@/lib/factcheck/sources'
import { FACTCHECK_MODEL, judge, type HistoryItem } from '@/lib/factcheck/judge'
import { textChecks, verseChecks, type PostDraft } from '@/lib/factcheck/rules'
import { authorised, contentHash, issueToken } from '@/lib/factcheck/verdict'

export const runtime = 'nodejs'
export const maxDuration = 90

const PASS_MARK = 90
const MAX_ATTEMPTS = 3

/**
 * POST /api/factcheck: the autonomous gate for Instagram posts.
 *
 * Code checks the hard facts, Gemini on Vertex scores credibility and trend
 * potential, and code decides: publish only if every hard check passes and both
 * scores are 90 or above. Below that it asks for a revision, and after three
 * attempts it blocks. Any error is a block, never a pass.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.FACTCHECK_SECRET
  if (!secret) return NextResponse.json({ decision: 'block', reason: 'Fact checker is not configured.' }, { status: 503 })
  if (!authorised(req.headers.get('authorization'), secret)) {
    return NextResponse.json({ decision: 'block', reason: 'Unauthorised.' }, { status: 401 })
  }
  if (!(await checkRateLimit('factcheck'))) {
    return NextResponse.json({ decision: 'block', reason: 'Rate limited.' }, { status: 429 })
  }

  try {
    const body = (await req.json()) as { post: PostDraft; history?: HistoryItem[]; attempt?: number; today?: string }
    const post = body.post
    if (!post || !Array.isArray(post.media) || !Array.isArray(post.verses) || !Array.isArray(post.onImageText)) {
      return NextResponse.json({ decision: 'block', reason: 'Malformed post.' }, { status: 400 })
    }
    post.caption = String(post.caption ?? '').slice(0, 5000)
    const attempt = Math.max(1, Number(body.attempt) || 1)
    const today = body.today || new Date().toISOString().slice(0, 10)

    const hard = [
      ...verseChecks(post),
      ...textChecks(post),
      ...(await Promise.all(post.verses.map(iitkCheck))),
      ...(await Promise.all((post.dates ?? []).map(drikCheck))),
    ]
    const hardPass = hard.every((c) => c.pass)

    const scores = isVertexConfigured() ? await judge(post, (body.history ?? []).slice(0, 15), today) : null
    if (!scores) {
      return NextResponse.json({ decision: 'block', reason: 'Gemini review unavailable, so nothing can be approved.', hard, model: FACTCHECK_MODEL })
    }

    const passes = hardPass && scores.credibility.score >= PASS_MARK && scores.trend.score >= PASS_MARK
    const decision = passes ? 'publish' : attempt >= MAX_ATTEMPTS ? 'block' : 'revise'
    const hash = contentHash(post.caption, post.media)

    return NextResponse.json({
      decision,
      attempt,
      model: FACTCHECK_MODEL,
      passMark: PASS_MARK,
      hash,
      hard,
      credibility: scores.credibility,
      trend: scores.trend,
      fixes: [...hard.filter((c) => !c.pass).map((c) => `${c.check}: ${c.detail}`), ...scores.fixes],
      verdict: passes ? issueToken(hash, scores.credibility.score, scores.trend.score, secret) : null,
    })
  } catch (err) {
    console.error('factcheck error', err)
    return NextResponse.json({ decision: 'block', reason: 'Fact check failed.' }, { status: 500 })
  }
}
