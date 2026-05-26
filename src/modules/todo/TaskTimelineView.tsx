import DayTimeline from '../../charts/DayTimeline'
import type { TagKind } from '../../charts/DayTimeline'
import type { TodoTaskInstance, TaskTag } from './queries'

const TAG_BORDER_COLORS: Record<TaskTag, string> = {
  gym: '#3ecf8e',
  finance: '#f5a524',
  personal: '#7a7fff',
  work: '#4a72ff',
}

interface TaskTimelineViewProps {
  instances: TodoTaskInstance[]
  selectedDate: string
  onTaskClick: (instance: TodoTaskInstance) => void
}

/** Converts a "HH:MM:SS" time string to minutes from midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export default function TaskTimelineView({
  instances,
  selectedDate,
  onTaskClick,
}: TaskTimelineViewProps) {
  // Separate all-day (no due_time) from timed
  const allDay = instances.filter((i) => !i.task.due_time)
  const timed = instances.filter((i) => i.task.due_time)

  // Map timed instances to TimelineBlock format
  const blocks = timed.map((inst) => ({
    start: timeToMinutes(inst.task.due_time!),
    durationMin: inst.task.duration_minutes ?? 30,
    title: inst.task.title,
    tagKind: inst.task.tag as TagKind,
    completed: inst.completed,
    onClick: () => onTaskClick(inst),
  }))

  return (
    <div className="flex flex-col gap-0">
      {/* All-day strip */}
      {allDay.length > 0 && (
        <div className="border-b border-border-subtle">
          <div className="px-3 py-1.5">
            <span className="text-2xs text-text-muted uppercase tracking-[0.08em]">All day</span>
          </div>
          <div className="flex flex-col gap-1 px-3 pb-3">
            {allDay.map((inst) => (
              <button
                key={`${inst.task.id}|${inst.date}`}
                type="button"
                onClick={() => onTaskClick(inst)}
                className={`
                  w-full text-left px-2 py-1.5 rounded-md text-sm font-medium
                  transition-colors duration-[120ms] ease-out cursor-pointer
                  bg-accent-soft hover:brightness-110
                  ${inst.completed ? 'opacity-50 line-through' : ''}
                `}
                style={{
                  borderLeft: `3px solid ${TAG_BORDER_COLORS[inst.task.tag]}`,
                }}
              >
                {inst.task.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timed blocks in the day timeline */}
      <div className="pt-2">
        <DayTimeline blocks={blocks} selectedDate={selectedDate} />
      </div>
    </div>
  )
}
