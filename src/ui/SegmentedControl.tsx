interface SegmentedOption<T> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
}

export default function SegmentedControl<T extends string>({ value, onChange, options }: SegmentedControlProps<T>) {
  return (
    <div
      className="inline-flex rounded-md border border-border-default bg-bg-base overflow-hidden"
      role="group"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`
              h-8 px-3 text-sm font-medium transition-colors duration-[120ms] ease-out cursor-pointer
              ${active
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }
            `}
            style={active ? { background: 'var(--color-accent-soft)' } : {}}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
