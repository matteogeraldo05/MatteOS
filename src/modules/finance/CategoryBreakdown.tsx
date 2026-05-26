import type { Transaction, FinanceCategory } from './queries'
import { CATEGORY_LABELS } from './queries'
import HorizontalBarList from '../../charts/HorizontalBarList'
import EmptyState from '../../ui/EmptyState'
import { centsToDisplay } from '../../lib/money'

interface CategoryTotals {
  category: FinanceCategory
  label: string
  total: number
  count: number
}

function computeTotals(transactions: Transaction[]): CategoryTotals[] {
  const map = new Map<FinanceCategory, { total: number; count: number }>()

  for (const t of transactions) {
    const existing = map.get(t.category) ?? { total: 0, count: 0 }
    map.set(t.category, {
      total: existing.total + t.amount_cents,
      count: existing.count + 1,
    })
  }

  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({
      category,
      label: CATEGORY_LABELS[category],
      total,
      count,
    }))
    .sort((a, b) => b.total - a.total)
}

interface CategoryBreakdownProps {
  transactions: Transaction[]
  view: 'chart' | 'table'
}

export default function CategoryBreakdown({ transactions, view }: CategoryBreakdownProps) {
  const totals = computeTotals(transactions)

  if (totals.length === 0) {
    return <EmptyState message="No spending this month to break down." />
  }

  if (view === 'chart') {
    return (
      <HorizontalBarList
        items={totals.map((row) => ({ label: row.label, value: row.total }))}
        format={(val) => centsToDisplay(val)}
      />
    )
  }

  // Table view
  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {/* Header row */}
      <div className="flex items-center py-2 text-2xs text-text-muted uppercase tracking-[0.06em]">
        <span className="flex-1">Category</span>
        <span className="w-14 text-right">Count</span>
        <span className="w-24 text-right">Total</span>
      </div>
      {totals.map((row) => (
        <div key={row.category} className="flex items-center py-2.5 text-sm">
          <span className="flex-1 text-text-secondary">{row.label}</span>
          <span className="w-14 text-right text-text-muted tabular-nums">{row.count}</span>
          <span className="w-24 text-right text-text-primary tabular-nums">
            {centsToDisplay(row.total)}
          </span>
        </div>
      ))}
    </div>
  )
}
