import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { supabase } from '../lib/supabase'
import Spinner from '../ui/Spinner'

interface RequireAuthProps {
  children: ReactNode
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { session, profile, loading } = useAuth()
  const [aalLoading, setAalLoading] = useState(true)
  const [needsMfa, setNeedsMfa] = useState(false)

  useEffect(() => {
    if (!session) {
      setAalLoading(false)
      return
    }
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      if (data?.currentLevel === 'aal1' && data?.nextLevel === 'aal2') {
        setNeedsMfa(true)
      } else {
        setNeedsMfa(false)
      }
      setAalLoading(false)
    })
  }, [session])

  if (loading || aalLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-deep">
        <Spinner size={24} />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (needsMfa) {
    return <Navigate to="/login/mfa" replace />
  }

  if (!profile || !profile.display_name) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
