interface TimeInputProps {
  value?: string
  onChange?: (value: string) => void
  error?: string
  label?: string
  disabled?: boolean
  id?: string
  className?: string
}

export default function TimeInput({ value, onChange, error, label, disabled, id, className = '' }: TimeInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs text-text-secondary uppercase tracking-[0.06em]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ accentColor: 'var(--color-accent)', colorScheme: 'dark' }}
        className={`
          w-full h-9 px-3 rounded-md bg-bg-deep border border-border-default
          text-text-primary text-base transition-colors duration-[120ms] ease-out
          outline-none focus:border-border-strong
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-danger' : ''}
          ${className}
        `}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
