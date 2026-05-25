import { useState, useMemo } from 'react'
import { Plus, Moon } from '@phosphor-icons/react'
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

  const today      = useMemo(() => new Date(), [])
  const rangeStart = useMemo(() => addDays(today, isDesktop ? -29 : -6), [today, isDesktop])
  const rangeEnd   = today

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
