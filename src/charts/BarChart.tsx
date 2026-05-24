import { useMemo, useState } from 'react'
import { chartTheme } from './chartTheme'

interface BarDatum {
  x: string
  y: number
  highlighted?: boolean
  below?: boolean
}

interface BarChartProps {
  data: BarDatum[]
  goal?: number
  unit?: string
  height?: number
}

export default function BarChart({ data, goal, unit = '', height = 200 }: BarChartProps) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)

  const maxY = useMemo(() => {
    const vals = data.map((d) => d.y)
    const m = Math.max(...vals, goal ?? 0)
    return m === 0 ? 10 : m * 1.15
  }, [data, goal])

  const SVG_H = height
  const SVG_PADDING_TOP = 16
  const SVG_PADDING_BOTTOM = 28
  const SVG_PADDING_LEFT = 8
  const plotH = SVG_H - SVG_PADDING_TOP - SVG_PADDING_BOTTOM

  const n = data.length
  const colW = n === 0 ? 0 : (100 / n)
  const BAR_WIDTH_PCT = 0.6

  const yTick = (val: number) => SVG_PADDING_TOP + plotH * (1 - val / maxY)

  const gridTicks = useMemo(() => {
    return Array.from({ length: chartTheme.gridLines }, (_, i) => {
      const val = (maxY * (i + 1)) / chartTheme.gridLines
      return { val, y: yTick(val) }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxY, plotH])

  return (
    <div className="relative w-full" style={{ height: SVG_H }}>
      <svg
        width="100%"
        height={SVG_H}
        viewBox={`0 0 100 ${SVG_H}`}
        preserveAspectRatio="none"
        aria-label="Bar chart"
        role="img"
      >
        {/* Grid lines */}
        {gridTicks.map(({ val, y }) => (
          <line
            key={val}
            x1={SVG_PADDING_LEFT}
            x2={100 - SVG_PADDING_LEFT}
            y1={y}
            y2={y}
            stroke={chartTheme.grid}
            strokeWidth="0.4"
          />
        ))}

        {/* Goal line */}
        {goal !== undefined && (
          <>
            <line
              x1={SVG_PADDING_LEFT}
              x2={100 - SVG_PADDING_LEFT}
              y1={yTick(goal)}
              y2={yTick(goal)}
              stroke={chartTheme.goal}
              strokeWidth="0.5"
              strokeDasharray="1.5,1"
            />
            <text
              x={100 - SVG_PADDING_LEFT}
              y={yTick(goal) - 1.5}
              textAnchor="end"
              fill={chartTheme.goal}
              fontSize="3.5"
              fontFamily="var(--font-mono)"
            >
              {goal}{unit}
            </text>
          </>
        )}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = SVG_PADDING_LEFT + (i + 0.5) * ((100 - SVG_PADDING_LEFT * 2) / n)
          const bw = (colW * BAR_WIDTH_PCT * (100 - SVG_PADDING_LEFT * 2)) / 100
          const barH = (d.y / maxY) * plotH
          const bx = cx - bw / 2
          const by = SVG_PADDING_TOP + plotH - barH
          const fill = d.y === 0 ? chartTheme.barDim : d.below ? '#5b6172' : chartTheme.bar

          return (
            <g key={i}>
              <rect
                x={bx}
                y={by}
                width={bw}
                height={Math.max(barH, 0)}
                fill={fill}
                rx="0.8"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const svg = e.currentTarget.ownerSVGElement!
                  const rect = svg.getBoundingClientRect()
                  setTooltip({ idx: i, x: (rect.width * (bx + bw / 2)) / 100, y: (rect.height * by) / SVG_H })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {/* X label */}
              <text
                x={cx}
                y={SVG_H - SVG_PADDING_BOTTOM / 4}
                textAnchor="middle"
                fill={chartTheme.axisColor}
                fontSize="3"
                fontFamily="var(--font-mono)"
              >
                {d.x}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltip !== null && data[tooltip.idx] && (
        <div
          className="absolute pointer-events-none bg-bg-raised border border-border-default rounded-md px-2 py-1 text-xs text-text-primary whitespace-nowrap z-10"
          style={{ left: tooltip.x + 4, top: Math.max(0, tooltip.y - 4) }}
        >
          <span className="text-text-secondary">{data[tooltip.idx].x}</span>
          {' '}
          <span className="font-medium tabular-nums">{data[tooltip.idx].y}{unit}</span>
        </div>
      )}
    </div>
  )
}
