import type { ReactNode } from 'react'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  right?: ReactNode
  icon?: ReactNode
}

export default function ScreenHeader({ title, subtitle, right, icon }: ScreenHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-section">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="text-2xl font-medium text-text-primary">{title}</h1>
        </div>
        {subtitle && (
          <p className="text-sm text-text-secondary">{subtitle}</p>
        )}
      </div>
      {right && (
        <div className="flex items-center gap-2 mt-0.5">
          {right}
        </div>
      )}
    </div>
  )
}
