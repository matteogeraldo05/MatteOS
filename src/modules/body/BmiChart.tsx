import { useMemo, useRef, useState } from 'react'

// ─── SVG layout constants — mirrors SleepChart.tsx ───────────────────────────

const VW     = 420
const VH     = 160
const L      = 32
const R      = 8         // no goal label on right
const T      = 10
const B      = 22
const PLOT_W = VW - L - R
const PLOT_H = VH - T - B

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function dayLetter(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return DAY_LETTERS[new Date(y, m - 1, d).getDay()]
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BmiChartDatum {
  date: string
  bmi: number | null
}

interface BmiChartProps {
  data: BmiChartDatum[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BmiChart({ data }: BmiChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ left: number; top: number; text: string } | null>(null)

  const { yMin, yMax, ticks } = useMemo(() => {
    const vals = data.filter((d) => d.bmi !== null).map((d) => d.bmi!)
    if (vals.length === 0) return { yMin: 15, yMax: 35, ticks: [18, 22, 26, 30] }
    const rawMin = Math.min(...vals)
    const rawMax = Math.max(...vals)
    const pad  = (rawMax - rawMin) * 0.10 || 1
    const yMin = rawMin - pad
    const yMax = rawMax + pad
    const step = (yMax - yMin) / 5
    return { yMin, yMax, ticks: [1, 2, 3, 4].map((i) => yMin + step * i) }
  }, [data])

  const yPos = (val: number) => T + PLOT_H * (1 - (val - yMin) / (yMax - yMin))

  const n     = data.length
  const colW  = n > 0 ? PLOT_W / n : PLOT_W
  const barW  = Math.min(colW * 0.55, 26)
  const barCx = (i: number) => L + (i + 0.5) * colW
  const baseY = T + PLOT_H

  const showLabel = (i: number) => n <= 7 || i % 7 === 0 || i === n - 1

  function showTooltip(i: number) {
    const svg = svgRef.current
    if (!svg) return
    const svgRect    = svg.getBoundingClientRect()
    const parentRect = svg.parentElement!.getBoundingClientRect()
    const scaleX     = svgRect.width  / VW
    const scaleY     = svgRect.height / VH
    const item       = data[i]
    const cx         = barCx(i)
    const ty         = item.bmi !== null ? yPos(item.bmi) : baseY - 4
    setTooltip({
      left: (svgRect.left - parentRect.left) + cx * scaleX,
      top:  (svgRect.top  - parentRect.top)  + ty * scaleY - 4,
      text: item.bmi !== null ? item.bmi.toFixed(1) : 'No data',
    })
  }

  return (
    <div className="w-full select-none">
      <div className="relative" onMouseLeave={() => setTooltip(null)}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
          aria-label="BMI bar chart"
          role="img"
        >
          {/* ── Y-axis labels + grid lines ────────────────────────────────── */}
          {ticks.map((v) => {
            const y = yPos(v)
            return (
              <g key={v}>
                <line
                  x1={L} x2={VW - R}
                  y1={y} y2={y}
                  stroke="var(--color-chart-grid)"
                  strokeWidth="0.5"
                />
                <text
                  x={L - 5}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="var(--color-chart-axis)"
                  fontSize="7"
                  fontFamily="var(--font-mono)"
                >
                  {v.toFixed(1)}
                </text>
              </g>
            )
          })}

          {/* ── Bars + x-axis labels ──────────────────────────────────────── */}
          {data.map((item, i) => {
            const cx      = barCx(i)
            const bx      = cx - barW / 2
            const hasData = item.bmi !== null
            const topY    = hasData ? yPos(item.bmi!) : baseY
            const barHgt  = hasData ? Math.max(baseY - topY, 1.5) : 0

            return (
              <g key={item.date} onMouseEnter={() => showTooltip(i)}>
                {hasData ? (
                  <rect
                    x={bx} y={topY}
                    width={barW} height={barHgt}
                    fill="var(--color-chart-bar)"
                    rx="1"
                  />
                ) : (
                  <rect
                    x={bx} y={baseY - 2}
                    width={barW} height={2}
                    fill="var(--color-chart-bar-dim)"
                    rx="0.8"
                  />
                )}
                {showLabel(i) && (
                  <text
                    x={cx}
                    y={VH - 5}
                    textAnchor="middle"
                    fill={hasData ? 'var(--color-text-secondary)' : 'var(--color-text-muted)'}
                    fontSize="7"
                    fontFamily="var(--font-mono)"
                  >
                    {dayLetter(item.date)}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Baseline ──────────────────────────────────────────────────── */}
          <line
            x1={L} x2={VW - R}
            y1={baseY} y2={baseY}
            stroke="var(--color-border-subtle)"
            strokeWidth="0.7"
          />
        </svg>

        {/* ── Tooltip ──────────────────────────────────────────────────────── */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 whitespace-nowrap
              bg-bg-raised border border-border-default rounded px-2 py-1
              text-xs text-text-primary"
            style={{
              left:      tooltip.left,
              top:       tooltip.top,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  )
}
