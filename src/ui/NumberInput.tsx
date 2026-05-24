interface NumberInputProps {
  value?: number | string
  onChange?: (value: number | '') => void
  min?: number
  max?: number
  step?: number
  error?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}

export default function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  error,
  label,
  placeholder,
  disabled,
  id,
  className = '',
}: NumberInputProps) {
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
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value
          onChange?.(v === '' ? '' : parseFloat(v))
        }}
        className={`
          w-full h-9 px-3 rounded-md bg-bg-deep border border-border-default
          text-text-primary text-base placeholder:text-text-muted tabular-nums
          transition-colors duration-[120ms] ease-out outline-none focus:border-border-strong
          accent-accent disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-danger' : ''}
          ${className}
        `}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
