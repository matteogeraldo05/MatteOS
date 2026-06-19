import { useState, useMemo } from 'react'
import { useWeightLogs } from './queries'
import { useAuth } from '../../auth/AuthProvider'
import { todayInTz } from '../../lib/dates'
import { Plus } from '@phosphor-icons/react'
import ScreenHeader from '../../ui/ScreenHeader'
import Panel from '../../ui/Panel'
import MetricCard from '../../ui/MetricCard'
import Toggle from '../../ui/Toggle'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'
import BodyCharts from './BodyCharts'
import BodyTable from './BodyTable'
import WeightLogForm from './WeightLogForm'

function PersonIcon() {
  return (
    <svg
      width={22} height={22} viewBox="0 0 256 256"
      fill="currentColor" aria-hidden="true"
      className="text-accent"
    >
      <path d="M128,40a32,32,0,1,0,32,32A32,32,0,0,0,128,40Zm0,56a24,24,0,1,1,24-24A24,24,0,0,1,128,96Zm48,24H80a24,24,0,0,0-24,24v48a8,8,0,0,0,16,0V144a8,8,0,0,1,8-8h96a8,8,0,0,1,8,8v48a8,8,0,0,0,16,0V144A24,24,0,0,0,176,120Z" />
    </svg>
  )
}

export default function BodyPage() {
  const { profile } = useAuth()
  const tz = profile?.timezone ?? 'UTC'
  const today = todayInTz(tz)

  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [logOpen, setLogOpen] = useState(false)

  const rangeEnd = useMemo(() => new Date(today + 'T00:00:00'), [today])
  const rangeStart = useMemo(() => {
    const d = new Date(rangeEnd)
    d.setDate(d.getDate() - 29)
    return d
  }, [rangeEnd])

  const { data: chartData = [], isLoading: chartLoading } = useWeightLogs(rangeStart, rangeEnd)

  const latest = chartData.length > 0 ? chartData[chartData.length - 1] : null
  const hasProfile = !!(profile?.height_cm && profile?.birth_date && profile?.sex)

  const weightDisplay = latest ? String(Math.round(latest.weight_lbs)) : '—'
  const bmiDisplay    = hasProfile && latest?.bmi != null ? latest.bmi.toFixed(1) : '—'
  const tdeeDisplay   = hasProfile && latest?.tdee != null ? Math.round(latest.tdee).toString() : '—'

  return (
    <>
      <ScreenHeader
        title="Body"
        icon={<PersonIcon />}
      />

      <Panel
        eyebrow="Body"
        right={
          <Toggle
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
          />
        }
      >
        {/* Metric cards row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MetricCard label="Weight (lbs)" value={weightDisplay} />
          <MetricCard
            label="BMI"
            value={bmiDisplay}
            subtext={!hasProfile ? 'Set up in Settings' : undefined}
          />
          <MetricCard
            label="TDEE"
            value={tdeeDisplay}
            unit={hasProfile && latest?.tdee != null ? 'kcal' : undefined}
            subtext={!hasProfile ? 'Set up in Settings' : undefined}
          />
        </div>

        {chartLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={20} />
          </div>
        ) : view === 'chart' ? (
          <BodyCharts data={chartData} hasProfile={hasProfile} />
        ) : (
          <BodyTable data={chartData} />
        )}
      </Panel>

      {/* Log Weight CTA */}
      <div className="py-6">
        <Button
          variant="primary"
          onClick={() => setLogOpen(true)}
          className="w-full h-12 text-base justify-center gap-2"
        >
          <Plus size={16} weight="bold" aria-hidden="true" />
          Log Weight
        </Button>
      </div>

      {/* Log Weight Modal */}
      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log weight"
      >
        <WeightLogForm onSaved={() => setLogOpen(false)} />
      </Modal>
    </>
  )
}
