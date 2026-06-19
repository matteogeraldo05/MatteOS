import { useState } from 'react'
import { NotePencil, PencilSimple, Trash } from '@phosphor-icons/react'
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
  // Hints from last session
  lastSets?: number
  lastReps?: number
  lastWeightLbs?: number
  lastNotes?: string | null
}

// ─── Grip handle ─────────────────────────────────────────────────────────────

function GripHandle() {
  return (
    <svg
      width="12" height="16" viewBox="0 0 12 16" fill="none"
      aria-hidden="true"
      className="text-text-disabled flex-shrink-0 cursor-grab active:cursor-grabbing"
    >
      <circle cx="3"  cy="3.5"  r="1.3" fill="currentColor" />
      <circle cx="9"  cy="3.5"  r="1.3" fill="currentColor" />
      <circle cx="3"  cy="8"    r="1.3" fill="currentColor" />
      <circle cx="9"  cy="8"    r="1.3" fill="currentColor" />
      <circle cx="3"  cy="12.5" r="1.3" fill="currentColor" />
      <circle cx="9"  cy="12.5" r="1.3" fill="currentColor" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ExerciseRowProps {
  data: ExerciseRowData
  onChange: (updated: ExerciseRowData) => void
  onRemove?: () => void
  readOnly?: boolean
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  onGripTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void
}

export default function ExerciseRow({
  data, onChange, onRemove, readOnly = false,
  isDragging, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, onGripTouchStart,
}: ExerciseRowProps) {
  const [notesOpen, setNotesOpen] = useState(!!data.notes)
  const [isRenaming, setIsRenaming] = useState(false)

  const hasHint =
    data.lastSets !== undefined &&
    data.lastReps !== undefined &&
    data.lastWeightLbs !== undefined

  return (
    <div
      draggable={!readOnly}
      onDragStart={!readOnly ? onDragStart : undefined}
      onDragOver={!readOnly ? onDragOver : undefined}
      onDragLeave={!readOnly ? onDragLeave : undefined}
      onDrop={!readOnly ? onDrop : undefined}
      onDragEnd={!readOnly ? onDragEnd : undefined}
      className={`py-3 border-b border-border-subtle last:border-b-0 ${isDragging ? 'opacity-40' : ''}`}
    >

      {/* ── Name + controls ─────────────────────────────────── */}
      <div className="flex items-start gap-2 mb-2">
        {!readOnly && (
          <div
            onTouchStart={onGripTouchStart}
            onClick={(e) => e.stopPropagation()}
            className="touch-none flex-shrink-0 mt-1"
          >
            <GripHandle />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {data.isAdHoc && !readOnly ? (
            <Input
              value={data.exercise_name}
              onChange={(v) => onChange({ ...data, exercise_name: v })}
              placeholder="Exercise name"
            />
          ) : isRenaming && !readOnly ? (
            <Input
              value={data.exercise_name}
              onChange={(v) => onChange({ ...data, exercise_name: v })}
              onBlur={() => setIsRenaming(false)}
              autoFocus
            />
          ) : (
            <p className="text-base text-text-primary font-medium leading-snug">{data.exercise_name}</p>
          )}

          {hasHint && !isRenaming && (
            <p className="text-2xs text-text-muted mt-0.5 tabular-nums">
              last: {data.lastSets}×{data.lastReps} @ {data.lastWeightLbs} lbs
            </p>
          )}
          {data.lastNotes && !readOnly && !isRenaming && (
            <p className="text-2xs text-text-muted mt-0.5 italic">
              Last note: {data.lastNotes}
            </p>
          )}
        </div>

        {/* Rename preset exercise (edit mode only) */}
        {!data.isAdHoc && !readOnly && (
          <IconButton label="Rename exercise" onClick={() => setIsRenaming((r) => !r)}>
            <PencilSimple
              size={14}
              weight={isRenaming ? 'fill' : 'regular'}
              className={isRenaming ? 'text-accent' : 'text-text-muted'}
            />
          </IconButton>
        )}

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
        <div className="flex gap-3 items-end flex-wrap">
          <div className="min-w-0" style={{ width: 48 }}>
            <NumberInput
              label="Sets"
              value={data.sets}
              onChange={(v) => onChange({ ...data, sets: v })}
              min={1}
              max={20}
              step={1}
            />
          </div>
          <div className="min-w-0" style={{ width: 48 }}>
            <NumberInput
              label="Reps"
              value={data.reps}
              onChange={(v) => onChange({ ...data, reps: v })}
              min={1}
              max={100}
              step={1}
            />
          </div>
          <div className="min-w-0" style={{ width: 80 }}>
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
