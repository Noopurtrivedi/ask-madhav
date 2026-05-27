/**
 * Meta WhatsApp Cloud API client — the outbound side of the WhatsApp channel.
 *
 * All config is env-gated (like every other integration in this app). With no
 * env vars set, `isWhatsAppConfigured()` is false and the webhook stays inert.
 *
 * Env vars (set in Vercel / .env.local — see WHATSAPP_SETUP.md):
 *   WHATSAPP_ACCESS_TOKEN     — Graph API token for the WhatsApp Business app
 *   WHATSAPP_PHONE_NUMBER_ID  — id of the sending number (NOT the phone number)
 *   WHATSAPP_VERIFY_TOKEN     — arbitrary secret echoed during webhook setup
 *   WHATSAPP_APP_SECRET       — (optional) used to verify X-Hub-Signature-256
 *   WHATSAPP_GRAPH_VERSION    — (optional) Graph API version, default v21.0
 */
import crypto from 'crypto'

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0'

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

// WhatsApp caps a text message body at 4096 chars. We chunk on paragraph/word
// boundaries so a long reply arrives as a few clean messages instead of one
// hard-truncated blob.
const MAX_BODY = 4000

export function chunkMessage(text: string, max = MAX_BODY): string[] {
  const clean = text.trim()
  if (clean.length <= max) return [clean]
  const chunks: string[] = []
  let remaining = clean
  while (remaining.length > max) {
    // Prefer to break at the last paragraph, then sentence, then space.
    const window = remaining.slice(0, max)
    const breakAt =
      window.lastIndexOf('\n\n') > max * 0.5
        ? window.lastIndexOf('\n\n')
        : window.lastIndexOf('. ') > max * 0.5
          ? window.lastIndexOf('. ') + 1
          : window.lastIndexOf(' ') > 0
            ? window.lastIndexOf(' ')
            : max
    chunks.push(remaining.slice(0, breakAt).trim())
    remaining = remaining.slice(breakAt).trim()
  }
  if (remaining) chunks.push(remaining)
  return chunks
}

/**
 * Send one or more text messages to a WhatsApp user (E.164 number, no '+').
 * Long bodies are split into multiple messages. Never throws — logs and
 * returns false so the webhook can still 200.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) {
    console.error('sendWhatsAppText: WhatsApp not configured')
    return false
  }

  const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`
  const parts = chunkMessage(body)

  for (const part of parts) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: part },
        }),
      })
      if (!res.ok) {
        console.error('WhatsApp send error', res.status, await res.text().catch(() => ''))
        return false
      }
    } catch (err) {
      console.error('WhatsApp send request failed', err)
      return false
    }
  }
  return true
}

/**
 * Verify Meta's X-Hub-Signature-256 header (HMAC-SHA256 of the raw body using
 * the app secret). Returns true when no secret is configured (verification is
 * opt-in), so the webhook works before you wire the secret — but set
 * WHATSAPP_APP_SECRET in production to reject forged requests.
 */
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) return true // verification not enabled
  if (!signatureHeader) return false
  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  // timing-safe compare; lengths must match first
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
