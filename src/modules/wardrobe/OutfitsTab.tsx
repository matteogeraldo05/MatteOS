import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'
import EmptyState from '../../ui/EmptyState'
import ConfirmDialog from '../../ui/ConfirmDialog'
import OutfitCard from './OutfitCard'
import OutfitForm from './OutfitForm'
import { useOutfits, useCreateOutfit, useDeleteOutfit } from './queries'

export default function OutfitsTab() {
  const { data: outfits = [], isLoading } = useOutfits()
  const create = useCreateOutfit()
  const del = useDeleteOutfit()

  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleCreate(data: {
    name: string
    occasion_tag: string
    notes: string | null
    itemIds: string[]
  }) {
    await create.mutateAsync(data)
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    await del.mutateAsync(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={14} weight="bold" aria-hidden="true" />
          Create outfit
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size={20} />
        </div>
      ) : outfits.length === 0 ? (
        <EmptyState
          message="No outfits yet. Build one from your closet items."
          ctaLabel="Create outfit"
          onCta={() => setFormOpen(true)}
        />
      ) : (
        <div>
          {outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      <OutfitForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        loading={create.isPending}
      />

      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this outfit?"
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={del.isPending}
      />
    </div>
  )
}
