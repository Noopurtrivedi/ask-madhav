'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** True when Supabase env vars are present — used to gate journal features. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

let cached: SupabaseClient | null = null

/** Browser Supabase client (anon key, RLS-protected). Null if not configured. */
export function getBrowserClient(): SupabaseClient | null {
  if (!url || !anonKey) return null
  if (!cached) cached = createBrowserClient(url, anonKey)
  return cached
}
