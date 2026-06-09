import type { Transaction } from './queries'
import { CATEGORY_LABELS } from './queries'
import Tag from '../../ui/Tag'
import EmptyState from '../../ui/EmptyState'
import { centsToDisplay } from '../../lib/money'

function formatTxDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const thisYear = new Date().getFullYear()
  if (y !== thisYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (t: Transaction) => void
  onAdd: () => void
}

export default function TransactionList({ transactions, onEdit, onAdd }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        message="No transactions this month yet."
        ctaLabel="Add transaction"
        onCta={onAdd}
      />
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {transactions.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onEdit(t)}
          className="
            flex items-center gap-3 py-3 w-full text-left
            hover:bg-bg-hover transition-colors duration-[120ms] ease-out
            cursor-pointer
          "
        >
          {/* Date */}
          <span className="text-xs text-text-muted w-14 flex-shrink-0 tabular-nums">
            {formatTxDate(t.transaction_date)}
          </span>

          {/* Merchant */}
          <span className="flex-1 text-sm text-text-primary truncate font-medium">
            {t.merchant}
          </span>

          {/* Category tag */}
          <Tag kind="neutral">
            {CATEGORY_LABELS[t.category]}
          </Tag>

          {/* Amount */}
          <span className="text-sm text-text-primary tabular-nums flex-shrink-0">
            {centsToDisplay(t.amount_cents)}
          </span>
        </button>
      ))}
    </div>
  )
}
