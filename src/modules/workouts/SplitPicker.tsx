import { SPLIT_LABELS, SPLIT_OPTIONS, type WorkoutSplit } from './exercisePresets'

interface SplitPickerProps {
  value: WorkoutSplit
  onChange: (split: WorkoutSplit) => void
  suggestedSplit: WorkoutSplit
}

export default function SplitPicker({ value, onChange, suggestedSplit }: SplitPickerProps) {
  return (
    <div className="mb-6">
      <p className="text-2xs text-text-muted uppercase tracking-[0.08em] mb-3">
        Suggested:{' '}
        <span className="text-text-secondary normal-case tracking-normal">{SPLIT_LABELS[suggestedSplit]}</span>
      </p>
      <div className="flex gap-2">
        {SPLIT_OPTIONS.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className="flex-1 h-10 px-3 text-sm font-medium text-left
                border-l-[3px] transition-colors duration-[120ms] ease-out cursor-pointer"
              style={{
                borderColor: active ? 'var(--color-accent)' : 'var(--color-border-default)',
                color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: active ? 'var(--color-accent-soft)' : 'transparent',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
