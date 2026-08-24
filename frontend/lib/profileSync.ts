'use client'

/**
 * Profile sync — the seeker's profile (age band + answer language) follows
 * their account, not just this browser.
 *
 * localStorage (`askmadhav_profile`) remains the source of truth the UI reads
 * synchronously; when the seeker is signed in we mirror the profile into
 * Supabase auth user_metadata so a returning seeker on a new device gets the
 * same tuned Madhav. Both directions fail-open: without Supabase (or offline)
 * everything behaves exactly as before.
 */

import { getBrowserClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

/** Push the profile to the signed-in account (fire-and-forget). */
export function saveProfileToAccount(profile: UserProfile): void {
  const supabase = getBrowserClient()
  if (!supabase) return
  supabase.auth
    .getSession()
    .then(({ data }) => {
      if (!data.session) return
      return supabase.auth.updateUser({ data: { askmadhav_profile: profile } })
    })
    .catch(() => {
      /* offline / signed out — local profile still applies */
    })
}

/**
 * Pull the account profile once (resolves null when signed out, unconfigured,
 * or nothing stored). Caller decides how to merge with the local profile.
 */
export async function loadProfileFromAccount(): Promise<UserProfile | null> {
  const supabase = getBrowserClient()
  if (!supabase) return null
  try {
    const { data } = await supabase.auth.getSession()
    const stored = data.session?.user?.user_metadata?.askmadhav_profile as
      | Partial<UserProfile>
      | undefined
    if (!stored || typeof stored !== 'object') return null
    if (!stored.language && !stored.ageGroup) return null
    return { language: stored.language ?? 'english', ageGroup: stored.ageGroup }
  } catch {
    return null
  }
}
