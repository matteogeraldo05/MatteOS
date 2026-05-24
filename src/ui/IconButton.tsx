import type { ReactNode } from 'react'

interface IconButtonProps {
  label: string
  onClick?: () => void
  children: ReactNode
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}

export default function IconButton({
  label,
  onClick,
  children,
  className = '',
  type = 'button',
  disabled = false,
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-8 h-8 flex items-center justify-center rounded-md cursor-pointer
        text-text-secondary hover:text-text-primary hover:bg-bg-hover
        active:bg-bg-pressed transition-colors duration-[120ms] ease-out
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line
        disabled:text-text-muted disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  )
}
