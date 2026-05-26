import { formatDateShort } from '../../lib/dates'
import type { DayTotal } from './queries'
import EmptyState from '../../ui/EmptyState'

interface CalorieTableProps {
  data: DayTotal[]
  goal?: number | null
}

export default function CalorieTable({ data, goal }: CalorieTableProps) {
  const hasAnyData = data.some((d) => d.total !== null)

  if (!hasAnyData) {
    return <EmptyState message="No calorie data in the last 30 days." />
  }

  // Show in reverse-chronological order (most recent first)
  const sorted = [...data].reverse()

  return (
    <div className="overflow-hidden rounded-md border border-border-default">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left px-4 py-2.5 text-xs uppercase tracking-[0.06em] text-text-secondary font-medium">
              Date
            </th>
            <th className="text-right px-4 py-2.5 text-xs uppercase tracking-[0.06em] text-text-secondary font-medium">
              Calories
            </th>
            {goal != null && (
              <th className="text-right px-4 py-2.5 text-xs uppercase tracking-[0.06em] text-text-secondary font-medium">
                vs. Goal
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            if (row.total === null) return null

            const pct = goal ? Math.round((row.total / goal) * 100) : null
            const over = pct != null && pct > 110
            const warn = pct != null && pct >= 90 && pct <= 110

            return (
              <tr
                key={row.date}
                className="border-b border-border-subtle last:border-0 hover:bg-bg-hover transition-colors duration-[120ms]"
              >
                <td className="px-4 py-2.5 text-text-secondary">
                  {formatDateShort(row.date)}
                </td>
                <td className="px-4 py-2.5 text-right text-text-primary font-medium tabular-nums">
                  {row.total.toLocaleString()} kcal
                </td>
                {goal != null && (
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums text-xs ${
                      over
                        ? 'text-danger'
                        : warn
                        ? 'text-warning'
                        : 'text-text-muted'
                    }`}
                  >
                    {pct}%
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
