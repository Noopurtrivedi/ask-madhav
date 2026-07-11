import { NextRequest, NextResponse } from 'next/server'
import { isVertexConfigured, vertexGenerateContent } from '@/lib/vertex'

export const runtime = 'nodejs'

// Gemini TTS gives a guaranteed calm MALE voice (and speaks Hindi) — so Madhav
// sounds male on every device, not only where a male system voice happens to be
// installed. Audio is returned as WAV (PCM wrapped with a header).
//
// Transport chain (mirrors the chat pipeline's discipline in CLAUDE.md):
//   1. Vertex AI  — preferred when GOOGLE_VERTEX_* is configured. Spends your
//      GCP Vertex credits (service-account OAuth), NOT the metered Gemini API.
//   2. Gemini API key (GEMINI_API_KEY) — fallback if Vertex is unset or fails.
//   3. If both are unavailable → 503, and the client (SpeakButton.tsx) falls
//      back to the browser's built-in SpeechSynthesis voice.
//
// Model: Flash-Lite is the cheapest, lowest-latency Gemini TTS tier. Override
// with the TTS_MODEL env var without a code change — e.g. set it to
// 'gemini-2.5-flash-preview-tts' for higher quality, or if your Vertex region
// does not yet serve the Flash-Lite TTS model (Flash TTS has wider Vertex
// coverage) so that the Vertex/credits path is actually used.
const MODEL = process.env.TTS_MODEL || 'gemini-2.5-flash-lite-preview-tts'
const VOICE = 'Charon' // deep, calm male
const MAX_CHARS = 1800

// The accent lever. Gemini TTS honours a BCP-47 languageCode in speechConfig and
// uses it to pick the *accent/pronunciation*, not just the language. We always
// route English/Hinglish through the Indian-English locale (en-IN) and Hindi
// through hi-IN — so Madhav carries a natural Hindi/Indian accent on every reply
// instead of a flat American/British English default.
function languageCode(language: unknown): string {
  return language === 'hindi' ? 'hi-IN' : 'en-IN'
}

function wrapWav(pcm: Buffer, sampleRate: number): Buffer {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

// Both Vertex and the public Gemini API return the same generateContent shape:
// candidates[0].content.parts[0].inlineData = { data: <base64 PCM>, mimeType }.
// Vertex emits raw PCM (16-bit, 24 kHz) with no WAV header — which is exactly
// what wrapWav() adds, so one extractor serves both transports.
type InlineAudio = { data: string; mimeType?: string }
function extractAudio(data: unknown): InlineAudio | null {
  const part = (data as {
    candidates?: { content?: { parts?: { inlineData?: InlineAudio }[] } }[]
  })?.candidates?.[0]?.content?.parts?.[0]?.inlineData
  return part?.data ? part : null
}

function wavResponse(audio: InlineAudio): NextResponse {
  const rate = Number(/rate=(\d+)/.exec(audio.mimeType || '')?.[1]) || 24000
  const wav = wrapWav(Buffer.from(audio.data, 'base64'), rate)
  const bytes = new Uint8Array(wav) // plain view → valid response body
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': String(bytes.length),
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  const vertex = isVertexConfigured()
  if (!key && !vertex) {
    return NextResponse.json({ error: 'tts unavailable' }, { status: 503 })
  }

  let text = ''
  let lang: unknown
  try {
    const body = await req.json()
    text = typeof body?.text === 'string' ? body.text.slice(0, MAX_CHARS) : ''
    lang = body?.language
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  if (!text.trim()) return NextResponse.json({ error: 'empty text' }, { status: 400 })

  // A style instruction shapes the delivery (Gemini TTS honours prose direction).
  // The voice is fixed male; the languageCode below fixes the accent. We push
  // hard for a HUMAN, un-robotic delivery — a real Indian teacher speaking in
  // person: natural breaths and pauses, gentle warmth, unhurried, with the soft
  // musical intonation of an Indian speaker (never a flat, clipped English
  // newsreader). Any Sanskrit / Devanagari word is recited reverently, each
  // syllable sounded fully (Indian recitation cadence, no dropped final vowels).
  const prompt = `Speak this the way a warm, wise Indian teacher would say it to you in person — with a natural, clear Indian (Hindi) accent, gentle and heartfelt, never robotic or flat. Use real human intonation: soft rises and falls, natural pauses and breaths between thoughts, an unhurried and soothing pace. When you reach any Sanskrit or Devanagari words, recite them reverently with authentic Indian pronunciation, sounding each syllable fully and clearly:\n\n${text}`

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        languageCode: languageCode(lang),
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
      },
    },
  }

  // 1) Vertex first — this is the path that spends your GCP credits.
  if (vertex) {
    const data = await vertexGenerateContent(MODEL, requestBody, 25000)
    const audio = data ? extractAudio(data) : null
    if (audio) return wavResponse(audio)
    // Vertex unavailable in this region / model not served / error → fall
    // through to the Gemini API key (if present) rather than hard-failing.
  }

  // 2) Public Gemini API key fallback.
  if (key) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(requestBody),
        },
      )
      clearTimeout(timeout)
      if (res.ok) {
        const audio = extractAudio(await res.json())
        if (audio) return wavResponse(audio)
      }
    } catch {
      clearTimeout(timeout)
    }
  }

  return NextResponse.json({ error: 'tts failed' }, { status: 503 })
}
