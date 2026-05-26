import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`pb-6 border-b border-border-subtle last:border-b-0 ${className}`}
    >
      {children}
    </div>
  )
}
