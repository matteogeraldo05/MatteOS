import { useState } from 'react'
import type { WeightLogEnriched } from './queries'
import LineChart from '../../charts/LineChart'
import EmptyState from '../../ui/EmptyState'

interface BodyChartsProps {
  data: WeightLogEnriched[]
  hasProfile: boolean
}

function buildSeries(data: WeightLogEnriched[], key: keyof WeightLogEnriched) {
  return data.map((d) => ({
    x: d.log_date.slice(5), // "MM-DD"
    y: (d[key] as number | null) ?? 0,
  }))
}

export default function BodyCharts({ data, hasProfile }: BodyChartsProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <EmptyState message="No weight data yet — log your first entry below." />
    )
  }

  const weightSeries = buildSeries(data, 'weight_lbs')
  const bmiSeries = data.map((d) => ({ x: d.log_date.slice(5), y: d.bmi ?? 0 }))
  const tdeeSeries = data.map((d) => ({ x: d.log_date.slice(5), y: d.tdee ?? 0 }))

  const hasBMI = hasProfile && data.some((d) => d.bmi !== null)
  const hasTDEE = hasProfile && data.some((d) => d.tdee !== null)

  return (
    <div className="flex flex-col gap-6">
      {/* Selected point tooltip */}
      {selectedDate && selectedWeight !== null && (
        <p className="text-sm text-text-secondary tabular-nums">
          {selectedDate}: <span className="text-text-primary font-medium">{selectedWeight.toFixed(1)} lbs</span>
        </p>
      )}

      {/* Weight chart */}
      <div>
        <p className="text-2xs text-text-secondary uppercase tracking-[0.08em] mb-2">Weight (lbs)</p>
        <LineChart
          data={weightSeries}
          unit=" lbs"
          height={180}
          onPointClick={(d) => {
            setSelectedDate(d.x)
            setSelectedWeight(d.y)
          }}
        />
      </div>

      {/* BMI chart */}
      <div>
        <p className="text-2xs text-text-secondary uppercase tracking-[0.08em] mb-2">BMI</p>
        {hasBMI ? (
          <LineChart
            data={bmiSeries.filter((d) => d.y !== 0)}
            height={180}
          />
        ) : (
          <EmptyState message="Set height, sex, and birth date in Settings to see BMI." />
        )}
      </div>

      {/* TDEE chart */}
      <div>
        <p className="text-2xs text-text-secondary uppercase tracking-[0.08em] mb-2">TDEE (kcal/day)</p>
        {hasTDEE ? (
          <LineChart
            data={tdeeSeries.filter((d) => d.y !== 0)}
            unit=" kcal"
            height={180}
          />
        ) : (
          <EmptyState message="Set your profile to see estimated TDEE." />
        )}
      </div>
    </div>
  )
}
