/**
 * Reading progress, kept in this browser. Every read and write is guarded: the
 * Gita must stay readable when storage is blocked.
 */

const KEY = 'askmadhav_read'
const LAST = 'askmadhav_last_verse'
export const PROGRESS_EVENT = 'madhav:progress'

export function readSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]') as string[])
  } catch {
    return new Set()
  }
}

export function setRead(reference: string, read: boolean): void {
  const all = readSet()
  if (read) all.add(reference)
  else all.delete(reference)
  try {
    localStorage.setItem(KEY, JSON.stringify([...all]))
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT))
  } catch {
    // Progress is a convenience; reading carries on without it.
  }
}

export function lastVerse(): string | null {
  try {
    return localStorage.getItem(LAST)
  } catch {
    return null
  }
}

export function rememberVerse(reference: string): void {
  try {
    localStorage.setItem(LAST, reference)
  } catch {
    // As above.
  }
}

export const readInChapter = (all: Set<string>, chapter: number) =>
  [...all].filter((r) => r.startsWith(`${chapter}.`)).length
