import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthProvider'
import Input from '../ui/Input'
import NumberInput from '../ui/NumberInput'
import Select from '../ui/Select'
import DateInput from '../ui/DateInput'
import Button from '../ui/Button'

const activityOptions = [
  { value: 'sedentary', label: 'Sedentary (desk job, no exercise)' },
  { value: 'light', label: 'Light (1–2 days/week)' },
  { value: 'moderate', label: 'Moderate (3–5 days/week)' },
  { value: 'active', label: 'Active (6–7 days/week)' },
  { value: 'very_active', label: 'Very active (physical job + exercise)' },
]

const sexOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()

  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const [displayName, setDisplayName] = useState('')
  const [heightCm, setHeightCm] = useState<number | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState('')
  const [activityLevel, setActivityLevel] = useState('moderate')
  const [calorieGoal, setCalorieGoal] = useState<number | ''>('')
  const [sleepGoal, setSleepGoal] = useState<number | ''>(7)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    try {
      const { error: upsertError } = await supabase
        .from('user_profile')
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
          height_cm: heightCm === '' ? null : Number(heightCm),
          birth_date: birthDate || null,
          sex: (sex as 'male' | 'female') || null,
          activity_level: activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
          calorie_goal: calorieGoal === '' ? null : Number(calorieGoal),
          sleep_goal_hours: sleepGoal === '' ? 7 : Number(sleepGoal),
          timezone: detectedTz,
        })

      if (upsertError) throw upsertError
      await refreshProfile()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-text-primary tracking-tight">matteOS</span>
          <p className="text-sm text-text-secondary mt-2">Let's set up your profile</p>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-bg-base border border-border-default rounded-xl p-8 flex flex-col gap-5"
        >
          <Input
            label="Display name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Your name"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Height (cm)"
              value={heightCm}
              onChange={setHeightCm}
              min={100}
              max={250}
              step={0.5}
              placeholder="175"
            />
            <DateInput
              label="Birth date"
              value={birthDate}
              onChange={setBirthDate}
              max={new Date().toLocaleDateString('en-CA')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Sex"
              value={sex}
              onChange={setSex}
              options={sexOptions}
              placeholder="Select..."
            />
            <Select
              label="Activity level"
              value={activityLevel}
              onChange={setActivityLevel}
              options={activityOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Calorie goal (optional)"
              value={calorieGoal}
              onChange={setCalorieGoal}
              min={1000}
              max={6000}
              step={50}
              placeholder="Auto (TDEE)"
            />
            <NumberInput
              label="Sleep goal (hours)"
              value={sleepGoal}
              onChange={setSleepGoal}
              min={4}
              max={12}
              step={0.5}
              placeholder="7"
            />
          </div>

          <div className="bg-bg-deep rounded-md px-3 py-2">
            <span className="text-xs text-text-muted">Timezone: </span>
            <span className="text-xs text-text-secondary">{detectedTz}</span>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <Button type="submit" loading={loading} className="w-full mt-1" disabled={!displayName.trim()}>
            Save and continue
          </Button>
        </form>
      </div>
    </div>
  )
}
