import { useMemo, useState } from 'react'
import { chartTheme } from '../../charts/chartTheme'
import { formatDateShort } from '../../lib/dates'
import type { DayTotal } from './queries'

interface CalorieChartProps {
  data: DayTotal[]
  goal?: number | null
  height?: number
}

export default function CalorieChart({ data, goal, height = 200 }: CalorieChartProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const SVG_H = height
  const PAD_TOP = 16
  const PAD_BOT = 28
  const PAD_L = 8
  const PAD_R = goal != null ? 16 : 8 // extra right padding for goal label
  const plotH = SVG_H - PAD_TOP - PAD_BOT
  const plotW = 100 - PAD_L - PAD_R

  // Compute y range from valid data + goal
  const { minY, maxY } = useMemo(() => {
    const vals = data.filter((d) => d.total !== null).map((d) => d.total as number)
    const allVals = goal != null ? [...vals, goal] : vals
    if (allVals.length === 0) return { minY: 0, maxY: 2500 }
    const mn = Math.min(...allVals)
    const mx = Math.max(...allVals)
    const pad = (mx - mn) * 0.15 || 150
    return { minY: Math.max(0, mn - pad), maxY: mx + pad }
  }, [data, goal])

  const scaleX = (i: number) => PAD_L + (i / Math.max(data.length - 1, 1)) * plotW
  const scaleY = (v: number) => PAD_TOP + plotH * (1 - (v - minY) / (maxY - minY))

  // Grid ticks (4 horizontal lines)
  const gridTicks = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const val = minY + ((maxY - minY) * (i + 1)) / 4
      return { val, y: scaleY(val) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minY, maxY])

  // Build path segments — split at null values so gaps appear
  const segments = useMemo(() => {
    const segs: { points: { i: number; x: number; y: number }[] }[] = []
    let current: { i: number; x: number; y: number }[] = []

    data.forEach((d, i) => {
      if (d.total !== null) {
        current.push({ i, x: scaleX(i), y: scaleY(d.total) })
      } else {
        if (current.length > 0) {
          segs.push({ points: current })
          current = []
        }
      }
    })
    if (current.length > 0) segs.push({ points: current })
    return segs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, minY, maxY])

  const goalY = goal != null ? scaleY(goal) : null

  // X-axis labels — show every 6th index to avoid crowding
  const labelIndices = useMemo(() => {
    if (data.length === 0) return []
    const step = 6
    const indices: number[] = []
    for (let i = 0; i < data.length; i += step) {
      indices.push(i)
    }
    // Always include the last index
    const last = data.length - 1
    if (indices[indices.length - 1] !== last) indices.push(last)
    return indices
  }, [data.length])

  return (
    <div className="relative w-full" style={{ height: SVG_H }}>
      <svg
        width="100%"
        height={SVG_H}
        viewBox={`0 0 100 ${SVG_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="30-day calorie line chart"
      >
        {/* Grid lines */}
        {gridTicks.map(({ val, y }) => (
          <line
            key={val}
            x1={PAD_L}
            x2={100 - PAD_R}
            y1={y}
            y2={y}
            stroke={chartTheme.grid}
            strokeWidth="0.4"
          />
        ))}

        {/* Goal line */}
        {goalY != null && (
          <>
            <line
              x1={PAD_L}
              x2={100 - PAD_R}
              y1={goalY}
              y2={goalY}
              stroke={chartTheme.goal}
              strokeWidth="0.5"
              strokeDasharray="1.5 1"
            />
            <text
              x={100 - PAD_R + 1}
              y={goalY + 1.2}
              textAnchor="start"
              fill={chartTheme.goal}
              fontSize="3"
              fontFamily="var(--font-mono)"
            >
              {Math.round(goal!)}
            </text>
          </>
        )}

        {/* Line segments (gaps at null values) */}
        {segments.map((seg, si) => (
          <path
            key={si}
            d={seg.points
              .map((p, pi) => `${pi === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
              .join(' ')}
            fill="none"
            stroke={chartTheme.bar}
            strokeWidth="1"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Data points (only for non-null days) */}
        {data.map((d, i) => {
          if (d.total === null) return null
          const cx = scaleX(i)
          const cy = scaleY(d.total)
          const isSel = selected === i
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isSel ? 2.5 : 1.5}
              fill={chartTheme.bar}
              stroke={isSel ? 'var(--color-border-strong)' : 'none'}
              strokeWidth={isSel ? 0.6 : 0}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected(selected === i ? null : i)}
            />
          )
        })}

        {/* X-axis labels */}
        {labelIndices.map((i) => (
          <text
            key={i}
            x={scaleX(i)}
            y={SVG_H - PAD_BOT / 5}
            textAnchor="middle"
            fill={chartTheme.axisColor}
            fontSize="3"
            fontFamily="var(--font-mono)"
          >
            {/* Short label: "May 1" → "5/1" */}
            {(() => {
              const [, m, d] = data[i].date.split('-').map(Number)
              return `${m}/${d}`
            })()}
          </text>
        ))}
      </svg>

      {/* Tooltip for selected point */}
      {selected !== null && data[selected]?.total !== null && (
        <div className="absolute top-2 right-2 bg-bg-raised border border-border-default rounded-md px-2 py-1 text-xs text-text-primary tabular-nums z-10 pointer-events-none">
          {formatDateShort(data[selected].date)}:{' '}
          <span className="font-medium">{data[selected].total} kcal</span>
        </div>
      )}
    </div>
  )
}
