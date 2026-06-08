import { useState, useEffect, useCallback } from 'react'
import { Trash } from '@phosphor-icons/react'
import Button from '../../ui/Button'
import IconButton from '../../ui/IconButton'
import ConfirmDialog from '../../ui/ConfirmDialog'
import { useToast } from '../../ui/Toast'
import { useUpsertSleepLog, useDeleteSleepLog, type SleepLog } from './queries'
import { useAuth } from '../../auth/AuthProvider'

interface SleepLogFormProps {
  /** Pre-filled date in YYYY-MM-DD */
  initialDate: string
  /** If editing an existing log, pass it here */
  existingLog?: SleepLog | null
  onClose: () => void
}

// ─── Quality squares ──────────────────────────────────────────────────────────

function QualityPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((q) => (
        <button
          key={q}
          type="button"
          aria-label={`Quality ${q}`}
          onClick={() => onChange(q)}
          className={`
            w-8 h-8 rounded transition-colors duration-[120ms] ease-out cursor-pointer
            flex items-center justify-center text-xs font-medium
            ${q <= value
              ? 'bg-accent text-white border border-accent'
              : 'bg-transparent border border-border-default text-text-muted hover:border-border-strong'
            }
          `}
        >
          {q}
        </button>
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a datetime string for "today date" + a HH:MM time string */
function buildDatetime(dateStr: string, timeStr: string): string {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  return `${dateStr}T${timeStr}:00`
}

/** Compute hours between two local datetime strings */
function computeHours(bedDatetime: string, wakeDatetime: string): number {
  const bed = new Date(bedDatetime).getTime()
  const wake = new Date(wakeDatetime).getTime()
  if (isNaN(bed) || isNaN(wake) || wake <= bed) return 0
  return Math.round(((wake - bed) / 3_600_000) * 100) / 100
}

/** Extract HH:MM from a full timestamptz ISO string */
function extractTime(ts: string): string {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** Extract YYYY-MM-DD from a full timestamptz ISO string */
function extractDate(ts: string): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SleepLogForm({ initialDate, existingLog, onClose }: SleepLogFormProps) {
  const { profile } = useAuth()
  const { push } = useToast()
  const upsert = useUpsertSleepLog()
  const del = useDeleteSleepLog()
  const [confirmDelete, setConfirmDelete] = useState(false)

  // ── Form state ──────────────────────────────────────────────────────────────
  // Bed time: default to 23:00 on the previous day (or the log's actual time)
  const defaultBedDate = (() => {
    const d = new Date(initialDate + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${y}-${mo}-${da}`
  })()

  const [bedDate, setBedDate] = useState(() =>
    existingLog ? extractDate(existingLog.bed_time) : defaultBedDate,
  )
  const [bedTime, setBedTime] = useState(() =>
    existingLog ? extractTime(existingLog.bed_time) : '23:00',
  )
  const [wakeDate] = useState(initialDate) // wake date is always the log_date
  const [wakeTime, setWakeTime] = useState(() =>
    existingLog ? extractTime(existingLog.wake_time) : '07:00',
  )
  const [hours, setHours] = useState<number>(() =>
    existingLog ? existingLog.hours : computeHours(
      buildDatetime(defaultBedDate, '23:00'),
      buildDatetime(initialDate, '07:00'),
    ),
  )
  const [hoursManual, setHoursManual] = useState(false)
  const [quality, setQuality] = useState<number>(() => existingLog?.quality ?? 3)
  const [notes, setNotes] = useState(() => existingLog?.notes ?? '')

  // ── Auto-compute hours ──────────────────────────────────────────────────────
  useEffect(() => {
    if (hoursManual) return
    const computed = computeHours(
      buildDatetime(bedDate, bedTime),
      buildDatetime(wakeDate, wakeTime),
    )
    if (computed > 0) setHours(computed)
  }, [bedDate, bedTime, wakeDate, wakeTime, hoursManual])

  // ── Timezone from profile ───────────────────────────────────────────────────
  const tz = profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  // ── Submission ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quality) return

    // Compute log_date from wake_time in user's timezone
    const wakeInstant = new Date(buildDatetime(wakeDate, wakeTime))
    const logDate = wakeInstant.toLocaleDateString('en-CA', { timeZone: tz })

    await upsert.mutateAsync({
      log_date: logDate,
      bed_time: new Date(buildDatetime(bedDate, bedTime)).toISOString(),
      wake_time: wakeInstant.toISOString(),
      hours,
      quality,
      notes: notes.trim() || null,
    })

    push({ kind: 'success', title: 'Sleep log saved' })
    onClose()
  }, [bedDate, bedTime, wakeDate, wakeTime, hours, quality, notes, tz, upsert, onClose, push])

  const handleDelete = useCallback(async () => {
    if (!existingLog) return
    await del.mutateAsync(existingLog.id)
    push({ kind: 'success', title: 'Sleep log deleted' })
    onClose()
    setConfirmDelete(false)
  }, [existingLog, del, onClose, push])

  // ── Validation ──────────────────────────────────────────────────────────────
  const bedInstant = new Date(buildDatetime(bedDate, bedTime))
  const wakeInstant = new Date(buildDatetime(wakeDate, wakeTime))
  const wakeBeforeBed = wakeInstant <= bedInstant
  const hoursInvalid = hours <= 0 || hours > 24

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Bed time row */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary uppercase tracking-[0.06em]">
            Bed time
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={bedDate}
              onChange={(e) => setBedDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="flex-1 h-9 px-3 rounded-md bg-bg-deep border border-border-default text-text-primary text-base outline-none focus:border-border-strong transition-colors duration-[120ms] ease-out accent-accent"
            />
            <input
              type="time"
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-36 h-9 px-3 rounded-md bg-bg-deep border border-border-default text-text-primary text-base outline-none focus:border-border-strong transition-colors duration-[120ms] ease-out accent-accent"
            />
          </div>
        </div>

        {/* Wake time row */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary uppercase tracking-[0.06em]">
            Wake time
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={wakeDate}
              readOnly
              style={{ colorScheme: 'dark' }}
              className="flex-1 h-9 px-3 rounded-md bg-bg-deep border border-border-default text-text-muted text-base outline-none cursor-not-allowed"
            />
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className={`w-36 h-9 px-3 rounded-md bg-bg-deep border text-text-primary text-base outline-none focus:border-border-strong transition-colors duration-[120ms] ease-out accent-accent ${
                wakeBeforeBed ? 'border-danger' : 'border-border-default'
              }`}
            />
          </div>
          {wakeBeforeBed && (
            <span className="text-xs text-danger">Wake time must be after bed time.</span>
          )}
        </div>

        {/* Hours (auto-computed, can override) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em]">
              Hours slept
            </label>
            {hoursManual && (
              <button
                type="button"
                onClick={() => { setHoursManual(false) }}
                className="text-2xs text-accent hover:text-accent-hover cursor-pointer transition-colors"
              >
                Auto-compute
              </button>
            )}
          </div>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => {
              setHoursManual(true)
              setHours(parseFloat(e.target.value) || 0)
            }}
            className={`h-9 px-3 rounded-md bg-bg-deep border text-text-primary text-base tabular-nums outline-none focus:border-border-strong transition-colors duration-[120ms] ease-out ${
              hoursInvalid ? 'border-danger' : 'border-border-default'
            }`}
          />
          {!hoursManual && (
            <span className="text-2xs text-text-muted">Auto-computed from bed/wake times</span>
          )}
        </div>

        {/* Quality */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-secondary uppercase tracking-[0.06em]">
            Sleep quality
          </label>
          <QualityPicker value={quality} onChange={setQuality} />
          <span className="text-2xs text-text-muted">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][quality] ?? ''}
          </span>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary uppercase tracking-[0.06em]">
            Notes <span className="normal-case text-text-muted">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="How did you sleep?"
            className="w-full px-3 py-2 rounded-md bg-bg-deep border border-border-default text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-border-strong transition-colors duration-[120ms] ease-out resize-none"
          />
          {notes.length > 0 && (
            <span className="text-2xs text-text-muted text-right">{notes.length}/500</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
          <div>
            {existingLog && (
              <IconButton
                label="Delete sleep log"
                onClick={() => setConfirmDelete(true)}
                className="text-danger hover:text-danger hover:bg-danger/10"
              >
                <Trash size={16} weight="regular" aria-hidden="true" />
              </IconButton>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={upsert.isPending}
              disabled={wakeBeforeBed || hoursInvalid || quality === 0}
            >
              Save
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        message="Delete this sleep log? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={del.isPending}
      />
    </>
  )
}
