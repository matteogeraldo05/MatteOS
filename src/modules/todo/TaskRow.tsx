import { ArrowsClockwise } from '@phosphor-icons/react'
import { formatTime } from '../../lib/dates'
import type { TodoTaskInstance, TaskTag, RecurrenceType } from './queries'

// ─── Tag pill ────────────────────────────────────────────────────────────────

const TAG_LABELS: Record<TaskTag, string> = {
  gym: 'GYM',
  personal: 'PERSONAL',
  work: 'WORK',
  finance: 'FINANCE',
}

function TagPill({ tag }: { tag: TaskTag }) {
  const isGym = tag === 'gym'
  return (
    <span
      className={`
        inline-flex items-center text-2xs font-medium uppercase tracking-[0.06em]
        px-2 py-0.5 rounded-sm flex-shrink-0
        ${isGym
          ? 'bg-accent text-white'
          : 'border border-border-default text-text-muted'
        }
      `}
    >
      {TAG_LABELS[tag]}
    </span>
  )
}

// ─── Checkbox ────────────────────────────────────────────────────────────────

function Checkbox({ checked, pending }: { checked: boolean; pending?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`
        flex-shrink-0 w-[18px] h-[18px] rounded-sm border
        flex items-center justify-center
        transition-colors duration-[120ms] ease-out
        ${checked ? 'bg-accent border-accent' : 'bg-transparent border-border-default'}
        ${pending ? 'opacity-50' : ''}
      `}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

// ─── Grip handle ─────────────────────────────────────────────────────────────

function GripHandle() {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      aria-hidden="true"
      className="text-text-disabled flex-shrink-0 cursor-grab active:cursor-grabbing"
    >
      <circle cx="3" cy="3.5" r="1.3" fill="currentColor" />
      <circle cx="9" cy="3.5" r="1.3" fill="currentColor" />
      <circle cx="3" cy="8"   r="1.3" fill="currentColor" />
      <circle cx="9" cy="8"   r="1.3" fill="currentColor" />
      <circle cx="3" cy="12.5" r="1.3" fill="currentColor" />
      <circle cx="9" cy="12.5" r="1.3" fill="currentColor" />
    </svg>
  )
}

// ─── Recurrence badge ─────────────────────────────────────────────────────────

const REC_LABELS: Partial<Record<RecurrenceType, string>> = {
  daily: 'DAILY',
  mwf:   'M·W·F',
  weekly:   'WEEKLY',
  monthly:  'MONTHLY',
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TaskRowProps {
  instance: TodoTaskInstance
  onToggle: (instance: TodoTaskInstance) => void
  onClick: (instance: TodoTaskInstance) => void
  togglePending?: boolean
  /** Show the date in the subtitle row in warning color (carry-forward tasks) */
  overdueDate?: string
  /** Hide the drag grip handle for non-draggable rows (e.g. overdue section) */
  showGrip?: boolean
  // Drag & drop
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  /** Touch-drag: fired when the user presses the grip handle on a touch device */
  onGripTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskRow({
  instance,
  onToggle,
  onClick,
  togglePending,
  overdueDate,
  showGrip = true,
  isDragging,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onGripTouchStart,
}: TaskRowProps) {
  const { task, completed } = instance

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    onToggle(instance)
  }

  // Subtitle: "7:00 AM · DAILY ↻" or "Due May 20" (overdue) or both
  const dueLabel  = task.due_time ? formatTime(task.due_time.slice(0, 5)) : null
  const recLabel  = REC_LABELS[task.recurrence_type] ?? null
  const hasSubtitle = dueLabel || recLabel || overdueDate

  // Format overdue date for display: "Due May 20"
  const overdueDateLabel = overdueDate
    ? 'Due ' + new Date(overdueDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div
      draggable={showGrip}
      onDragStart={showGrip ? onDragStart : undefined}
      onDragOver={showGrip ? onDragOver : undefined}
      onDragLeave={showGrip ? onDragLeave : undefined}
      onDrop={showGrip ? onDrop : undefined}
      onDragEnd={showGrip ? onDragEnd : undefined}
      className={`
        flex items-center gap-3 px-4 py-3
        cursor-pointer hover:bg-bg-hover
        transition-colors duration-[120ms] ease-out
        select-none
        ${isDragging ? 'opacity-40' : ''}
        ${completed ? 'opacity-60' : ''}
      `}
      onClick={() => onClick(instance)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(instance)
      }}
      aria-label={`${task.title}${completed ? ' (completed)' : ''}`}
    >
      {/* Drag grip — hidden for overdue rows */}
      {showGrip ? (
        <div
          onTouchStart={onGripTouchStart}
          onClick={(e) => e.stopPropagation()}
          className="touch-none flex-shrink-0"
        >
          <GripHandle />
        </div>
      ) : <div className="w-3 flex-shrink-0" />}

      {/* Checkbox */}
      <button
        type="button"
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        onClick={handleToggle}
        className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
      >
        <Checkbox checked={completed} pending={togglePending} />
      </button>

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm text-text-primary truncate ${
            completed ? 'line-through text-text-muted' : ''
          }`}
        >
          {task.title}
        </p>
        {hasSubtitle && (
          <p className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
            {overdueDateLabel && (
              <span className="text-warning">{overdueDateLabel}</span>
            )}
            {overdueDateLabel && (dueLabel || recLabel) && <span>·</span>}
            {dueLabel && <span>{dueLabel}</span>}
            {dueLabel && recLabel && <span>·</span>}
            {recLabel && (
              <>
                <ArrowsClockwise size={11} weight="regular" aria-hidden="true" />
                <span>{recLabel}</span>
              </>
            )}
          </p>
        )}
      </div>

      {/* Tag pill */}
      <TagPill tag={task.tag} />
    </div>
  )
}
