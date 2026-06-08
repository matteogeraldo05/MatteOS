import { useState } from 'react'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import Textarea from '../../ui/Textarea'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'
import { useAllOwnedItems } from './queries'

interface OutfitFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; occasion_tag: string; notes: string | null; itemIds: string[] }) => void
  loading?: boolean
}

export default function OutfitForm({ open, onClose, onSave, loading }: OutfitFormProps) {
  const { data: closetItems = [], isLoading: itemsLoading } = useAllOwnedItems()

  const [name, setName] = useState('')
  const [occasionTag, setOccasionTag] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  function toggleItem(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      occasion_tag: occasionTag.trim(),
      notes: notes.trim() || null,
      itemIds: selectedIds,
    })
  }

  function handleClose() {
    setName('')
    setOccasionTag('')
    setNotes('')
    setSelectedIds([])
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create outfit">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Name" value={name} onChange={setName} placeholder="e.g. Casual Friday" required />
        <Input label="Occasion" value={occasionTag} onChange={setOccasionTag} placeholder="e.g. work, casual, date night" />
        <Textarea label="Notes" value={notes} onChange={setNotes} rows={2} />

        {/* Item picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text-secondary uppercase tracking-[0.06em]">Items from closet</span>

          {itemsLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size={16} />
            </div>
          ) : closetItems.length === 0 ? (
            <p className="text-sm text-text-muted">Add items to your closet first.</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-border-default rounded-md p-2">
              {closetItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 cursor-pointer select-none hover:bg-bg-hover rounded px-1.5 py-1 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="accent-accent flex-shrink-0"
                  />
                  {/* Mini color swatch */}
                  <div
                    className="relative w-5 h-5 rounded border border-border-default overflow-hidden flex-shrink-0"
                  >
                    <div className="absolute inset-0" style={{ backgroundColor: item.color }} />
                    {item.image_url && (
                      <img src={item.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="text-sm text-text-primary truncate">{item.name}</span>
                  <span className="text-xs text-text-muted flex-shrink-0">{item.color}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  )
}
