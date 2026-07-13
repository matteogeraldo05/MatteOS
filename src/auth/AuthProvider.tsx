import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import type { UserProfile } from '../types/db'

interface AuthCtx {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('user_profile')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return data ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  // The profile is tagged with the user id it was fetched for, so `loading`
  // stays true for a freshly signed-in user until *their* profile arrives —
  // otherwise RequireAuth redirects to /onboarding before the fetch settles.
  const [profileFor, setProfileFor] = useState<{ userId: string; profile: UserProfile | null } | null>(null)

  const user = session?.user ?? null
  const userId = user?.id ?? null

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setSessionLoading(false)
    })

    // No awaits inside this callback: supabase-js holds an internal lock while
    // it runs, and awaiting other supabase calls in here can deadlock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setSessionLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    let stale = false
    fetchProfile(userId).then((p) => {
      if (!stale) setProfileFor({ userId, profile: p })
    })
    return () => { stale = true }
  }, [userId])

  const profile = userId && profileFor?.userId === userId ? profileFor.profile : null
  const loading = sessionLoading || (userId !== null && profileFor?.userId !== userId)

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    const p = await fetchProfile(userId)
    setProfileFor({ userId, profile: p })
  }, [userId])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    queryClient.clear()
    // Clear any matteos:* keys from localStorage
    Object.keys(localStorage)
      .filter((k) => k.startsWith('matteos:'))
      .forEach((k) => localStorage.removeItem(k))
    setSession(null)
    setProfileFor(null)
  }, [])

  const value = useMemo(
    () => ({ session, user, profile, loading, signOut, refreshProfile }),
    [session, user, profile, loading, signOut, refreshProfile],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
