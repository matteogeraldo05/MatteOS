type ProgressColor = 'accent' | 'success' | 'warning' | 'danger'

const colorMap: Record<ProgressColor, string> = {
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
}

interface ProgressBarProps {
  value: number
  max: number
  color?: ProgressColor
  className?: string
}

export default function ProgressBar({ value, max, color = 'accent', className = '' }: ProgressBarProps) {
  const pct = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      className={`w-full h-1 rounded-full bg-bg-hover overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: colorMap[color] }}
      />
    </div>
  )
}
