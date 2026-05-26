import { useState } from 'react'
import type { WeightLogEnriched } from './queries'
import { useDeleteWeight } from './queries'
import { useToast } from '../../ui/Toast'
import { formatDateShort } from '../../lib/dates'
import IconButton from '../../ui/IconButton'
import ConfirmDialog from '../../ui/ConfirmDialog'
import EmptyState from '../../ui/EmptyState'
import Modal from '../../ui/Modal'
import WeightLogForm from './WeightLogForm'
import { PencilSimple, Trash } from '@phosphor-icons/react'

interface RecentWeightsListProps {
  entries: WeightLogEnriched[]
}

function fmt(val: number | null, decimals = 1): string {
  if (val === null || val === undefined) return '—'
  return val.toFixed(decimals)
}

export default function RecentWeightsList({ entries }: RecentWeightsListProps) {
  const deleteWeight = useDeleteWeight()
  const toast = useToast()

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editEntry, setEditEntry] = useState<WeightLogEnriched | null>(null)

  async function handleDelete(id: string) {
    try {
      await deleteWeight.mutateAsync(id)
      toast.push({ kind: 'success', title: 'Entry deleted' })
    } catch {
      toast.push({ kind: 'danger', title: 'Failed to delete entry' })
    }
    setConfirmId(null)
  }

  if (entries.length === 0) {
    return <EmptyState message="No entries yet — save your first weight above." />
  }

  return (
    <>
      <div className="flex flex-col">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0 hover:bg-bg-hover transition-colors duration-[120ms] px-1 rounded"
          >
            {/* Left: date */}
            <span className="text-sm text-text-secondary tabular-nums w-20 flex-shrink-0">
              {formatDateShort(entry.log_date)}
            </span>

            {/* Middle: weight + BMI */}
            <div className="flex-1 flex items-center gap-4">
              <span className="text-base text-text-primary tabular-nums font-medium">
                {entry.weight_lbs.toFixed(1)} <span className="text-sm text-text-muted font-normal">lbs</span>
              </span>
              {entry.bmi !== null && (
                <span className="text-xs text-text-muted tabular-nums">
                  BMI {fmt(entry.bmi)}
                </span>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1">
              <IconButton
                label="Edit entry"
                onClick={() => setEditEntry(entry)}
              >
                <PencilSimple size={14} weight="regular" />
              </IconButton>
              <IconButton
                label="Delete entry"
                onClick={() => setConfirmId(entry.id)}
              >
                <Trash size={14} weight="regular" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <Modal
        open={!!editEntry}
        onClose={() => setEditEntry(null)}
        title="Edit weight entry"
      >
        {editEntry && (
          <WeightLogForm
            initialDate={editEntry.log_date}
            initialWeight={editEntry.weight_lbs}
            onSaved={() => setEditEntry(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirmId}
        message="Delete this weight entry? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
        loading={deleteWeight.isPending}
      />
    </>
  )
}
