/**
 * Live source checks: the IIT Kanpur Gita Supersite for the Sanskrit and Drik
 * Panchang for dates. A source that can't be reached fails the check, because
 * an unverified post must not go out.
 */
import { normaliseSanskrit, type CheckResult, type DateClaim, type VerseClaim } from './rules'

const TIMEOUT_MS = 12_000

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AskMadhavFactCheck/1.0; +https://www.askmadhav.world)' },
      next: { revalidate: 3600 },
    })
    return res.ok ? await res.text() : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function iitkCheck(v: VerseClaim): Promise<CheckResult> {
  if (!/^\d{1,2}\.\d{1,2}$/.test(v.ref)) {
    return { check: `verse ${v.ref} on IIT Kanpur`, pass: false, detail: 'Reference must look like 2.47.' }
  }
  const page = await fetchText(`https://heritage.iitk.ac.in/SBG/${v.ref}`)
  if (!page) return { check: `verse ${v.ref} on IIT Kanpur`, pass: false, detail: 'IIT Kanpur page could not be read.' }
  // The page lays each half-verse out separately, so each half must appear on its own.
  const halves = v.sanskrit.split(/[।॥|\n]+/).map(normaliseSanskrit).filter((h) => h.length >= 8)
  const text = normaliseSanskrit(page)
  const missing = halves.filter((h) => !text.includes(h))
  return {
    check: `verse ${v.ref} on IIT Kanpur`,
    pass: halves.length > 0 && missing.length === 0,
    detail: missing.length ? `Not found on heritage.iitk.ac.in/SBG: ${missing.length} of ${halves.length} lines.` : 'Sanskrit compared against heritage.iitk.ac.in/SBG.',
  }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export async function drikCheck(d: DateClaim): Promise<CheckResult> {
  const label = `${d.event} on ${d.date}`
  let host = ''
  try {
    host = new URL(d.sourceUrl).hostname
  } catch {
    // fall through to the host check below
  }
  if (host !== 'www.drikpanchang.com') {
    return { check: label, pass: false, detail: 'Dates must be confirmed on www.drikpanchang.com.' }
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date)
  if (!m) return { check: label, pass: false, detail: 'Date must be YYYY-MM-DD.' }
  const page = await fetchText(d.sourceUrl)
  if (!page) return { check: label, pass: false, detail: 'Drik Panchang could not be read, so the date is unconfirmed.' }
  const text = page.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const month = MONTHS[Number(m[2]) - 1]
  const day = String(Number(m[3]))
  const year = m[1]
  // Drik writes dates as "November 5, 2026" or "November 5th". Require the event
  // name and the date to appear close together.
  const near = new RegExp(`${d.event.split(/\s+/)[0]}[^.]{0,160}${month}\\s+${day}(st|nd|rd|th)?\\b|${month}\\s+${day}(st|nd|rd|th)?,?\\s+${year}[^.]{0,160}${d.event.split(/\s+/)[0]}`, 'i')
  return { check: label, pass: near.test(text), detail: `Looked for "${d.event}" next to ${month} ${day} on Drik Panchang.` }
}
