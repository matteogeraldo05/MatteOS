import type { ReactNode } from 'react'

interface PanelProps {
  eyebrow?: string
  title?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}

export default function Panel({ eyebrow, title, right, children, className = '' }: PanelProps) {
  const hasHeader = eyebrow || title || right

  return (
    <div className={`${className}`}>
      {hasHeader && (
        <div className="h-10 flex items-center justify-between px-panel-sm lg:px-panel border-b border-border-subtle flex-shrink-0">
          <div>
            {eyebrow && (
              <span className="text-2xs text-text-muted uppercase tracking-[0.08em] font-medium">
                {eyebrow}
              </span>
            )}
            {!eyebrow && title && (
              <span className="text-xl font-medium text-text-primary">{title}</span>
            )}
          </div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </div>
      )}
      <div className="p-panel-sm lg:p-panel">
        {children}
      </div>
    </div>
  )
}
