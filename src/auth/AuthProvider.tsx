import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
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
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
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
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const handleSession = useCallback(async (newSession: Session | null) => {
    setSession(newSession)
    setUser(newSession?.user ?? null)
    if (newSession?.user) {
      const p = await fetchProfile(newSession.user.id)
      setProfile(p)
    } else {
      setProfile(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleSession(s)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      handleSession(s)
    })

    return () => subscription.unsubscribe()
  }, [handleSession])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    queryClient.clear()
    // Clear any matteos:* keys from localStorage
    Object.keys(localStorage)
      .filter((k) => k.startsWith('matteos:'))
      .forEach((k) => localStorage.removeItem(k))
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
