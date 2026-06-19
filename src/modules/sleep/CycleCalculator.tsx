import { useState, useMemo } from 'react'
import { CaretUp, CaretDown } from '@phosphor-icons/react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'wake_at' | 'sleep_at'
type AmPm  = 'AM' | 'PM'

// ─── Cycle math ───────────────────────────────────────────────────────────────

const FALL_ASLEEP_MIN = 15
const CYCLE_MIN       = 90

// Arc fill % per cycle count — 9h=270°(¾), 7.5h=225°(⅝), 6h=180°(½)
const ARC_PCT: Record<number, number> = { 6: 0.75, 5: 0.625, 4: 0.50 }

function to12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

function toTarget(hr: number, min: number, ampm: AmPm): string {
  let h = hr % 12
  if (ampm === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function buildRows(mode: Mode, target: string) {
  return [6, 5, 4].map((cycles) => {
    const totalMin  = FALL_ASLEEP_MIN + cycles * CYCLE_MIN
    const hoursNum  = (cycles * CYCLE_MIN) / 60          // 9 | 7.5 | 6
    // result = the time the user needs to act on
    const resultHHMM = mode === 'wake_at'
      ? addMinutes(target, -totalMin)   // sleep at
      : addMinutes(target, totalMin)    // wake at
    return { cycles, hoursNum, resultHHMM }
  })
}

function addMinutes(hhmm: string, delta: number): string {
  const [hStr, mStr] = hhmm.split(':')
  let total = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + delta
  total = ((total % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ─── Donut arc ────────────────────────────────────────────────────────────────

const R    = 26           // arc radius
const CX   = 32           // centre x
const CY   = 32           // centre y
const SW   = 4.5          // stroke width
const CIRC = 2 * Math.PI * R   // ≈ 163.4

interface DonutArcProps { cycles: number; pct: number }

function DonutArc({ cycles, pct }: DonutArcProps) {
  const hoursNum  = (cycles * CYCLE_MIN) / 60
  const hoursStr  = hoursNum % 1 === 0 ? String(hoursNum) : String(hoursNum)
  const dashOffset = CIRC * (1 - pct)

  return (
    <svg
      width={64}
      height={64}
      viewBox="0 0 64 64"
      aria-label={`${hoursNum} hours`}
      style={{ flexShrink: 0 }}
    >
      {/* Track */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="var(--color-chart-bar-dim)"
        strokeWidth={SW}
      />
      {/* Filled arc */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="#3760f2"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{ transition: 'stroke-dashoffset 300ms ease' }}
      />
      {/* Hours number */}
      <text
        x={CX} y={26}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize={hoursNum === 7.5 ? 10 : 12}
        fontWeight="700"
        fontFamily="var(--font-mono)"
      >
        {hoursStr}
      </text>
      {/* "hours" label */}
      <text
        x={CX} y={40}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--color-text-muted)"
        fontSize={6.5}
        fontFamily="var(--font-mono)"
      >
        hours
      </text>
    </svg>
  )
}

// ─── Rocker wheel ─────────────────────────────────────────────────────────────

interface RockerWheelProps {
  value: number; onChange: (v: number) => void
  min: number; max: number
  display: string; label: string
}

function RockerWheel({ value, onChange, min, max, display, label }: RockerWheelProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const inc = () => onChange(value >= max ? min : value + 1)
  const dec = () => onChange(value <= min ? max : value - 1)

  function commit(raw: string) {
    setDraft(null)
    const n = parseInt(raw, 10)
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
  }

  return (
    <div className="flex flex-col items-center gap-0.5" aria-label={label}>
      <button
        type="button" aria-label={`Increase ${label}`} onClick={inc}
        className="w-10 h-10 flex items-center justify-center rounded-md cursor-pointer
          text-text-secondary hover:text-text-primary hover:bg-bg-hover
          active:bg-bg-pressed transition-colors duration-[120ms] ease-out"
      >
        <CaretUp size={14} weight="bold" aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={draft ?? display}
        onFocus={(e) => { setDraft(display); e.target.select() }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur() }
          if (e.key === 'Escape') { setDraft(null); (e.target as HTMLInputElement).blur() }
        }}
        aria-live="polite" aria-atomic="true" aria-label={label}
        className="text-4xl font-bold tabular-nums text-text-primary leading-none py-1
          bg-transparent border-none outline-none text-center cursor-text"
        style={{ minWidth: 64, width: 64 }}
      />
      <button
        type="button" aria-label={`Decrease ${label}`} onClick={dec}
        className="w-10 h-10 flex items-center justify-center rounded-md cursor-pointer
          text-text-secondary hover:text-text-primary hover:bg-bg-hover
          active:bg-bg-pressed transition-colors duration-[120ms] ease-out"
      >
        <CaretDown size={14} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── AM / PM control ──────────────────────────────────────────────────────────

function AmPmControl({ value, onChange }: { value: AmPm; onChange: (v: AmPm) => void }) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="AM or PM">
      {(['AM', 'PM'] as const).map((v) => {
        const active = value === v
        return (
          <button
            key={v} type="button" aria-pressed={active} onClick={() => onChange(v)}
            className="h-10 w-14 rounded-md text-sm font-medium cursor-pointer border
              transition-colors duration-[120ms] ease-out"
            style={
              active
                ? { background: '#ffffff', color: '#0a0b0e', borderColor: 'var(--color-border-strong)' }
                : { background: 'transparent', borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }
            }
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CycleCalculator() {
  const [mode, setMode] = useState<Mode>('wake_at')
  const [hr,   setHr]   = useState(7)
  const [min,  setMin]  = useState(0)
  const [ampm, setAmpm] = useState<AmPm>('AM')

  const target = useMemo(() => toTarget(hr, min, ampm), [hr, min, ampm])
  const rows   = useMemo(() => buildRows(mode, target), [mode, target])

  // The label that appears before the time in line 1
  // wake_at → computed = sleep time → "Sleep at"
  // sleep_at → computed = wake time → "Wake up at"
  const actionLabel = mode === 'wake_at' ? 'Sleep at' : 'Wake up at'

  return (
    <div className="flex flex-col gap-8">

      {/* ── Mode selector ──────────────────────────────────────────────── */}
      <div className="flex justify-center gap-10" role="group" aria-label="Calculation mode">
        {([
          { value: 'wake_at'  as Mode, label: 'Wake at'  },
          { value: 'sleep_at' as Mode, label: 'Sleep at' },
        ] as const).map((opt) => {
          const active = mode === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(opt.value)}
              className={`
                text-base font-medium px-4 py-1.5 rounded-md cursor-pointer
                transition-colors duration-[120ms] ease-out
                ${active ? '' : 'text-text-muted hover:text-text-secondary'}
              `}
              style={active ? { background: '#ffffff', color: '#0a0b0e' } : undefined}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* ── Time rocker ────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center gap-1 py-2"
        role="group" aria-label="Target time picker"
      >
        <RockerWheel value={hr} onChange={setHr} min={1} max={12}
          display={String(hr)} label="Hour" />

        <span className="text-4xl font-bold text-text-muted leading-none pb-1 mx-1 select-none"
          aria-hidden="true">:</span>

        <RockerWheel value={min} onChange={setMin} min={0} max={59}
          display={String(min).padStart(2, '0')} label="Minute" />

        <div className="ml-4">
          <AmPmControl value={ampm} onChange={setAmpm} />
        </div>
      </div>

      {/* ── Result rows ────────────────────────────────────────────────── */}
      <div className="flex flex-col">
        {rows.map((r, i) => {
          const isRecommended = r.cycles === 5
          const isLast        = i === rows.length - 1

          return (
            <div
              key={r.cycles}
              className={`
                flex items-center gap-4 py-5
                ${!isLast ? 'border-b border-border-subtle' : ''}
                ${isRecommended ? 'rounded-md px-3 -mx-3' : ''}
              `}
              style={isRecommended
                ? { background: 'rgba(55, 96, 242, 0.15)' }
                : undefined}
            >
              {/* Left — donut arc */}
              <DonutArc cycles={r.cycles} pct={ARC_PCT[r.cycles] ?? 0.7} />

              {/* Right — two lines */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                {/* Line 1 */}
                <p className="leading-snug" style={{ fontSize: 15 }}>
                  <span className="text-text-muted">{actionLabel} </span>
                  <span className="font-bold text-white">{to12h(r.resultHHMM)}</span>
                  <span className="text-text-muted"> for </span>
                  <span className="font-bold text-white">{r.hoursNum}&nbsp;hours</span>
                  <span className="text-text-muted"> of sleep.</span>
                </p>
                {/* Line 2 */}
                <p className="text-sm">
                  <span className="text-text-muted">You'll get </span>
                  <span className="font-bold text-white">{r.cycles}</span>
                  <span className="text-text-muted"> sleep cycles.</span>
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <p className="text-2xs text-text-muted text-center -mt-4">
        90‑min cycles · 15 min fall‑asleep offset
      </p>

    </div>
  )
}
