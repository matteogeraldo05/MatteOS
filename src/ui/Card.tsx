import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-bg-base border border-border-default rounded-lg p-card ${className}`}
    >
      {children}
    </div>
  )
}
