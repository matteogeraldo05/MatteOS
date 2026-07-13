import { supabase } from '../lib/supabase'
import type { AgentRequest, AgentResult } from '../types/app'

export async function callAgent<TIn, TOut>(
  req: AgentRequest<TIn>,
): Promise<AgentResult<TOut>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { ok: false, error: 'Not authenticated' }
  }

  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(req),
    })

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}))
      return {
        ok: false,
        error: 'rate_limit',
        rateLimited: true,
        retryAfter: body.retry_after_seconds,
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.error ?? `HTTP ${res.status}` }
    }

    const data: TOut = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}
