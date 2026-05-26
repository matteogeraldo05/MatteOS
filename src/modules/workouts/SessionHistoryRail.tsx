import { useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import Panel from '../../ui/Panel'
import EmptyState from '../../ui/EmptyState'
import ConfirmDialog from '../../ui/ConfirmDialog'
import IconButton from '../../ui/IconButton'
import Spinner from '../../ui/Spinner'
import { formatDateShort } from '../../lib/dates'
import type { WorkoutSession } from './queries'

interface SessionHistoryRailProps {
  sessions: WorkoutSession[]
  isLoading: boolean
  onDelete: (id: string) => void
}

export default function SessionHistoryRail({
  sessions,
  isLoading,
  onDelete,
}: SessionHistoryRailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const sessionToDelete = sessions.find((s) => s.id === confirmId)

  return (
    <>
      <Panel eyebrow="HISTORY">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState message="No previous sessions for this split." />
        ) : (
          <div>
            {sessions.map((session) => {
              const isExpanded = expandedId === session.id
              const exCount = session.workout_exercises.length
              const totalSets = session.workout_exercises.reduce((sum, ex) => sum + ex.sets, 0)
              const summary = `${exCount} ex · ${totalSets} sets`

              return (
                <div key={session.id} className="border-b border-border-subtle last:border-b-0">
                  {/* ── Collapsed row ──────────────────────────── */}
                  <div
                    className="flex items-center gap-2 py-2 px-1 -mx-1 rounded cursor-pointer hover:bg-bg-hover transition-colors duration-[120ms]"
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-text-primary tabular-nums font-medium">
                        {formatDateShort(session.session_date)}
                      </span>
                      <span className="text-xs text-text-muted ml-2">{summary}</span>
                    </div>

                    {/* Wrapper prevents the row expand click from firing */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        label="Delete session"
                        onClick={() => setConfirmId(session.id)}
                      >
                        <Trash size={13} />
                      </IconButton>
                    </div>
                  </div>

                  {/* ── Expanded exercises ──────────────────────── */}
                  {isExpanded && (
                    <div className="px-1 pb-3 pt-0.5">
                      {session.workout_exercises
                        .slice()
                        .sort((a, b) => a.exercise_order - b.exercise_order)
                        .map((ex) => (
                          <div key={ex.id} className="flex justify-between items-baseline py-0.5">
                            <span className="text-xs text-text-secondary truncate mr-2">
                              {ex.exercise_name}
                            </span>
                            <span className="text-xs text-text-muted tabular-nums shrink-0">
                              {ex.sets}×{ex.reps} @ {ex.weight_lbs}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={!!confirmId}
        message={
          sessionToDelete
            ? `Delete the ${formatDateShort(sessionToDelete.session_date)} session? All exercises will be removed.`
            : 'Delete this session?'
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmId) {
            onDelete(confirmId)
            setConfirmId(null)
            setExpandedId(null)
          }
        }}
        onCancel={() => setConfirmId(null)}
      />
    </>
  )
}
