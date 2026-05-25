interface ToggleOption<T> {
  value: T
  label: string
}

interface ToggleProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: [ToggleOption<T>, ToggleOption<T>]
}

export default function Toggle<T extends string>({ value, onChange, options }: ToggleProps<T>) {
  return (
    <div
      className="inline-flex rounded-md border border-border-default bg-bg-base overflow-hidden"
      role="group"
      aria-label="View toggle"
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
            style={active ? { background: '#ffffff', color: '#0a0b0e' } : {}}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
