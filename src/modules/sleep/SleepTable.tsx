import EmptyState from '../../ui/EmptyState'
import { toDateString } from '../../lib/dates'
import type { SleepLog } from './queries'

interface SleepTableProps {
  logs: SleepLog[]
  goal: number
  onRowClick: (log: SleepLog) => void
  onAddClick: () => void
}

function qualityLabel(q: number): string {
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
  return labels[q] ?? String(q)
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
}

export default function SleepTable({ logs, goal, onRowClick, onAddClick }: SleepTableProps) {
  if (logs.length === 0) {
    return (
      <EmptyState
        message="No sleep data yet — log your first night."
        ctaLabel="Log tonight"
        onCta={onAddClick}
      />
    )
  }

  // Display in reverse chronological order in table view
  const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date))

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left text-2xs text-text-secondary uppercase tracking-[0.08em] py-2 pr-4 font-medium">
              Date
            </th>
            <th className="text-left text-2xs text-text-secondary uppercase tracking-[0.08em] py-2 pr-4 font-medium hidden sm:table-cell">
              Bed
            </th>
            <th className="text-left text-2xs text-text-secondary uppercase tracking-[0.08em] py-2 pr-4 font-medium hidden sm:table-cell">
              Wake
            </th>
            <th className="text-right text-2xs text-text-secondary uppercase tracking-[0.08em] py-2 pr-4 font-medium">
              Hours
            </th>
            <th className="text-left text-2xs text-text-secondary uppercase tracking-[0.08em] py-2 font-medium hidden md:table-cell">
              Quality
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((log) => {
            const belowGoal = log.hours < goal
            return (
              <tr
                key={log.id}
                onClick={() => onRowClick(log)}
                className="border-b border-border-subtle hover:bg-bg-hover cursor-pointer transition-colors duration-[120ms] ease-out"
              >
                <td className="py-3 pr-4 text-text-primary text-sm">
                  {formatDateDisplay(log.log_date)}
                </td>
                <td className="py-3 pr-4 text-text-secondary text-sm tabular-nums hidden sm:table-cell">
                  {formatTimestamp(log.bed_time)}
                </td>
                <td className="py-3 pr-4 text-text-secondary text-sm tabular-nums hidden sm:table-cell">
                  {formatTimestamp(log.wake_time)}
                </td>
                <td className={`py-3 pr-4 text-right text-sm tabular-nums font-medium ${belowGoal ? 'text-text-muted' : 'text-text-primary'}`}>
                  {log.hours.toFixed(1)}h
                </td>
                <td className="py-3 text-text-secondary text-sm hidden md:table-cell">
                  {qualityLabel(log.quality)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Helper export used by SleepPage to determine today's date for default log_date
export function todayDateStr(): string {
  return toDateString(new Date())
}
