interface HBarItem {
  label: string
  value: number
}

interface HorizontalBarListProps {
  items: HBarItem[]
  format?: (val: number) => string
}

export default function HorizontalBarList({ items, format = String }: HorizontalBarListProps) {
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const pct = (item.value / max) * 100
        return (
          <div key={item.label} className="relative h-6 flex items-center">
            {/* Bar fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-sm"
              style={{ width: `${pct}%`, background: 'var(--color-accent-soft)' }}
            />
            {/* Labels */}
            <span className="relative z-10 text-sm text-text-secondary px-2 flex-1 truncate">{item.label}</span>
            <span className="relative z-10 text-sm text-text-secondary tabular-nums px-2">{format(item.value)}</span>
          </div>
        )
      })}
    </div>
  )
}
