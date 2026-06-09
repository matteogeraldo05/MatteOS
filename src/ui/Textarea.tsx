import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  error?: string
  label?: string
  rows?: number
}

export default function Textarea({ value, onChange, error, label, id, rows = 4, className = '', ...rest }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-2xs text-text-muted uppercase tracking-[0.08em]">
          {label}
        </label>
      )}
      <textarea
        {...rest}
        id={inputId}
        value={value}
        rows={rows}
        onChange={(e) => onChange?.(e.target.value)}
        className={`
          w-full px-3 py-2 rounded-md bg-bg-deep border border-border-default
          text-text-primary text-base placeholder:text-text-muted resize-none
          transition-colors duration-[120ms] ease-out outline-none focus:border-border-strong
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-danger' : ''}
          ${className}
        `}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
