import { ArrowUp, ArrowDown, ArrowRight } from '@phosphor-icons/react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  subtext?: string
  delta?: {
    value: number
    direction: 'up' | 'down' | 'flat'
  }
}

const deltaColors = {
  up: 'text-success',
  down: 'text-danger',
  flat: 'text-text-muted',
}

const deltaIcons = {
  up: <ArrowUp size={12} weight="bold" aria-hidden="true" />,
  down: <ArrowDown size={12} weight="bold" aria-hidden="true" />,
  flat: <ArrowRight size={12} weight="bold" aria-hidden="true" />,
}

export default function MetricCard({ label, value, unit, subtext, delta }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xs text-text-secondary uppercase tracking-[0.08em]">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-text-primary tabular-nums">{value}</span>
        {unit && <span className="text-base text-text-muted">{unit}</span>}
      </div>
      {subtext && (
        <span className="text-2xs text-text-muted">{subtext}</span>
      )}
      {delta && (
        <span className={`flex items-center gap-0.5 text-xs ${deltaColors[delta.direction]}`}>
          {deltaIcons[delta.direction]}
          {Math.abs(delta.value)}
        </span>
      )}
    </div>
  )
}
