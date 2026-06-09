import { useState } from 'react'
import { NotePencil, Trash } from '@phosphor-icons/react'
import NumberInput from '../../ui/NumberInput'
import Input from '../../ui/Input'
import Textarea from '../../ui/Textarea'
import IconButton from '../../ui/IconButton'

// ─── Type ─────────────────────────────────────────────────────────────────────

export type ExerciseRowData = {
  key: string
  exercise_name: string
  exercise_order: number
  sets: number | ''
  reps: number | ''
  weight_lbs: number | ''
  notes: string
  isAdHoc: boolean
  // Hint from last session
  lastSets?: number
  lastReps?: number
  lastWeightLbs?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ExerciseRowProps {
  data: ExerciseRowData
  onChange: (updated: ExerciseRowData) => void
  onRemove?: () => void
  readOnly?: boolean
}

export default function ExerciseRow({ data, onChange, onRemove, readOnly = false }: ExerciseRowProps) {
  const [notesOpen, setNotesOpen] = useState(!!data.notes)

  const hasHint =
    data.lastSets !== undefined &&
    data.lastReps !== undefined &&
    data.lastWeightLbs !== undefined

  return (
    <div className="py-3 border-b border-border-subtle last:border-b-0">

      {/* ── Name + controls ─────────────────────────────────── */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {data.isAdHoc && !readOnly ? (
            <Input
              value={data.exercise_name}
              onChange={(v) => onChange({ ...data, exercise_name: v })}
              placeholder="Exercise name"
            />
          ) : (
            <p className="text-base text-text-primary font-medium leading-snug">{data.exercise_name}</p>
          )}

          {hasHint && (
            <p className="text-2xs text-text-muted mt-0.5 tabular-nums">
              last: {data.lastSets}×{data.lastReps} @ {data.lastWeightLbs} lbs
            </p>
          )}
        </div>

        {/* Notes toggle (edit mode only) */}
        {!readOnly && (
          <IconButton label="Toggle notes" onClick={() => setNotesOpen((o) => !o)}>
            <NotePencil
              size={14}
              weight={notesOpen ? 'fill' : 'regular'}
              className={notesOpen ? 'text-accent' : 'text-text-muted'}
            />
          </IconButton>
        )}

        {/* Remove ad-hoc exercise (edit mode only) */}
        {data.isAdHoc && !readOnly && onRemove && (
          <IconButton label="Remove exercise" onClick={onRemove}>
            <Trash size={14} className="text-text-muted hover:text-danger" />
          </IconButton>
        )}
      </div>

      {/* ── Sets / Reps / Weight ──────────────────────────────── */}
      {readOnly ? (
        <p className="text-sm text-text-secondary tabular-nums">
          {data.sets}×{data.reps} @ {data.weight_lbs} lbs
        </p>
      ) : (
        <div className="flex gap-3 items-end">
          <div className="w-[48px]">
            <NumberInput
              label="Sets"
              value={data.sets}
              onChange={(v) => onChange({ ...data, sets: v })}
              min={1}
              max={20}
              step={1}
            />
          </div>
          <div className="w-[48px]">
            <NumberInput
              label="Reps"
              value={data.reps}
              onChange={(v) => onChange({ ...data, reps: v })}
              min={1}
              max={100}
              step={1}
            />
          </div>
          <div className="w-[80px]">
            <NumberInput
              label="Weight lbs"
              value={data.weight_lbs}
              onChange={(v) => onChange({ ...data, weight_lbs: v })}
              min={0}
              max={2000}
              step={0.5}
            />
          </div>
        </div>
      )}

      {/* ── Notes ────────────────────────────────────────────── */}
      {readOnly && data.notes && (
        <p className="mt-1.5 text-xs text-text-muted whitespace-pre-wrap">{data.notes}</p>
      )}

      {!readOnly && notesOpen && (
        <div className="mt-2">
          <Textarea
            value={data.notes}
            onChange={(v) => onChange({ ...data, notes: v })}
            rows={2}
            placeholder="Notes for this set…"
          />
        </div>
      )}
    </div>
  )
}
