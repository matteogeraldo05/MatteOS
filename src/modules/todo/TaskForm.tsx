import { useState, useCallback } from 'react'
import { Trash } from '@phosphor-icons/react'
import Button from '../../ui/Button'
import IconButton from '../../ui/IconButton'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import ConfirmDialog from '../../ui/ConfirmDialog'
import { useToast } from '../../ui/Toast'
import { useUpsertTask, useSoftDeleteTask } from './queries'
import type { Task, TaskTag, RecurrenceType } from './queries'

interface TaskFormProps {
  /** Pre-filled date when creating (YYYY-MM-DD) */
  initialDate: string
  /** Pass to edit an existing task */
  existingTask?: Task | null
  onClose: () => void
}

const TAG_OPTIONS = [
  { value: 'gym', label: 'Gym' },
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'finance', label: 'Finance' },
]

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Every day' },
  { value: 'mwf', label: 'Mon / Wed / Fri' },
  { value: 'weekly', label: 'Weekly (pick day)' },
  { value: 'monthly', label: 'Monthly (pick day)' },
]

const DOW_OPTIONS = [
  { value: '0', label: 'Monday' },
  { value: '1', label: 'Tuesday' },
  { value: '2', label: 'Wednesday' },
  { value: '3', label: 'Thursday' },
  { value: '4', label: 'Friday' },
  { value: '5', label: 'Saturday' },
  { value: '6', label: 'Sunday' },
]

const inputClass =
  'w-full h-9 px-3 rounded-md bg-bg-deep border border-border-default text-text-primary text-base placeholder:text-text-muted transition-colors duration-[120ms] ease-out outline-none focus:border-border-strong accent-accent'

export default function TaskForm({ initialDate, existingTask, onClose }: TaskFormProps) {
  const { push } = useToast()
  const upsert = useUpsertTask()
  const softDelete = useSoftDeleteTask()
  const [confirmDelete, setConfirmDelete] = useState(false)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(existingTask?.title ?? '')
  const [tag, setTag] = useState<TaskTag>(existingTask?.tag ?? 'personal')
  const [dueTime, setDueTime] = useState(
    existingTask?.due_time
      ? existingTask.due_time.slice(0, 5)  // "HH:MM:SS" → "HH:MM"
      : '',
  )
  const [duration, setDuration] = useState<string>(
    existingTask?.duration_minutes != null ? String(existingTask.duration_minutes) : '30',
  )
  const [recType, setRecType] = useState<RecurrenceType>(
    existingTask?.recurrence_type ?? 'none',
  )
  const [dow, setDow] = useState<string>(
    existingTask?.recurrence_day_of_week != null
      ? String(existingTask.recurrence_day_of_week)
      : '0',
  )
  const [dom, setDom] = useState<string>(
    existingTask?.recurrence_day_of_month != null
      ? String(existingTask.recurrence_day_of_month)
      : '1',
  )
  const [startDate, setStartDate] = useState(existingTask?.start_date ?? initialDate)
  const [endDate, setEndDate] = useState(existingTask?.end_date ?? '')

  // ── Validation ─────────────────────────────────────────────────────────────
  const titleError = title.trim().length === 0 ? 'Title is required' : ''
  const domNum = parseInt(dom, 10)
  const domError = recType === 'monthly' && (isNaN(domNum) || domNum < 1 || domNum > 28)
    ? 'Day must be 1–28'
    : ''
  const canSubmit = !titleError && !domError && !upsert.isPending

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!canSubmit) return

      await upsert.mutateAsync({
        id: existingTask?.id,
        title: title.trim(),
        tag,
        due_time: dueTime ? dueTime + ':00' : null,
        duration_minutes: parseInt(duration, 10) || 30,
        recurrence_type: recType,
        recurrence_day_of_week: recType === 'weekly' ? parseInt(dow, 10) : null,
        recurrence_day_of_month: recType === 'monthly' ? domNum : null,
        start_date: startDate,
        end_date: endDate || null,
      })

      push({ kind: 'success', title: existingTask ? 'Task updated' : 'Task created' })
      onClose()
    },
    [canSubmit, upsert, existingTask, title, tag, dueTime, duration, recType, dow, domNum, startDate, endDate, push, onClose],
  )

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!existingTask) return
    await softDelete.mutateAsync(existingTask.id)
    push({ kind: 'success', title: 'Task deleted' })
    setConfirmDelete(false)
    onClose()
  }, [existingTask, softDelete, push, onClose])

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Title */}
        <Input
          label="Title"
          value={title}
          onChange={setTitle}
          placeholder="What needs doing?"
          error={title.trim().length > 0 ? '' : undefined}
          autoFocus
        />

        {/* Tag */}
        <Select
          label="Tag"
          value={tag}
          onChange={(v) => setTag(v as TaskTag)}
          options={TAG_OPTIONS}
        />

        {/* Due time + duration row */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-2xs text-text-muted uppercase tracking-[0.08em]">
              Due time <span className="normal-case text-text-muted">(optional)</span>
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5" style={{ width: 100 }}>
            <label className="text-2xs text-text-muted uppercase tracking-[0.08em]">
              Duration
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={5}
                max={1440}
                step={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputClass + ' pr-8'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                min
              </span>
            </div>
          </div>
        </div>

        {/* Recurrence */}
        <Select
          label="Repeats"
          value={recType}
          onChange={(v) => setRecType(v as RecurrenceType)}
          options={RECURRENCE_OPTIONS}
        />

        {recType === 'weekly' && (
          <Select
            label="Day of week"
            value={dow}
            onChange={setDow}
            options={DOW_OPTIONS}
          />
        )}

        {recType === 'monthly' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-2xs text-text-muted uppercase tracking-[0.08em]">
              Day of month
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={28}
              value={dom}
              onChange={(e) => setDom(e.target.value)}
              className={`${inputClass} ${domError ? 'border-danger' : ''}`}
            />
            {domError && <span className="text-xs text-danger">{domError}</span>}
          </div>
        )}

        {/* Start date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs text-text-muted uppercase tracking-[0.08em]">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className={inputClass}
          />
        </div>

        {/* End date */}
        {recType !== 'none' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-2xs text-text-muted uppercase tracking-[0.08em]">
              End date <span className="normal-case text-text-muted">(optional — leave blank for forever)</span>
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className={inputClass}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
          <div>
            {existingTask && (
              <IconButton
                label="Delete task"
                onClick={() => setConfirmDelete(true)}
                className="text-danger hover:text-danger hover:bg-danger/10"
              >
                <Trash size={16} weight="regular" aria-hidden="true" />
              </IconButton>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={upsert.isPending}
              disabled={!canSubmit}
            >
              {existingTask ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        message="Delete this task? All future occurrences will be removed. Past completions are kept."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={softDelete.isPending}
      />
    </>
  )
}
