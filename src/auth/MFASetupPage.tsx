import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

type Mode = 'loading' | 'challenge' | 'enroll'

export default function MFASetupPage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('loading')
  const [factorId, setFactorId] = useState('')
  const [qrSvg, setQrSvg] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp ?? []

      if (totp.length > 0) {
        // Challenge mode — user has TOTP, needs to verify
        setFactorId(totp[0].id)
        setMode('challenge')
      } else {
        // Enrollment mode — no TOTP enrolled
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
        if (enrollError || !data) {
          setError(enrollError?.message ?? 'Enrollment failed')
          setMode('enroll')
          return
        }
        setFactorId(data.id)
        setQrSvg(data.totp.qr_code)
        setSecret(data.totp.secret)
        setMode('enroll')
      }
    }
    init()
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      })
      if (verifyError) throw verifyError

      // RequireAuth waits for the profile and routes to /onboarding itself if needed
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <Spinner size={24} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="text-2xl font-bold text-text-primary tracking-tight">matteOS</span>
        </div>

        <form
          onSubmit={handleVerify}
          className="bg-bg-base border border-border-default rounded-xl p-8 flex flex-col gap-5"
        >
          {mode === 'enroll' ? (
            <>
              <div>
                <h1 className="text-xl font-medium text-text-primary">Set up 2FA</h1>
                <p className="text-sm text-text-secondary mt-1">Scan the QR code with your authenticator app</p>
              </div>

              {qrSvg && (
                <div
                  className="mx-auto bg-white rounded-lg p-2"
                  style={{ width: 160, height: 160 }}
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              )}

              {secret && (
                <div className="bg-bg-deep rounded-md p-3">
                  <p className="text-xs text-text-muted mb-1 uppercase tracking-wider">Manual entry</p>
                  <p className="text-xs text-text-secondary font-mono break-all">{secret}</p>
                </div>
              )}
            </>
          ) : (
            <div>
              <h1 className="text-xl font-medium text-text-primary">Two-factor auth</h1>
              <p className="text-sm text-text-secondary mt-1">Enter the 6-digit code from your authenticator app</p>
            </div>
          )}

          <Input
            label="One-time code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            autoComplete="one-time-code"
            required
          />

          {error && <p className="text-xs text-danger">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            {mode === 'enroll' ? 'Verify & activate' : 'Verify'}
          </Button>
        </form>
      </div>
    </div>
  )
}
