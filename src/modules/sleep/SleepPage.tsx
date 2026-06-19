import { useState, useMemo } from 'react'
import { Plus, Moon, CaretLeft, CaretRight } from '@phosphor-icons/react'
import ScreenHeader from '../../ui/ScreenHeader'
import Toggle from '../../ui/Toggle'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Spinner from '../../ui/Spinner'
import { useSleepLogs, useSleepGoal, type SleepLog } from './queries'
import SleepChart from './SleepChart'
import SleepTable from './SleepTable'
import SleepLogForm from './SleepLogForm'
import CycleCalculator from './CycleCalculator'
import { addDays, toDateString } from '../../lib/dates'
import { useMediaQuery } from '../../lib/useMediaQuery'

interface ModalState {
  open: boolean
  date: string
  log: SleepLog | null
}

export default function SleepPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const sleepGoal = useSleepGoal()

  const [periodOffset, setPeriodOffset] = useState(0)
  const periodDays = isDesktop ? 30 : 7

  const today = useMemo(() => new Date(), [])
  const rangeEnd = useMemo(
    () => addDays(today, -periodOffset * periodDays),
    [today, periodOffset, periodDays],
  )
  const rangeStart = useMemo(
    () => addDays(rangeEnd, -(periodDays - 1)),
    [rangeEnd, periodDays],
  )

  const periodLabel = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(rangeStart)} – ${fmt(rangeEnd)}`
  }, [rangeStart, rangeEnd])

  const { data: logs = [], isLoading } = useSleepLogs(rangeStart, rangeEnd)

  // ── View toggle ────────────────────────────────────────────────────────────
  type View = 'chart' | 'table'
  const [view, setView] = useState<View>('chart')
  const viewOptions: [{ value: View; label: string }, { value: View; label: string }] = [
    { value: 'chart', label: 'Chart' },
    { value: 'table', label: 'Table' },
  ]

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState<ModalState>({
    open: false,
    date: toDateString(today),
    log: null,
  })

  function openAdd() {
    setModal({ open: true, date: toDateString(today), log: null })
  }
  function openEdit(date: string, log: SleepLog | null) {
    setModal({ open: true, date, log })
  }
  function closeModal() {
    setModal((prev) => ({ ...prev, open: false }))
  }

  return (
    <>
      <ScreenHeader
        title="Sleep"
        icon={<Moon size={22} weight="light" className="text-accent" aria-hidden="true" />}
      />

      {/* ── Sleep Log section ──────────────────────────────────────────────── */}
      <div className="py-6">
        {/* Period navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setPeriodOffset((o) => o + 1)}
            aria-label="Previous period"
            className="w-8 h-8 flex items-center justify-center rounded-md
              text-text-secondary hover:text-text-primary hover:bg-bg-hover
              transition-colors duration-[120ms] ease-out cursor-pointer"
          >
            <CaretLeft size={14} weight="bold" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-primary tabular-nums">
              {periodLabel}
            </span>
            {periodOffset > 0 && (
              <button
                type="button"
                onClick={() => setPeriodOffset(0)}
                className="text-xs text-accent hover:underline cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setPeriodOffset((o) => Math.max(0, o - 1))}
            disabled={periodOffset === 0}
            aria-label="Next period"
            className="w-8 h-8 flex items-center justify-center rounded-md
              text-text-secondary hover:text-text-primary hover:bg-bg-hover
              transition-colors duration-[120ms] ease-out cursor-pointer
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <CaretRight size={14} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Chart / Table toggle — right-aligned */}
        <div className="flex justify-end mb-5">
          <Toggle value={view} onChange={setView} options={viewOptions} />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={20} />
          </div>
        ) : view === 'chart' ? (
          <SleepChart
            logs={logs}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            goal={sleepGoal}
            rangeLabel={`${periodDays} DAYS`}
            onBarClick={openEdit}
          />
        ) : (
          <SleepTable
            logs={logs}
            goal={sleepGoal}
            onRowClick={(log) => openEdit(log.log_date, log)}
            onAddClick={openAdd}
          />
        )}
      </div>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div className="border-t border-border-subtle" />

      {/* ── Primary CTA ────────────────────────────────────────────────────── */}
      <div className="py-6">
        <Button
          variant="primary"
          onClick={openAdd}
          className="w-full h-12 text-base justify-center gap-2"
        >
          <Plus size={16} weight="bold" aria-hidden="true" />
          Log Sleep
        </Button>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div className="border-t border-border-subtle" />

      {/* ── Cycle calculator (no section label) ────────────────────────────── */}
      <div className="py-6">
        <CycleCalculator />
      </div>

      {/* Modal */}
      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.log ? 'Edit sleep log' : 'Log sleep'}
      >
        <SleepLogForm
          key={modal.date + (modal.log?.id ?? 'new')}
          initialDate={modal.date}
          existingLog={modal.log}
          onClose={closeModal}
        />
      </Modal>
    </>
  )
}
