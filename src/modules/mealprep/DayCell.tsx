import { useState } from 'react'
import SegmentedControl from '../../ui/SegmentedControl'
import NumberInput from '../../ui/NumberInput'
import type { MealPrepDay, MealStatus } from './queries'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const STATUS_OPTIONS: { value: MealStatus; label: string }[] = [
  { value: 'prepped', label: 'Prep' },
  { value: 'planned', label: 'Plan' },
  { value: 'flex', label: 'Flex' },
]

const STATUS_BORDER: Record<MealStatus, string> = {
  prepped: 'var(--color-success)',
  planned: 'var(--color-accent)',
  flex: 'var(--color-text-muted)',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DayCellProps {
  dow: number          // 0 = Mon … 6 = Sun
  day?: MealPrepDay   // undefined when the week has no saved data for this dow
  onSave: (dow: number, description: string, calories: number | null, status: MealStatus) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DayCell({ dow, day, onSave }: DayCellProps) {
  const [description, setDescription] = useState(day?.description ?? '')
  const [calories, setCalories]       = useState<number | ''>(day?.calories ?? '')
  const [status, setStatus]           = useState<MealStatus>(day?.status ?? 'flex')

  // Commit the current draft to DB
  function commit(
    desc = description,
    cal: number | '' = calories,
    st: MealStatus = status,
  ) {
    onSave(dow, desc, cal === '' ? null : cal, st)
  }

  function handleStatusChange(newStatus: MealStatus) {
    setStatus(newStatus)
    commit(description, calories, newStatus)
  }

  return (
    <div
      className="bg-bg-base rounded-lg border border-border-default flex flex-col gap-2.5"
      style={{ borderTop: `2px solid ${STATUS_BORDER[status]}` }}
    >
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="text-2xs text-text-secondary uppercase tracking-[0.08em] font-medium">
          {DAY_LABELS[dow]}
        </span>

        {/* Compact status picker */}
        <SegmentedControl<MealStatus>
          value={status}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS}
        />
      </div>

      {/* ── Description textarea ────────────────────────────────────────── */}
      <div className="px-3">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => commit()}
          placeholder="No meal planned"
          rows={3}
          className="
            w-full px-3 py-2 rounded-md bg-bg-deep border border-border-default
            text-text-primary text-sm placeholder:text-text-muted resize-y
            transition-colors duration-[120ms] ease-out outline-none focus:border-border-strong
          "
        />
      </div>

      {/* ── Calories ────────────────────────────────────────────────────── */}
      <div className="px-3 pb-3 flex justify-end">
        <NumberInput
          value={calories}
          onChange={setCalories}
          onBlur={() => commit()}
          placeholder="kcal"
          min={0}
          max={99999}
          className="w-24 text-right"
        />
      </div>
    </div>
  )
}
