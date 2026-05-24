// Stub — full implementation lands in Phase 11
// Returns 503 with { ok: false, error: "agent_disabled" }

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(503).json({ ok: false, error: 'agent_disabled' })
}
