import { useState, useMemo } from 'react'
import { useWeightLogs, useRecentWeightLogs } from './queries'
import { useAuth } from '../../auth/AuthProvider'
import { todayInTz } from '../../lib/dates'
import { ArrowUp } from '@phosphor-icons/react'
import ScreenHeader from '../../ui/ScreenHeader'
import Panel from '../../ui/Panel'
import MetricCard from '../../ui/MetricCard'
import Toggle from '../../ui/Toggle'
import Spinner from '../../ui/Spinner'
import BodyCharts from './BodyCharts'
import BodyTable from './BodyTable'
import WeightLogForm from './WeightLogForm'
import RecentWeightsList from './RecentWeightsList'

function fmt(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined) return '—'
  return val.toFixed(decimals)
}

export default function BodyPage() {
  const { profile } = useAuth()
  const tz = profile?.timezone ?? 'UTC'
  const today = todayInTz(tz)

  const [view, setView] = useState<'chart' | 'table'>('chart')

  // 30-day range ending today
  const rangeEnd = useMemo(() => new Date(today + 'T00:00:00'), [today])
  const rangeStart = useMemo(() => {
    const d = new Date(rangeEnd)
    d.setDate(d.getDate() - 29)
    return d
  }, [rangeEnd])

  const { data: chartData = [], isLoading: chartLoading } = useWeightLogs(rangeStart, rangeEnd)
  const { data: recentData = [], isLoading: recentLoading } = useRecentWeightLogs(10)

  // Latest entry for MetricCards
  const latest = chartData.length > 0 ? chartData[chartData.length - 1] : null

  const hasProfile = !!(profile?.height_cm && profile?.birth_date && profile?.sex)

  return (
    <>
      <ScreenHeader
        title="Body"
        icon={<ArrowUp size={22} weight="light" className="text-accent" aria-hidden="true" />}
      />

      {/* Panel A — Charts / Table */}
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
          <MetricCard
            label="Weight"
            value={fmt(latest?.weight_lbs)}
            unit={latest ? 'lbs' : undefined}
          />
          <MetricCard
            label="BMI"
            value={fmt(latest?.bmi)}
          />
          <MetricCard
            label="TDEE"
            value={latest?.tdee !== null && latest?.tdee !== undefined ? Math.round(latest.tdee).toString() : '—'}
            unit={latest?.tdee !== null && latest?.tdee !== undefined ? 'kcal' : undefined}
          />
        </div>

        {/* Chart or Table */}
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

      {/* Panel B — Log Weight */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: form */}
        <Panel eyebrow="Log Weight">
          <WeightLogForm />
        </Panel>

        {/* Right: recent entries */}
        <Panel eyebrow="Recent Entries">
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={16} />
            </div>
          ) : (
            <RecentWeightsList entries={recentData} />
          )}
        </Panel>
      </div>
    </>
  )
}
