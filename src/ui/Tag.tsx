import type { ReactNode } from 'react'

type TagKind = 'gym' | 'finance' | 'personal' | 'work' | 'neutral'

const tagColors: Record<TagKind, string> = {
  gym: '#3ecf8e',
  finance: '#f5a524',
  personal: '#7a7fff',
  work: '#4a72ff',
  neutral: 'var(--color-text-secondary)',
}

interface TagProps {
  kind: TagKind
  children: ReactNode
}

export default function Tag({ kind, children }: TagProps) {
  return (
    <span
      className="inline-flex items-center text-xs uppercase tracking-[0.06em] px-2 py-0.5 rounded-sm bg-bg-hover text-text-secondary"
      style={{ borderLeft: `3px solid ${tagColors[kind]}` }}
    >
      {children}
    </span>
  )
}
