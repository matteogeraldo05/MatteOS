export interface AgentRequest<T = unknown> {
  module: string
  payload: T
}

export interface AgentResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  rateLimited?: boolean
  retryAfter?: number
}
