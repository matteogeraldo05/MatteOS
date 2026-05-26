import type { WeightLogEnriched } from './queries'
import EmptyState from '../../ui/EmptyState'
import { formatDateShort } from '../../lib/dates'

interface BodyTableProps {
  data: WeightLogEnriched[]
}

function fmt(val: number | null, decimals = 1): string {
  if (val === null || val === undefined) return '—'
  return val.toFixed(decimals)
}

export default function BodyTable({ data }: BodyTableProps) {
  if (data.length === 0) {
    return <EmptyState message="No entries in this range." />
  }

  // Show most recent first in the table
  const sorted = [...data].sort((a, b) => b.log_date.localeCompare(a.log_date))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left text-2xs text-text-muted uppercase tracking-[0.08em] py-2 pr-4 font-medium">
              Date
            </th>
            <th className="text-right text-2xs text-text-muted uppercase tracking-[0.08em] py-2 pr-4 font-medium">
              Weight (lbs)
            </th>
            <th className="text-right text-2xs text-text-muted uppercase tracking-[0.08em] py-2 pr-4 font-medium">
              BMI
            </th>
            <th className="text-right text-2xs text-text-muted uppercase tracking-[0.08em] py-2 font-medium">
              TDEE (kcal)
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border-subtle last:border-0 hover:bg-bg-hover transition-colors duration-[120ms]"
            >
              <td className="py-2.5 pr-4 text-text-secondary text-sm tabular-nums">
                {formatDateShort(row.log_date)}
              </td>
              <td className="py-2.5 pr-4 text-right text-text-primary tabular-nums font-medium">
                {fmt(row.weight_lbs)}
              </td>
              <td className="py-2.5 pr-4 text-right text-text-secondary tabular-nums">
                {fmt(row.bmi, 1)}
              </td>
              <td className="py-2.5 text-right text-text-secondary tabular-nums">
                {fmt(row.tdee, 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
