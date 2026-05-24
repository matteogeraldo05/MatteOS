import type { ReactNode } from 'react'
import Spinner from './Spinner'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'sm'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  children: ReactNode
  className?: string
  'aria-label'?: string
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md cursor-pointer transition-colors duration-[120ms] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 select-none'

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed disabled:bg-bg-hover disabled:text-text-muted disabled:cursor-not-allowed focus-visible:outline-accent-line',
  secondary:
    'bg-bg-base border border-border-default text-text-primary hover:bg-bg-hover active:bg-bg-pressed disabled:text-text-muted disabled:cursor-not-allowed focus-visible:outline-accent-line',
  ghost:
    'bg-transparent border-0 text-text-secondary hover:text-text-primary hover:bg-bg-hover active:bg-bg-pressed disabled:text-text-muted disabled:cursor-not-allowed focus-visible:outline-accent-line',
}

const sizes = {
  md: 'h-9 px-[14px] text-base',
  sm: 'h-7 px-[10px] text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
  'aria-label': ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <Spinner size={12} />}
      {children}
    </button>
  )
}
