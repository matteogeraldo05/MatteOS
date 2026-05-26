import { useMediaQuery } from '../lib/useMediaQuery'

export type TagKind = 'gym' | 'finance' | 'personal' | 'work'

const tagColors: Record<TagKind, string> = {
  gym: '#3ecf8e',
  finance: '#f5a524',
  personal: '#7a7fff',
  work: '#4a72ff',
}

export interface TimelineBlock {
  start: number        // minutes from midnight (e.g. 7:30 → 450)
  durationMin: number
  title: string
  tagKind: TagKind
  completed?: boolean
  onClick?: () => void
}

// ─── Overlap layout ──────────────────────────────────────────────────────────

interface PositionedBlock {
  block: TimelineBlock
  col: number
  totalCols: number
}

/** Greedy column assignment; caps at 3 visible columns. */
function layoutBlocks(blocks: TimelineBlock[]): {
  visible: PositionedBlock[]
  overflowGroups: { startMin: number; count: number }[]
} {
  if (blocks.length === 0) return { visible: [], overflowGroups: [] }

  const sorted = [...blocks].sort((a, b) => a.start - b.start)

  const positioned: (PositionedBlock & { end: number })[] = sorted.map((block) => ({
    block,
    col: 0,
    totalCols: 1,
    end: block.start + block.durationMin,
  }))

  // Greedy lane assignment
  const laneEnd: number[] = []
  for (const item of positioned) {
    let col = laneEnd.findIndex((t) => t <= item.block.start)
    if (col === -1) col = laneEnd.length
    laneEnd[col] = item.end
    item.col = col
  }

  // Compute totalCols = max(col+1) among all pairwise-overlapping blocks, capped at 3
  for (const item of positioned) {
    let maxCol = item.col
    for (const other of positioned) {
      if (other === item) continue
      if (other.block.start < item.end && other.end > item.block.start) {
        maxCol = Math.max(maxCol, other.col)
      }
    }
    item.totalCols = Math.min(maxCol + 1, 3)
  }

  // Split visible (col 0–2) and overflow (col 3+)
  const visible = positioned.filter((p) => p.col < 3)
  const overflow = positioned.filter((p) => p.col >= 3)

  // Group overflow by contiguous time ranges to produce one pill per cluster
  const overflowGroups: { startMin: number; count: number }[] = []
  for (const item of overflow) {
    const last = overflowGroups[overflowGroups.length - 1]
    if (last && item.block.start < last.startMin + 60) {
      last.count++
    } else {
      overflowGroups.push({ startMin: item.block.start, count: 1 })
    }
  }

  return { visible, overflowGroups }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DayTimelineProps {
  blocks: TimelineBlock[]
  selectedDate?: string
}

const START_HOUR = 6
const END_HOUR = 23
const TOTAL_HOURS = END_HOUR - START_HOUR

export default function DayTimeline({ blocks, selectedDate }: DayTimelineProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const ROW_H = isDesktop ? 56 : 40
  const totalH = ROW_H * TOTAL_HOURS
  const LABEL_W = 40 // px

  const inRange = blocks.filter(
    (b) => b.start < END_HOUR * 60 && b.start + b.durationMin > START_HOUR * 60,
  )

  const { visible, overflowGroups } = layoutBlocks(inRange)

  function blockTop(startMin: number) {
    const offset = Math.max(startMin - START_HOUR * 60, 0)
    return (offset / (TOTAL_HOURS * 60)) * totalH
  }

  function blockHeight(startMin: number, durMin: number) {
    const clampedStart = Math.max(startMin, START_HOUR * 60)
    const clampedEnd = Math.min(startMin + durMin, END_HOUR * 60)
    const h = ((clampedEnd - clampedStart) / (TOTAL_HOURS * 60)) * totalH
    return Math.max(h, ROW_H * 0.55)
  }

  return (
    <div className="relative overflow-y-auto" style={{ height: Math.min(totalH, 600) }}>
      <div className="relative" style={{ height: totalH }}>

        {/* ── Hour grid ──────────────────────────────────────────────────────── */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => {
          const hour = START_HOUR + i
          const show = i % 2 === 0
          return (
            <div
              key={hour}
              className="absolute left-0 right-0 flex items-start"
              style={{ top: i * ROW_H, height: ROW_H }}
            >
              <span
                className="text-2xs text-text-muted flex-shrink-0 pt-0.5 tabular-nums select-none"
                style={{ width: LABEL_W }}
              >
                {show ? `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}` : ''}
              </span>
              {show && <div className="flex-1 border-t border-chart-grid" />}
            </div>
          )
        })}

        {/* ── Task blocks ────────────────────────────────────────────────────── */}
        {/* Wrapper sits after the label column and fills the rest */}
        <div
          className="absolute top-0 bottom-0 right-0"
          style={{ left: LABEL_W }}
        >
          {visible.map((item, i) => {
            const b = item.block
            const top = blockTop(b.start)
            const height = blockHeight(b.start, b.durationMin)
            const leftPct = item.col / item.totalCols
            const widthPct = 1 / item.totalCols

            const hh = Math.floor(b.start / 60)
            const mm = b.start % 60
            const label = `${hh % 12 || 12}:${String(mm).padStart(2, '0')}${hh < 12 ? 'am' : 'pm'}`

            return (
              <div
                key={i}
                className={`absolute rounded-md px-2 py-1 overflow-hidden transition-[filter] duration-[120ms] ${
                  b.onClick ? 'cursor-pointer hover:brightness-110 active:brightness-90' : ''
                }`}
                style={{
                  top,
                  height,
                  left: `calc(${leftPct * 100}% + ${item.col > 0 ? 2 : 0}px)`,
                  width: `calc(${widthPct * 100}% - ${item.col > 0 ? 2 : 0}px - ${item.col < item.totalCols - 1 ? 2 : 0}px)`,
                  background: 'var(--color-accent-soft)',
                  borderLeft: `3px solid ${tagColors[b.tagKind] ?? '#4a72ff'}`,
                  opacity: b.completed ? 0.5 : 1,
                }}
                onClick={b.onClick}
                role={b.onClick ? 'button' : undefined}
                tabIndex={b.onClick ? 0 : undefined}
                onKeyDown={b.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') b.onClick!() } : undefined}
              >
                <p className="text-sm font-medium text-text-primary truncate leading-tight">
                  {b.title}
                </p>
                <p className="text-2xs text-text-secondary">{label}</p>
              </div>
            )
          })}

          {/* ── Overflow "+N more" pills ──────────────────────────────────────── */}
          {overflowGroups.map((group, i) => {
            const top = blockTop(group.startMin)
            return (
              <div
                key={`overflow-${i}`}
                className="absolute right-0 z-10 px-1.5 rounded bg-bg-raised border border-border-default text-2xs text-text-muted flex items-center"
                style={{ top: top + 2, height: 18 }}
              >
                +{group.count} more
              </div>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="sticky bottom-0 bg-bg-deep/80 text-2xs text-text-muted text-center py-1 select-none">
          {selectedDate}
        </div>
      )}
    </div>
  )
}
