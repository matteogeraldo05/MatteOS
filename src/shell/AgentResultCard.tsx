import type { ReactNode } from 'react'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import Panel from '../ui/Panel'

interface AgentResult {
  kind: 'loading' | 'error' | 'ok'
  content?: ReactNode
  error?: string
}

interface AgentResultCardProps {
  result: AgentResult
  onDismiss: () => void
  onAccept?: () => void
}

export default function AgentResultCard({ result, onDismiss, onAccept }: AgentResultCardProps) {
  return (
    <Panel eyebrow="AGENT RESULT" right={
      <button
        type="button"
        className="text-xs text-text-muted hover:text-text-secondary cursor-pointer transition-colors"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    }>
      {result.kind === 'loading' && (
        <div className="flex items-center gap-3 py-4">
          <Spinner />
          <span className="text-sm text-text-secondary">Thinking…</span>
        </div>
      )}

      {result.kind === 'error' && (
        <div className="py-2">
          <p className="text-sm text-danger">{result.error ?? 'Something went wrong'}</p>
        </div>
      )}

      {result.kind === 'ok' && (
        <div className="flex flex-col gap-4">
          <div className="text-sm text-text-primary">{result.content}</div>
          {onAccept && (
            <div className="flex justify-end">
              <Button size="sm" onClick={onAccept}>Accept</Button>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
