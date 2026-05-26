import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CaretLeft, CaretRight, Plus, Diamond } from '@phosphor-icons/react'

import ScreenHeader from '../../ui/ScreenHeader'
import Panel from '../../ui/Panel'
import MetricCard from '../../ui/MetricCard'
import IconButton from '../../ui/IconButton'
import Toggle from '../../ui/Toggle'
import Spinner from '../../ui/Spinner'
import AgentButton from '../../shell/AgentButton'

import TransactionForm from './TransactionForm'
import type { TransactionPrefill } from './TransactionForm'
import TransactionList from './TransactionList'
import CategoryBreakdown from './CategoryBreakdown'
import ReceiptCapture from './ReceiptCapture'

import { useMonthTransactions } from './queries'
import type { Transaction } from './queries'
import { centsToDisplay } from '../../lib/money'

// ─── Month helpers ────────────────────────────────────────────────────────────

function currentYM(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function parseYM(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m }
}

function toYM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function shiftMonth(year: number, month: number, delta: 1 | -1): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

// ─── FinancePage ──────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const ym = searchParams.get('ym') ?? currentYM()
  const { year, month } = parseYM(ym)
  const isCurrentMonth = ym === currentYM()

  const { data: transactions = [], isLoading } = useMonthTransactions(year, month)

  // Category breakdown view toggle (lifted here so the Panel header can own it)
  const [categoryView, setCategoryView] = useState<'chart' | 'table'>('chart')

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [prefill, setPrefill] = useState<TransactionPrefill | undefined>()
  const [receiptOpen, setReceiptOpen] = useState(false)

  const openAdd = useCallback(() => {
    setEditingTx(null)
    setPrefill(undefined)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((t: Transaction) => {
    setEditingTx(t)
    setPrefill(undefined)
    setFormOpen(true)
  }, [])

  const openReceipt = useCallback(() => {
    setReceiptOpen(true)
  }, [])

  /** After receipt upload succeeds, open the TransactionForm with receipt linked */
  const handleReceiptPrefill = useCallback((data: TransactionPrefill) => {
    setPrefill(data)
    setEditingTx(null)
    // Small delay so ReceiptCapture modal can close first
    setTimeout(() => setFormOpen(true), 80)
  }, [])

  const closeForm = useCallback(() => setFormOpen(false), [])
  const closeReceipt = useCallback(() => setReceiptOpen(false), [])

  // Navigate months via URL params
  const goPrev = () => {
    const { year: y, month: m } = shiftMonth(year, month, -1)
    setSearchParams({ ym: toYM(y, m) }, { replace: true })
  }
  const goNext = () => {
    const { year: y, month: m } = shiftMonth(year, month, 1)
    setSearchParams({ ym: toYM(y, m) }, { replace: true })
  }

  // Derived totals
  const totalCents = transactions.reduce((sum, t) => sum + t.amount_cents, 0)
  const receiptCount = transactions.filter((t) => t.receipt_upload_id !== null).length

  return (
    <>
      <ScreenHeader
        title="Finance"
        icon={<Diamond size={22} weight="light" className="text-accent" aria-hidden="true" />}
        right={
          <AgentButton label="SCAN RECEIPT" onClick={openReceipt} />
        }
      />

      {/* ── Month picker ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <IconButton label="Previous month" onClick={goPrev}>
          <CaretLeft size={16} weight="bold" aria-hidden="true" />
        </IconButton>

        <span className="text-base font-medium text-text-primary min-w-[156px] text-center">
          {formatMonthLabel(year, month)}
        </span>

        <IconButton label="Next month" onClick={goNext} disabled={isCurrentMonth}>
          <CaretRight size={16} weight="bold" aria-hidden="true" />
        </IconButton>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={20} />
        </div>
      ) : (
        <>
          {/* ── Top row: Panel A + Panel B ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Panel A — Month totals */}
            <Panel eyebrow="Month">
              <div className="flex gap-8">
                <MetricCard
                  label="Total"
                  value={centsToDisplay(totalCents)}
                />
                <MetricCard
                  label="Receipts"
                  value={receiptCount}
                />
              </div>
            </Panel>

            {/* Panel B — By Category */}
            <Panel
              eyebrow="By Category"
              right={
                <Toggle
                  value={categoryView}
                  onChange={setCategoryView}
                  options={[
                    { value: 'chart', label: 'Chart' },
                    { value: 'table', label: 'Table' },
                  ]}
                />
              }
            >
              <CategoryBreakdown transactions={transactions} view={categoryView} />
            </Panel>
          </div>

          {/* ── Panel C — Transactions ───────────────────────────────────── */}
          <Panel eyebrow="Transactions">
            <TransactionList
              transactions={transactions}
              onEdit={openEdit}
              onAdd={openAdd}
            />
          </Panel>
        </>
      )}

      {/* ── Floating add button ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={openAdd}
        aria-label="Add transaction"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center
          bg-accent hover:bg-accent-hover shadow-lg transition-colors duration-[120ms] ease-out cursor-pointer"
      >
        <Plus size={24} weight="bold" className="text-white" aria-hidden="true" />
      </button>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <TransactionForm
        open={formOpen}
        onClose={closeForm}
        initial={editingTx}
        prefill={prefill}
      />

      <ReceiptCapture
        open={receiptOpen}
        onClose={closeReceipt}
        onPrefill={handleReceiptPrefill}
      />
    </>
  )
}
