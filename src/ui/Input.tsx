import type { InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  error?: string
  label?: string
}

const inputBase =
  'w-full h-9 px-3 rounded-md bg-bg-deep border border-border-default text-text-primary text-base placeholder:text-text-muted transition-colors duration-[120ms] ease-out outline-none focus:border-border-strong accent-accent disabled:opacity-50 disabled:cursor-not-allowed tabular-nums'

export default function Input({ value, onChange, error, label, id, className = '', ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs text-text-secondary uppercase tracking-[0.06em]">
          {label}
        </label>
      )}
      <input
        {...rest}
        id={inputId}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`${inputBase} ${error ? 'border-danger' : ''} ${className}`}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
