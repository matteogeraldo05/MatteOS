import { useState, useMemo } from 'react'
import { CheckSquare, CaretLeft, CaretRight } from '@phosphor-icons/react'
import Toggle from '../../ui/Toggle'
import Modal from '../../ui/Modal'
import { useAuth } from '../../auth/AuthProvider'
import { todayInTz } from '../../lib/dates'
import { useDayInstances } from './queries'
import type { TodoTaskInstance, Task } from './queries'
import TaskListView from './TaskListView'
import TaskTimelineView from './TaskTimelineView'
import TaskForm from './TaskForm'

// ─── Types ───────────────────────────────────────────────────────────────────

type View = 'list' | 'timeline'

interface ModalState {
  open: boolean
  existingTask: Task | null
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function navigateDay(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  return date.toLocaleDateString('en-CA')
}

/** "MON, MAY 25" */
function shortDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase()
}

// ─── Day navigation ───────────────────────────────────────────────────────────

function DayNav({
  date,
  today,
  onPrev,
  onNext,
}: {
  date: string
  today: string
  onPrev: () => void
  onNext: () => void
}) {
  const isToday = date === today
  const label = isToday ? 'TODAY' : shortDateLabel(date)

  const navBtn =
    'w-7 h-7 flex items-center justify-center rounded text-text-secondary ' +
    'hover:text-text-primary hover:bg-bg-hover transition-colors duration-[120ms] ease-out'

  return (
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={onPrev} className={navBtn} aria-label="Previous day">
        <CaretLeft size={13} weight="bold" aria-hidden="true" />
      </button>
      <span className="text-2xs text-text-muted uppercase tracking-[0.08em] min-w-[72px] text-center select-none px-1">
        {label}
      </span>
      <button type="button" onClick={onNext} className={navBtn} aria-label="Next day">
        <CaretRight size={13} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TodoPage() {
  const { profile } = useAuth()

  const tz    = profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const today = useMemo(() => todayInTz(tz), [tz])

  const [date, setDate] = useState(today)
  const [view, setView] = useState<View>('list')

  const viewOptions: [{ value: View; label: string }, { value: View; label: string }] = [
    { value: 'list',     label: 'List' },
    { value: 'timeline', label: 'Day'  },
  ]

  const { today: instances, overdue: overdueInstances, isLoading } = useDayInstances(date, today)

  const pendingCount = [
    ...instances.filter((i) => !i.completed),
    ...overdueInstances.filter((i) => !i.completed),
  ].length
  const totalCount = instances.length + overdueInstances.length

  const [modal, setModal] = useState<ModalState>({ open: false, existingTask: null })

  function openCreate() { setModal({ open: true, existingTask: null }) }
  function openEdit(instance: TodoTaskInstance) {
    setModal({ open: true, existingTask: instance.task })
  }
  function closeModal() { setModal((prev) => ({ ...prev, open: false })) }

  return (
    <>
      {/* ── Three-row header ─────────────────────────────────────────────── */}
      <header className="mb-8">

        {/* Row 1 — Title */}
        <div className="flex items-center gap-2 mb-1">
          <CheckSquare size={22} weight="light" className="text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-medium text-text-primary">To-do</h1>
        </div>

        {/* Row 2 — Stats */}
        <p className="text-2xs text-text-muted uppercase tracking-[0.08em] mb-5">
          {pendingCount}/{totalCount} tasks left
          {' · '}
          {date === today ? 'TODAY' : shortDateLabel(date)}
        </p>

        {/* Row 3 — Toggle + day navigation */}
        <div className="flex items-center justify-between">
          <Toggle value={view} onChange={setView} options={viewOptions} />
          <DayNav
            date={date}
            today={today}
            onPrev={() => setDate(navigateDay(date, -1))}
            onNext={() => setDate(navigateDay(date,  1))}
          />
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {view === 'list' ? (
        <TaskListView
          instances={instances}
          overdueInstances={overdueInstances}
          isLoading={isLoading}
          onTaskClick={openEdit}
          onAddClick={openCreate}
        />
      ) : (
        <TaskTimelineView
          instances={instances}
          selectedDate={date === today ? 'TODAY' : shortDateLabel(date)}
          onTaskClick={openEdit}
        />
      )}

      {/* Task form modal */}
      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.existingTask ? 'Edit task' : 'New task'}
      >
        <TaskForm
          key={modal.existingTask?.id ?? 'new'}
          initialDate={date}
          existingTask={modal.existingTask}
          onClose={closeModal}
        />
      </Modal>
    </>
  )
}
