import { CaretDown } from '@phosphor-icons/react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  error?: string
  label?: string
  disabled?: boolean
  id?: string
  className?: string
  placeholder?: string
}

export default function Select({ value, onChange, options, error, label, disabled, id, className = '', placeholder }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs text-text-secondary uppercase tracking-[0.06em]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          style={{ colorScheme: 'dark', accentColor: 'var(--color-accent)' }}
          className={`
            w-full h-9 pl-3 pr-8 rounded-md bg-bg-deep border border-border-default
            text-text-primary text-base appearance-none cursor-pointer
            transition-colors duration-[120ms] ease-out outline-none focus:border-border-strong
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-danger' : ''}
            ${className}
          `}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-bg-base">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <CaretDown
          size={12}
          weight="bold"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
