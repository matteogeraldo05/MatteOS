import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenHeader from '../../ui/ScreenHeader'
import SegmentedControl from '../../ui/SegmentedControl'
import Card from '../../ui/Card'
import Input from '../../ui/Input'
import NumberInput from '../../ui/NumberInput'
import DateInput from '../../ui/DateInput'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import ConfirmDialog from '../../ui/ConfirmDialog'
import { useToast } from '../../ui/Toast'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabase'

type Tab = 'profile' | 'account'

const activityOptions = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' },
]

const sexOptions = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, profile } = useAuth()
  const { push } = useToast()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [heightCm, setHeightCm] = useState<number | ''>(profile?.height_cm ?? '')
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? '')
  const [sex, setSex] = useState(profile?.sex ?? '')
  const [activityLevel, setActivityLevel] = useState(profile?.activity_level ?? 'moderate')
  const [calorieGoal, setCalorieGoal] = useState<number | ''>(profile?.calorie_goal ?? '')
  const [sleepGoal, setSleepGoal] = useState<number | ''>(profile?.sleep_goal_hours ?? 7)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profile')
        .update({
          display_name: displayName.trim(),
          height_cm: heightCm === '' ? null : Number(heightCm),
          birth_date: birthDate || null,
          sex: (sex as 'male' | 'female') || null,
          activity_level: activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
          calorie_goal: calorieGoal === '' ? null : Number(calorieGoal),
          sleep_goal_hours: sleepGoal === '' ? 7 : Number(sleepGoal),
        })
        .eq('id', user.id)
      if (error) throw error
      push({ kind: 'success', title: 'Profile saved' })
    } catch (err) {
      push({ kind: 'danger', title: 'Save failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      <Card>
        <div className="flex flex-col gap-5">
          <Input label="Display name" value={displayName} onChange={setDisplayName} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput label="Height (cm)" value={heightCm} onChange={setHeightCm} min={100} max={250} step={0.5} placeholder="e.g. 175" />
            <DateInput label="Birth date" value={birthDate} onChange={setBirthDate} max={new Date().toLocaleDateString('en-CA')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Sex" value={sex} onChange={setSex} options={sexOptions} />
            <Select label="Activity level" value={activityLevel} onChange={(v) => setActivityLevel(v as typeof activityLevel)} options={activityOptions} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput label="Calorie goal (optional)" value={calorieGoal} onChange={setCalorieGoal} min={1000} max={6000} step={50} placeholder="Auto (TDEE)" />
            <NumberInput label="Sleep goal (hours)" value={sleepGoal} onChange={setSleepGoal} min={4} max={12} step={0.5} />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving} disabled={!displayName.trim()}>Save profile</Button>
          </div>
        </div>
      </Card>
    </form>
  )
}

// ─── Account Tab ─────────────────────────────────────────────────────────────

function AccountTab() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [signOutConfirm, setSignOutConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setChangingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      push({ kind: 'success', title: 'Password changed' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      push({ kind: 'danger', title: 'Failed to change password', description: err instanceof Error ? err.message : undefined })
    } finally {
      setChangingPw(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Email */}
      <Card>
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-medium text-text-primary">Account</h3>
          <div>
            <span className="text-xs text-text-muted uppercase tracking-[0.06em]">Email</span>
            <p className="text-sm text-text-secondary mt-0.5">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-text-primary">Change password</h3>
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            placeholder="Repeat password"
            error={passwordError}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={changingPw} disabled={!newPassword || !confirmPassword}>
              Change password
            </Button>
          </div>
        </form>
      </Card>

      {/* 2FA */}
      <Card>
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-text-primary">Two-factor authentication</h3>
          <p className="text-sm text-text-secondary">
            Manage your TOTP authenticator for extra account security.
          </p>
          <Button variant="secondary" onClick={() => navigate('/login/mfa')}>
            Manage 2FA
          </Button>
        </div>
      </Card>

      {/* Sign out */}
      <Card>
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-text-primary">Sign out</h3>
          <Button
            variant="secondary"
            onClick={() => setSignOutConfirm(true)}
            className="!border-danger/30 !text-danger hover:!bg-danger/10 self-start"
          >
            Sign out
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={signOutConfirm}
        message="Sign out of matteOS? Your session will be cleared."
        confirmLabel="Sign out"
        confirmVariant="danger"
        loading={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => setSignOutConfirm(false)}
      />
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <>
      <ScreenHeader title="Settings" />

      <div className="mb-6">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'profile', label: 'Profile' },
            { value: 'account', label: 'Account' },
          ]}
        />
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'account' && <AccountTab />}
    </>
  )
}
