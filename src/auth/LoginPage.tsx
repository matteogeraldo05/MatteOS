import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Whitelist redirect destinations
  const safeRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      // Check if MFA is required
      if (data.session) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
          navigate('/login/mfa', { replace: true })
          return
        }
      }
      navigate(safeRedirect, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <span className="text-2xl font-bold text-text-primary tracking-tight">matteOS</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-base border border-border-default rounded-xl p-8 flex flex-col gap-5"
        >
          <div>
            <h1 className="text-xl font-medium text-text-primary">Sign in</h1>
          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}

          <Button type="submit" variant="primary" loading={loading} className="w-full mt-1">
            Sign in
          </Button>
        </form>

        <p className="text-xs text-text-muted text-center mt-4">
          Sign-ups disabled. Contact admin.
        </p>
      </div>
    </div>
  )
}
