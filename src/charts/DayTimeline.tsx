import { useMediaQuery } from '../lib/useMediaQuery'

type TagKind = 'gym' | 'finance' | 'personal' | 'work'

const tagColors: Record<TagKind, string> = {
  gym: '#3ecf8e',
  finance: '#f5a524',
  personal: '#7a7fff',
  work: '#4a72ff',
}

interface TimelineBlock {
  start: number  // minutes from midnight (e.g. 7:30 = 450)
  durationMin: number
  title: string
  tagKind: TagKind
  completed?: boolean
}

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
  const LABEL_W = 40

  return (
    <div className="relative overflow-y-auto" style={{ height: Math.min(totalH, 600) }}>
      <div className="relative" style={{ height: totalH }}>
        {/* Hour rows */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => {
          const hour = START_HOUR + i
          const show2h = i % 2 === 0
          return (
            <div
              key={hour}
              className="absolute left-0 right-0 flex items-start"
              style={{ top: i * ROW_H, height: ROW_H }}
            >
              <span
                className="text-xs text-text-muted flex-shrink-0 pt-0.5"
                style={{ width: LABEL_W }}
              >
                {show2h ? `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}` : ''}
              </span>
              {show2h && (
                <div className="flex-1 border-t border-chart-grid mt-0" />
              )}
            </div>
          )
        })}

        {/* Task blocks */}
        {blocks.map((b, i) => {
          const startMin = b.start - START_HOUR * 60
          const topPct = startMin / (TOTAL_HOURS * 60)
          const heightPct = b.durationMin / (TOTAL_HOURS * 60)
          const top = topPct * totalH
          const h = Math.max(heightPct * totalH, ROW_H * 0.6)

          return (
            <div
              key={i}
              className="absolute rounded-md px-2 py-1 overflow-hidden"
              style={{
                top,
                height: h,
                left: LABEL_W,
                right: 0,
                background: 'var(--color-accent-soft)',
                borderLeft: `3px solid ${tagColors[b.tagKind] ?? '#4a72ff'}`,
                opacity: b.completed ? 0.5 : 1,
              }}
            >
              <p className="text-sm font-medium text-text-primary truncate">{b.title}</p>
              <p className="text-xs text-text-secondary">
                {Math.floor(b.start / 60) % 12 || 12}:{String(b.start % 60).padStart(2, '0')}
                {b.start < 12 * 60 ? 'am' : 'pm'}
              </p>
            </div>
          )
        })}
      </div>
      {selectedDate && (
        <div className="sticky bottom-0 bg-bg-deep/80 text-xs text-text-muted text-center py-1">
          {selectedDate}
        </div>
      )}
    </div>
  )
}
