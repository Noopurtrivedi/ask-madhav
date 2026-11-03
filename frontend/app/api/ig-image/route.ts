import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { isVertexConfigured, vertexPredict } from '@/lib/vertex'
import { authorised } from '@/lib/factcheck/verdict'

export const runtime = 'nodejs'
export const maxDuration = 90

// Imagen 4 is $0.04 an image on Vertex (Fast is $0.02, Ultra $0.06).
const MODEL = process.env.IG_IMAGE_MODEL || 'imagen-4.0-generate-001'
const RATIOS = new Set(['3:4', '9:16', '1:1'])

/**
 * POST /api/ig-image: fallback picture source for the Instagram routine when
 * Canva can't deliver a full-size file. Returns one JPEG. Same bearer secret as
 * the fact checker, and rate-limited, because every call costs money.
 *
 * Body: { prompt: string, aspectRatio: "3:4" | "9:16" | "1:1" }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.FACTCHECK_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured.' }, { status: 503 })
  if (!authorised(req.headers.get('authorization'), secret)) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }
  if (!isVertexConfigured()) return NextResponse.json({ error: 'Vertex is not configured.' }, { status: 503 })
  if (!(await checkRateLimit('ig-image'))) return NextResponse.json({ error: 'Rate limited.' }, { status: 429 })

  try {
    const { prompt, aspectRatio } = (await req.json()) as { prompt?: string; aspectRatio?: string }
    const text = String(prompt ?? '').trim().slice(0, 1500)
    if (!text) return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    const ratio = RATIOS.has(String(aspectRatio)) ? String(aspectRatio) : '3:4'

    const res = (await vertexPredict(MODEL, {
      instances: [{ prompt: text }],
      parameters: {
        sampleCount: 1,
        aspectRatio: ratio,
        personGeneration: 'allow_adult',
        addWatermark: true,
        outputOptions: { mimeType: 'image/jpeg', compressionQuality: 92 },
      },
    })) as { predictions?: { bytesBase64Encoded?: string; raiFilteredReason?: string }[] } | null

    const p = res?.predictions?.[0]
    if (!p?.bytesBase64Encoded) {
      return NextResponse.json({ error: p?.raiFilteredReason ? `Filtered: ${p.raiFilteredReason}` : 'No image returned.' }, { status: 502 })
    }
    return new NextResponse(Buffer.from(p.bytesBase64Encoded, 'base64'), {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'X-Model': MODEL },
    })
  } catch (err) {
    console.error('ig-image error', err)
    return NextResponse.json({ error: 'Image generation failed.' }, { status: 500 })
  }
}
