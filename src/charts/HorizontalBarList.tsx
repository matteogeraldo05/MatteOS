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
    <div className="flex flex-col">
      {items.map((item) => {
        const pct = (item.value / max) * 100
        return (
          <div key={item.label} className="flex items-center gap-3 py-2.5">
            <span className="text-sm text-text-secondary w-28 flex-shrink-0 truncate">{item.label}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: 'var(--color-accent-soft)' }}
              />
            </div>
            <span className="text-sm text-text-secondary tabular-nums w-20 text-right flex-shrink-0">
              {format(item.value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
