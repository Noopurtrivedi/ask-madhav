import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Gemini TTS gives a guaranteed calm MALE voice (and speaks Hindi), using the
// same GEMINI_API_KEY as the chat — so Madhav sounds male on every device, not
// only where a male system voice happens to be installed. If the key is unset
// or the call fails, we return 503 and the client falls back to the browser's
// SpeechSynthesis voice. Audio is returned as WAV (PCM wrapped with a header).
const MODEL = 'gemini-2.5-flash-preview-tts'
const VOICE = 'Charon' // deep, calm male
const MAX_CHARS = 1800

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

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ error: 'tts unavailable' }, { status: 503 })

  let text = ''
  try {
    const body = await req.json()
    text = typeof body?.text === 'string' ? body.text.slice(0, MAX_CHARS) : ''
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  if (!text.trim()) return NextResponse.json({ error: 'empty text' }, { status: 400 })

  // A gentle style instruction shapes the delivery (Gemini TTS honours prose
  // direction). The voice itself is fixed male.
  const prompt = `Read this aloud slowly, calmly and warmly, like a wise, gentle teacher speaking from the heart:\n\n${text}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
          },
        }),
      },
    )
    clearTimeout(timeout)
    if (!res.ok) return NextResponse.json({ error: 'tts failed' }, { status: 503 })

    const data = await res.json()
    const part = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData
    if (!part?.data) return NextResponse.json({ error: 'no audio' }, { status: 503 })

    const rate = Number(/rate=(\d+)/.exec(part.mimeType || '')?.[1]) || 24000
    const wav = wrapWav(Buffer.from(part.data, 'base64'), rate)
    const bytes = new Uint8Array(wav) // plain view → valid response body

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(bytes.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ error: 'tts error' }, { status: 503 })
  }
}
