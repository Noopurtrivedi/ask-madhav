import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/auth-email — Supabase Auth "Send Email Hook" receiver.
 *
 * Why this exists: Supabase's built-in mailer is dev-only (heavily rate
 * limited, delivers only to project team members) and its templates cannot be
 * edited without custom SMTP. Instead of SMTP, Supabase calls THIS endpoint
 * for every auth email; we compose a branded Ask Madhav email that shows the
 * one-time code prominently (plus the sign-in link) and send it via Resend.
 * This gives the email-OTP gate real deliverability AND full control of the
 * message — no template editing, no SMTP credentials in a dashboard.
 *
 * Configure in Supabase: Auth → Hooks → Send Email Hook → HTTPS endpoint
 * https://www.askmadhav.world/api/auth-email — then store the generated
 * secret as SEND_EMAIL_HOOK_SECRET (format `v1,whsec_<base64>`).
 *
 * Env (all required for the hook to work):
 *   SEND_EMAIL_HOOK_SECRET — from the Supabase hook config (verifies calls).
 *   RESEND_API_KEY         — Resend API key used to send.
 *   AUTH_EMAIL_FROM        — sender, e.g. 'Ask Madhav <madhav@askmadhav.world>'.
 *
 * Payload verification follows the Standard Webhooks spec Supabase uses:
 * HMAC-SHA256 over `${id}.${timestamp}.${rawBody}` with the base64 secret.
 */

interface EmailData {
  token?: string
  token_hash?: string
  redirect_to?: string
  email_action_type?: string
  site_url?: string
}

function verifySignature(secret: string, id: string, timestamp: string, body: string, sigHeader: string): boolean {
  try {
    const key = Buffer.from(secret.replace(/^v1,whsec_/, '').replace(/^whsec_/, ''), 'base64')
    const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest()
    // Header may carry several space-separated `v1,<base64>` signatures.
    for (const part of sigHeader.split(' ')) {
      const raw = part.startsWith('v1,') ? part.slice(3) : part
      const candidate = Buffer.from(raw, 'base64')
      if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return true
    }
  } catch {
    /* fall through */
  }
  return false
}

function actionSubject(type?: string): string {
  switch (type) {
    case 'recovery':
      return 'Reset your Ask Madhav access'
    case 'email_change':
      return 'Confirm your new email — Ask Madhav'
    default:
      return 'Your Ask Madhav sign-in code'
  }
}

function buildVerifyLink(d: EmailData): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base || !d.token_hash || !d.email_action_type) return null
  const redirect = d.redirect_to || process.env.NEXT_PUBLIC_SITE_URL || d.site_url || ''
  return (
    `${base}/auth/v1/verify?token=${encodeURIComponent(d.token_hash)}` +
    `&type=${encodeURIComponent(d.email_action_type)}&redirect_to=${encodeURIComponent(redirect)}`
  )
}

function buildHtml(code: string | undefined, link: string | null): string {
  const codeBlock = code
    ? `<p style="margin:0 0 8px;color:#c9b27c;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Your one-time code</p>
       <p style="margin:0 0 24px;font-size:34px;letter-spacing:10px;font-weight:700;color:#f5efe2;">${code}</p>`
    : ''
  const linkBlock = link
    ? `<a href="${link}" style="display:inline-block;background:#e8a33d;color:#141433;text-decoration:none;font-weight:600;border-radius:999px;padding:13px 30px;font-size:15px;">Sign in to Ask Madhav</a>
       <p style="margin:18px 0 0;color:#8c8fae;font-size:12px;">The link and code expire shortly and can be used once.</p>`
    : ''
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0e1030;">
  <div style="max-width:480px;margin:0 auto;padding:44px 24px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
    <p style="font-size:34px;margin:0 0 6px;">🪷</p>
    <h1 style="margin:0 0 6px;color:#f5efe2;font-size:26px;font-weight:700;">Ask Madhav</h1>
    <p style="margin:0 0 30px;color:#8c8fae;font-size:14px;">Enter as Parth — your seat in the dialogue is ready.</p>
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(201,178,124,0.25);border-radius:18px;padding:30px 22px;">
      ${codeBlock}
      ${linkBlock}
    </div>
    <p style="margin:28px 0 0;color:#5c5f7e;font-size:11px;line-height:1.6;">
      You received this because your email was used to sign in at askmadhav.world.<br/>
      If this wasn't you, you can safely ignore this email.<br/>
      Guidance offered through the lens of the Bhagavad Gita only — not professional advice.
    </p>
  </div></body></html>`
}

export async function POST(req: NextRequest) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET
  const resendKey = process.env.RESEND_API_KEY
  const from = process.env.AUTH_EMAIL_FROM
  if (!secret || !resendKey || !from) {
    return NextResponse.json({ error: 'auth email hook not configured' }, { status: 500 })
  }

  const body = await req.text()
  const id = req.headers.get('webhook-id') || ''
  const timestamp = req.headers.get('webhook-timestamp') || ''
  const signature = req.headers.get('webhook-signature') || ''
  if (!id || !timestamp || !signature || !verifySignature(secret, id, timestamp, body, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let email = ''
  let data: EmailData = {}
  try {
    const payload = JSON.parse(body) as { user?: { email?: string }; email_data?: EmailData }
    email = payload.user?.email || ''
    data = payload.email_data || {}
  } catch {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 })
  }
  if (!email) return NextResponse.json({ error: 'no recipient' }, { status: 400 })

  const link = buildVerifyLink(data)
  const code = data.token
  const textParts = [
    'Ask Madhav — sign in',
    code ? `Your one-time code: ${code}` : '',
    link ? `Or sign in with this link: ${link}` : '',
    'The code and link expire shortly and can be used once. If this was not you, ignore this email.',
  ].filter(Boolean)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: actionSubject(data.email_action_type),
      html: buildHtml(code, link),
      text: textParts.join('\n\n'),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('auth-email send failed', res.status, detail.slice(0, 300))
    return NextResponse.json({ error: 'send failed' }, { status: 500 })
  }
  return NextResponse.json({})
}
