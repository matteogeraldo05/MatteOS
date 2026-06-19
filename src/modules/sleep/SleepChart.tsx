import { useMemo, useRef, useState } from 'react'
import EmptyState from '../../ui/EmptyState'
import { dateRange, toDateString } from '../../lib/dates'
import type { SleepLog } from './queries'

// ─── SVG layout constants (viewBox units) ────────────────────────────────────

const VW = 420          // viewBox width
const VH = 160          // viewBox height
const L  = 32           // left pad — y-axis labels
const R  = 30           // right pad — goal label
const T  = 10           // top pad
const B  = 22           // bottom pad — x-axis labels
const PLOT_W = VW - L - R   // 358
const PLOT_H = VH - T - B   // 128
const MAX_Y  = 10            // hours scale always 0–10

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] // Sun=0

function yPos(val: number): number {
  return T + PLOT_H * (1 - Math.min(val, MAX_Y) / MAX_Y)
}

function dayLetter(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return DAY_LETTERS[new Date(y, m - 1, d).getDay()]
}

/** Convert decimal hours → "H:MM" */
function fmtAvg(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SleepChartProps {
  logs: SleepLog[]
  rangeStart: Date
  rangeEnd: Date
  goal: number
  rangeLabel?: string
  onBarClick: (date: string, log: SleepLog | null) => void
}

export default function SleepChart({
  logs,
  rangeStart,
  rangeEnd,
  goal,
  rangeLabel: rangeLabelProp,
  onBarClick,
}: SleepChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{
    left: number
    top: number
    text: string
  } | null>(null)

  // ── Build chart data ─────────────────────────────────────────────────────────

  const logMap = useMemo(() => {
    const map = new Map<string, SleepLog>()
    for (const l of logs) map.set(l.log_date, l)
    return map
  }, [logs])

  const allDates = useMemo(
    () => dateRange(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  )

  const chartData = useMemo(
    () =>
      allDates.map((date) => {
        const log = logMap.get(date)
        return { date, hours: log?.hours ?? 0, hasLog: !!log, log: log ?? null }
      }),
    [allDates, logMap],
  )

  // ── Stats ─────────────────────────────────────────────────────────────────

  const daysInRange     = allDates.length
  const logsWithData    = useMemo(() => logs.filter((l) => l.hours > 0), [logs])
  const avgHours        = logsWithData.length > 0
    ? logsWithData.reduce((s, l) => s + l.hours, 0) / logsWithData.length
    : 0
  const daysAboveGoal   = useMemo(
    () => logs.filter((l) => l.hours >= goal).length,
    [logs, goal],
  )
  const rangeLabel      = rangeLabelProp ?? (daysInRange <= 7 ? '7 DAYS' : `${daysInRange} DAYS`)
  const goalLabel       = Number.isInteger(goal) ? `${goal}H` : `${goal}H`

  // ── Bar geometry ──────────────────────────────────────────────────────────

  const n     = chartData.length
  const colW  = n > 0 ? PLOT_W / n : PLOT_W
  const barW  = Math.min(colW * 0.55, 26)

  const barCx   = (i: number) => L + (i + 0.5) * colW
  const barTopY = (h: number) => yPos(h)
  const barHgt  = (h: number) => Math.max(yPos(0) - yPos(h), 1.5)

  // Show x-labels every 7th bar for large ranges
  const showLabel = (i: number) =>
    n <= 7 || i % 7 === 0 || i === n - 1

  // ── Tooltip helpers ───────────────────────────────────────────────────────

  function showTooltip(i: number) {
    const svg = svgRef.current
    if (!svg) return
    const svgRect = svg.getBoundingClientRect()
    const parentRect = svg.parentElement!.getBoundingClientRect()
    const scaleX = svgRect.width / VW
    const scaleY = svgRect.height / VH
    const item = chartData[i]
    const cx = barCx(i)
    const ty = item.hasLog ? barTopY(item.hours) : yPos(0) - 4
    setTooltip({
      left: (svgRect.left - parentRect.left) + cx * scaleX,
      top:  (svgRect.top  - parentRect.top)  + ty * scaleY - 4,
      text: item.hasLog ? `${item.hours.toFixed(1)}h` : 'No data',
    })
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (logs.length === 0) {
    return (
      <EmptyState
        message="No sleep data yet — log your first night."
        ctaLabel="Log tonight"
        onCta={() => onBarClick(toDateString(new Date()), null)}
      />
    )
  }

  // ── Goal line position ────────────────────────────────────────────────────

  const goalY = yPos(Math.min(goal, MAX_Y))

  return (
    <div className="w-full select-none">
      {/* ── Stats header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 px-1">
        {/* Left: range label + avg */}
        <div>
          <div className="text-2xs text-text-muted uppercase tracking-[0.08em] mb-1">
            {rangeLabel}
          </div>
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-3xl font-bold tabular-nums text-text-primary">
              {logsWithData.length > 0 ? fmtAvg(avgHours) : '—'}
            </span>
            <span className="text-sm text-text-secondary">avg</span>
          </div>
        </div>

        {/* Right: days above goal */}
        <div className="text-right">
          <div className="text-2xs text-text-muted uppercase tracking-[0.08em] mb-1">
            ABOVE {goalLabel}
          </div>
          <div className="flex items-baseline gap-1 justify-end leading-none">
            <span className="text-3xl font-bold tabular-nums text-text-primary">
              {daysAboveGoal}
            </span>
            <span className="text-sm text-text-secondary">/ {daysInRange}</span>
          </div>
        </div>
      </div>

      {/* ── SVG chart ─────────────────────────────────────────────────────── */}
      <div
        className="relative"
        onMouseLeave={() => setTooltip(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
          aria-label="Sleep hours bar chart"
          role="img"
        >
          {/* ── Y-axis labels + grid lines ────────────────────────────── */}
          {[0, 3, 6, 9].map((v) => {
            const y = yPos(v)
            return (
              <g key={v}>
                {v > 0 && (
                  <line
                    x1={L} x2={VW - R}
                    y1={y} y2={y}
                    stroke="var(--color-chart-grid)"
                    strokeWidth="0.5"
                  />
                )}
                <text
                  x={L - 5}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="var(--color-chart-axis)"
                  fontSize="7"
                  fontFamily="var(--font-mono)"
                >
                  {v === 0 ? '0' : `${v}h`}
                </text>
              </g>
            )
          })}

          {/* ── Goal line ─────────────────────────────────────────────── */}
          <line
            x1={L} x2={VW - R}
            y1={goalY} y2={goalY}
            stroke="var(--color-chart-goal)"
            strokeWidth="0.9"
            strokeDasharray="3,2"
          />
          <text
            x={VW - R + 4}
            y={goalY}
            dominantBaseline="middle"
            fill="var(--color-chart-goal)"
            fontSize="7"
            fontFamily="var(--font-mono)"
            fontWeight="600"
          >
            {goalLabel}
          </text>

          {/* ── Bars + x-axis labels ──────────────────────────────────── */}
          {chartData.map((item, i) => {
            const cx  = barCx(i)
            const bx  = cx - barW / 2
            const bh  = item.hasLog ? barHgt(item.hours) : 0
            const by  = item.hasLog ? barTopY(item.hours) : yPos(0)
            const fill = item.hasLog
              ? item.hours < goal
                ? 'var(--color-text-muted)'
                : 'var(--color-chart-bar)'
              : 'var(--color-chart-bar-dim)'

            return (
              <g
                key={item.date}
                style={{ cursor: 'pointer' }}
                onClick={() => onBarClick(item.date, item.log)}
                onMouseEnter={() => showTooltip(i)}
              >
                {item.hasLog ? (
                  <rect
                    x={bx}
                    y={by}
                    width={barW}
                    height={bh}
                    fill={fill}
                    rx="1"
                  />
                ) : (
                  /* Dim stub for empty day — clickable to open form */
                  <rect
                    x={bx}
                    y={yPos(0) - 2}
                    width={barW}
                    height={2}
                    fill="var(--color-chart-bar-dim)"
                    rx="0.8"
                  />
                )}

                {showLabel(i) && (
                  <text
                    x={cx}
                    y={VH - 5}
                    textAnchor="middle"
                    fill={
                      item.hasLog
                        ? 'var(--color-text-secondary)'
                        : 'var(--color-text-muted)'
                    }
                    fontSize="7"
                    fontFamily="var(--font-mono)"
                  >
                    {dayLetter(item.date)}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Baseline ─────────────────────────────────────────────── */}
          <line
            x1={L} x2={VW - R}
            y1={yPos(0)} y2={yPos(0)}
            stroke="var(--color-border-subtle)"
            strokeWidth="0.7"
          />
        </svg>

        {/* ── Tooltip ──────────────────────────────────────────────────── */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 whitespace-nowrap
              bg-bg-raised border border-border-default rounded px-2 py-1
              text-xs text-text-primary"
            style={{
              left: tooltip.left,
              top:  tooltip.top,
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
