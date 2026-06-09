import { useState } from 'react'
import Modal from '../../ui/Modal'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Textarea from '../../ui/Textarea'
import Button from '../../ui/Button'
import type { WardrobeItem, WardrobeItemPayload, WardrobeCategory, WardrobePriority, WardrobeTag, WardrobeStatus } from './queries'
import { CATEGORY_OPTIONS, TAG_OPTIONS, PRIORITY_OPTIONS } from './queries'

interface ItemFormProps {
  open: boolean
  onClose: () => void
  onSave: (payload: WardrobeItemPayload, id?: string) => void
  initial?: WardrobeItem | null
  defaultStatus: WardrobeStatus
  loading?: boolean
}

export default function ItemForm({ open, onClose, onSave, initial, defaultStatus, loading }: ItemFormProps) {
  const status: WardrobeStatus = initial?.status ?? defaultStatus

  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<WardrobeCategory>(initial?.category ?? 'tops')
  const [color, setColor] = useState(initial?.color ?? '')
  const [tags, setTags] = useState<WardrobeTag[]>(initial?.tags ?? [])
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [price, setPrice] = useState(
    initial?.price_cents != null ? (initial.price_cents / 100).toFixed(2) : ''
  )
  const [priority, setPriority] = useState<WardrobePriority | ''>(initial?.priority ?? '')

  function toggleTag(tag: WardrobeTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !color.trim()) return

    const payload: WardrobeItemPayload = {
      name: name.trim(),
      category,
      color: color.trim(),
      tags,
      image_url: imageUrl.trim() || null,
      status,
      price_cents: status === 'wishlist' && price ? Math.round(parseFloat(price) * 100) : null,
      priority: status === 'wishlist' && priority ? priority : null,
      notes: notes.trim() || null,
    }
    onSave(payload, initial?.id)
  }

  const isWishlist = status === 'wishlist'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit item' : isWishlist ? 'Add to wishlist' : 'Add to closet'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Name" value={name} onChange={setName} required />
        <Select
          label="Category"
          value={category}
          onChange={(v) => setCategory(v as WardrobeCategory)}
          options={CATEGORY_OPTIONS}
        />
        <Input label="Color" value={color} onChange={setColor} placeholder="e.g. navy, #3760f2" required />
        <Input label="Image URL" value={imageUrl} onChange={setImageUrl} placeholder="Paste any image link (optional)" />

        {/* Tags */}
        <div className="flex flex-col gap-1.5">
          <span className="text-2xs text-text-muted uppercase tracking-[0.08em]">Tags</span>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tags.includes(value)}
                  onChange={() => toggleTag(value)}
                  className="accent-accent"
                />
                <span className="text-sm text-text-secondary">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Wishlist-only fields */}
        {isWishlist && (
          <>
            <Input
              label="Price ($)"
              value={price}
              onChange={setPrice}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            <Select
              label="Priority"
              value={priority}
              onChange={(v) => setPriority(v as WardrobePriority | '')}
              options={[{ value: '', label: 'None' }, ...PRIORITY_OPTIONS]}
            />
          </>
        )}

        <Textarea label="Notes" value={notes} onChange={setNotes} rows={2} />

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim() || !color.trim()}>
            {initial ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
