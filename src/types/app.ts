// Hand-written domain types where DB types are too raw

export interface ToastItem {
  id: string
  kind: 'success' | 'info' | 'danger'
  title: string
  description?: string
}

export interface AgentResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  rateLimited?: boolean
  retryAfter?: number
}

export interface AgentRequest<T = unknown> {
  module: string
  payload: T
}

export type NavItem = {
  label: string
  path: string
  icon: React.ReactNode
}
