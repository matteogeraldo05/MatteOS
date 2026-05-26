import { SPLIT_LABELS, SPLIT_OPTIONS, type WorkoutSplit } from './exercisePresets'

interface SplitPickerProps {
  value: WorkoutSplit
  onChange: (split: WorkoutSplit) => void
  suggestedSplit: WorkoutSplit
}

export default function SplitPicker({ value, onChange, suggestedSplit }: SplitPickerProps) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <p className="text-xs text-text-muted mb-1">
        Today's suggested split:{' '}
        <span className="text-text-secondary font-medium">{SPLIT_LABELS[suggestedSplit]}</span>
      </p>
      {SPLIT_OPTIONS.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className="
              w-full h-11 px-4 text-sm font-medium text-left
              border rounded transition-colors duration-[120ms] ease-out cursor-pointer
            "
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
  )
}
