import { Resend } from 'resend'
import type { RawVerse } from '@/lib/verseEngine'

const FROM = process.env.DAILY_RITUAL_FROM_EMAIL || 'Ask Madhav <onboarding@resend.dev>'

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

// A short reflective question to carry the verse from reading into the day.
// Tuned to the verse's leading theme when present; otherwise a gentle default.
function reflectionPrompt(verse: RawVerse): string {
  const theme = verse.themes?.[0]?.toLowerCase()
  if (theme) {
    return `Where in your life today does ${theme} ask something of you — and what is one small step you can take?`
  }
  return 'Where in your life today does this verse ask something of you — and what is one small step you can take?'
}

function verseEmailHtml(verse: RawVerse, unsubscribeUrl: string, siteUrl: string): string {
  const journalUrl = siteUrl ? `${siteUrl}/journal` : ''
  return `
  <div style="background:#0A0F2E;padding:32px;font-family:Georgia,serif;color:#FFF8E7">
    <div style="max-width:560px;margin:0 auto;border:1px solid rgba(232,166,32,0.25);border-radius:16px;padding:28px">
      <p style="color:#E8A620;letter-spacing:3px;font-size:12px;text-transform:uppercase;margin:0 0 8px">Today's Verse · Ask Madhav</p>
      <p style="font-size:13px;color:#E8A620;background:rgba(232,166,32,0.12);display:inline-block;padding:4px 12px;border-radius:999px;margin:0 0 16px">
        Chapter ${verse.chapter_number}, Verse ${verse.verse_number}
      </p>
      <p style="font-size:20px;line-height:1.5;margin:0 0 12px">${verse.sanskrit_text}</p>
      <p style="font-size:14px;font-style:italic;color:rgba(255,248,231,0.5);margin:0 0 20px">${verse.transliteration}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 20px">${verse.english_meaning}</p>
      <div style="border-top:1px solid rgba(232,166,32,0.15);padding-top:16px">
        <p style="font-size:12px;color:#E8A620;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Practical Step</p>
        <p style="font-size:14px;line-height:1.6;margin:0">${verse.practical_guidance}</p>
      </div>
      <div style="border-top:1px solid rgba(232,166,32,0.15);padding-top:16px;margin-top:18px">
        <p style="font-size:12px;color:#E8A620;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Today's Reflection</p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:rgba(255,248,231,0.85)">${reflectionPrompt(verse)}</p>
        ${
          journalUrl
            ? `<a href="${journalUrl}" style="display:inline-block;background:#E8A620;color:#0A0F2E;text-decoration:none;font-size:14px;font-weight:bold;padding:10px 22px;border-radius:999px">Set today's intention & keep your streak →</a>`
            : ''
        }
      </div>
      <p style="font-size:11px;color:rgba(255,248,231,0.3);margin:24px 0 0;text-align:center">
        You receive this because you subscribed to the Daily Ritual.
        <a href="${unsubscribeUrl}" style="color:rgba(232,166,32,0.6)">Unsubscribe</a>
      </p>
    </div>
  </div>`
}

export async function sendDailyVerse(
  to: string,
  verse: RawVerse,
  unsubscribeUrl: string,
  siteUrl = '',
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  try {
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `🪷 Today's Gita verse — ${verse.reference}`,
      html: verseEmailHtml(verse, unsubscribeUrl, siteUrl),
    })
    if (error) {
      console.error('Resend error', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Email send failed', err)
    return false
  }
}
