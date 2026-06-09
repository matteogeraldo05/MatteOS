import { useMemo } from 'react'
import type { WeightLogEnriched } from './queries'
import { useIsDesktop } from '../../lib/useIsDesktop'
import { addDays, toDateString } from '../../lib/dates'
import WeightChart from './WeightChart'
import BmiChart from './BmiChart'
import TdeeChart from './TdeeChart'
import EmptyState from '../../ui/EmptyState'

interface BodyChartsProps {
  data: WeightLogEnriched[]
  hasProfile: boolean
}

export default function BodyCharts({ data, hasProfile }: BodyChartsProps) {
  const isDesktop = useIsDesktop()
  const n = isDesktop ? 30 : 7

  const today = useMemo(() => new Date(), [])

  const chartData = useMemo(() => {
    const logMap = new Map(data.map((d) => [d.log_date, d]))
    return Array.from({ length: n }, (_, i) => {
      const date  = toDateString(addDays(today, -(n - 1 - i)))
      const entry = logMap.get(date)
      return {
        date,
        weight_lbs: entry?.weight_lbs ?? null,
        bmi:        entry?.bmi        ?? null,
        tdee:       entry?.tdee       ?? null,
      }
    })
  }, [data, n, today])

  if (data.length === 0) {
    return (
      <EmptyState message="No weight data yet — log your first entry below." />
    )
  }

  const hasBMI  = hasProfile && data.some((d) => d.bmi  !== null)
  const hasTDEE = hasProfile && data.some((d) => d.tdee !== null)

  return (
    <div className="flex flex-col gap-6">

      {/* Weight chart */}
      <div>
        <p className="text-2xs text-text-muted uppercase tracking-[0.08em] mb-2">Weight (lbs)</p>
        <WeightChart data={chartData} />
      </div>

      {/* BMI chart */}
      <div>
        <p className="text-2xs text-text-muted uppercase tracking-[0.08em] mb-2">BMI</p>
        {hasBMI ? (
          <BmiChart data={chartData} />
        ) : (
          <EmptyState message="Set height, sex, and birth date in Settings to see BMI." />
        )}
      </div>

      {/* TDEE chart */}
      <div>
        <p className="text-2xs text-text-muted uppercase tracking-[0.08em] mb-2">TDEE (kcal)</p>
        {hasTDEE ? (
          <TdeeChart data={chartData} />
        ) : (
          <EmptyState message="Set your profile to see estimated TDEE." />
        )}
      </div>

    </div>
  )
}
