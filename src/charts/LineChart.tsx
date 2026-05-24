import { useMemo, useState } from 'react'
import { chartTheme } from './chartTheme'

interface LineDatum {
  x: string
  y: number
}

interface LineChartProps {
  data: LineDatum[]
  unit?: string
  height?: number
  onPointClick?: (datum: LineDatum) => void
}

export default function LineChart({ data, unit = '', height = 200, onPointClick }: LineChartProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const SVG_H = height
  const PAD_TOP = 16
  const PAD_BOT = 28
  const PAD_L = 8
  const PAD_R = 8
  const plotH = SVG_H - PAD_TOP - PAD_BOT
  const plotW = 100 - PAD_L - PAD_R

  const { minY, maxY } = useMemo(() => {
    if (data.length === 0) return { minY: 0, maxY: 10 }
    const vals = data.map((d) => d.y)
    const mn = Math.min(...vals)
    const mx = Math.max(...vals)
    const pad = (mx - mn) * 0.15 || 1
    return { minY: mn - pad, maxY: mx + pad }
  }, [data])

  const scaleX = (i: number) => PAD_L + (i / Math.max(data.length - 1, 1)) * plotW
  const scaleY = (v: number) => PAD_TOP + plotH * (1 - (v - minY) / (maxY - minY))

  const gridTicks = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const val = minY + ((maxY - minY) * (i + 1)) / 4
      return { val, y: scaleY(val) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minY, maxY])

  const pathD = useMemo(() => {
    if (data.length === 0) return ''
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i).toFixed(2)} ${scaleY(d.y).toFixed(2)}`)
      .join(' ')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, minY, maxY])

  return (
    <div className="relative w-full" style={{ height: SVG_H }}>
      <svg width="100%" height={SVG_H} viewBox={`0 0 100 ${SVG_H}`} preserveAspectRatio="none">
        {/* Grid */}
        {gridTicks.map(({ val, y }) => (
          <line key={val} x1={PAD_L} x2={100 - PAD_R} y1={y} y2={y} stroke={chartTheme.grid} strokeWidth="0.4" />
        ))}

        {/* Line */}
        {data.length > 1 && (
          <path d={pathD} fill="none" stroke={chartTheme.bar} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Points */}
        {data.map((d, i) => {
          const cx = scaleX(i)
          const cy = scaleY(d.y)
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
              style={{ cursor: onPointClick ? 'pointer' : 'default' }}
              onClick={() => {
                setSelected(i)
                onPointClick?.(d)
              }}
            />
          )
        })}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={scaleX(i)}
            y={SVG_H - PAD_BOT / 4}
            textAnchor="middle"
            fill={chartTheme.axisColor}
            fontSize="3"
            fontFamily="var(--font-mono)"
          >
            {d.x}
          </text>
        ))}
      </svg>

      {/* Selected tooltip */}
      {selected !== null && data[selected] && (
        <div className="absolute top-2 right-2 bg-bg-raised border border-border-default rounded-md px-2 py-1 text-xs text-text-primary tabular-nums">
          {data[selected].x}: <span className="font-medium">{data[selected].y}{unit}</span>
        </div>
      )}
    </div>
  )
}
