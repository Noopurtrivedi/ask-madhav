'use client'

/**
 * AuthProvider — the single source of auth truth for the whole app.
 *
 * Wraps every route (see app/layout.tsx) so any component can read the seeker's
 * session via useAuth(). Fail-open by design: when Supabase is not configured
 * (zero-env dev, or a fork without keys) `configured` is false and the app runs
 * exactly as before — AuthGate lets everyone through and the Journal shows its
 * "activates once configured" note. Nothing in the app may hard-depend on auth.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

interface AuthState {
  /** Supabase env vars present — auth is enforceable. */
  configured: boolean
  /** True until the initial session lookup resolves (only when configured). */
  loading: boolean
  user: User | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  configured: false,
  loading: false,
  user: null,
  signOut: async () => {},
})

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured()
  const supabase = getBrowserClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(configured)

  useEffect(() => {
    if (!supabase) return
    // getSession() is local (no network) → instant first paint for returning
    // seekers; onAuthStateChange keeps it live (magic-link landing, sign-out
    // in another tab, token refresh).
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null)
      })
      .finally(() => setLoading(false))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase?.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ configured, loading, user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
