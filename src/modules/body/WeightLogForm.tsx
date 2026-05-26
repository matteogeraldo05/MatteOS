import { useState } from 'react'
import { useUpsertWeight } from './queries'
import { useToast } from '../../ui/Toast'
import { todayInTz } from '../../lib/dates'
import { useAuth } from '../../auth/AuthProvider'
import NumberInput from '../../ui/NumberInput'
import DateInput from '../../ui/DateInput'
import Button from '../../ui/Button'

interface WeightLogFormProps {
  /** Pre-filled values when editing an existing entry */
  initialDate?: string
  initialWeight?: number
  onSaved?: () => void
}

export default function WeightLogForm({ initialDate, initialWeight, onSaved }: WeightLogFormProps) {
  const { profile } = useAuth()
  const tz = profile?.timezone ?? 'UTC'
  const today = todayInTz(tz)

  const [date, setDate] = useState(initialDate ?? today)
  const [weight, setWeight] = useState<number | ''>(initialWeight ?? '')
  const [error, setError] = useState<string | undefined>()

  const upsert = useUpsertWeight()
  const toast = useToast()

  async function handleSave() {
    if (weight === '' || weight <= 0) {
      setError('Enter a valid weight')
      return
    }
    setError(undefined)
    try {
      await upsert.mutateAsync({ log_date: date, weight_lbs: weight })
      toast.push({ kind: 'success', title: 'Weight saved' })
      setWeight('')
      setDate(today)
      onSaved?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      // Unique constraint violation — same date already logged
      if (msg.includes('unique') || msg.includes('duplicate')) {
        toast.push({
          kind: 'danger',
          title: 'Duplicate entry',
          description: 'A weight log for this date already exists.',
        })
      } else {
        toast.push({ kind: 'danger', title: 'Error', description: msg })
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary uppercase tracking-[0.06em]">Date</label>
          <DateInput
            value={date}
            onChange={(v) => setDate(v)}
            max={today}
          />
        </div>

        <NumberInput
          label="Weight (lbs)"
          value={weight}
          onChange={(v) => { setWeight(v); setError(undefined) }}
          min={0}
          max={999}
          step={0.1}
          placeholder="0.0"
          error={error}
        />
      </div>

      <Button
        variant="primary"
        onClick={handleSave}
        loading={upsert.isPending}
        disabled={weight === ''}
      >
        Save
      </Button>
    </div>
  )
}
