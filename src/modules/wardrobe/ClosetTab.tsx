import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'
import EmptyState from '../../ui/EmptyState'
import ConfirmDialog from '../../ui/ConfirmDialog'
import ItemCard from './ItemCard'
import ItemForm from './ItemForm'
import type { WardrobeItem, WardrobeCategory, WardrobeTag } from './queries'
import {
  useWardrobeItems,
  useUpsertWardrobeItem,
  useDeleteWardrobeItem,
  CATEGORY_OPTIONS,
  CATEGORY_LABELS,
  TAG_OPTIONS,
  type WardrobeItemPayload,
} from './queries'

export default function ClosetTab() {
  const { data: items = [], isLoading } = useWardrobeItems('owned')
  const upsert = useUpsertWardrobeItem()
  const del = useDeleteWardrobeItem()

  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<WardrobeCategory | 'all'>('all')
  const [filterTag, setFilterTag] = useState<WardrobeTag | 'all'>('all')

  const filtered = items.filter((item) => {
    if (filterCat !== 'all' && item.category !== filterCat) return false
    if (filterTag !== 'all' && !item.tags.includes(filterTag)) return false
    return true
  })

  async function handleSave(payload: WardrobeItemPayload, id?: string) {
    await upsert.mutateAsync({ id, payload })
    setAddOpen(false)
    setEditItem(null)
  }

  async function handleDelete() {
    if (!deleteId) return
    await del.mutateAsync(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          {/* Category filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', ...CATEGORY_OPTIONS.map((o) => o.value)] as (WardrobeCategory | 'all')[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors duration-[120ms] ${
                  filterCat === cat
                    ? 'bg-accent text-white'
                    : 'bg-bg-deep text-text-muted hover:text-text-primary'
                }`}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          {/* Tag filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', ...TAG_OPTIONS.map((o) => o.value)] as (WardrobeTag | 'all')[]).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors duration-[120ms] ${
                  filterTag === tag
                    ? 'bg-accent text-white'
                    : 'bg-bg-deep text-text-muted hover:text-text-primary'
                }`}
              >
                {tag === 'all' ? 'All tags' : TAG_OPTIONS.find((t) => t.value === tag)?.label ?? tag}
              </button>
            ))}
          </div>
        </div>

        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} weight="bold" aria-hidden="true" />
          Add item
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size={20} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={items.length === 0 ? 'Your closet is empty.' : 'No items match those filters.'}
          ctaLabel={items.length === 0 ? 'Add first item' : undefined}
          onCta={items.length === 0 ? () => setAddOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={setEditItem}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Add form — key forces remount so state resets */}
      <ItemForm
        key="add-closet"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSave}
        defaultStatus="owned"
        loading={upsert.isPending}
      />

      {/* Edit form */}
      {editItem && (
        <ItemForm
          key={editItem.id}
          open
          onClose={() => setEditItem(null)}
          onSave={handleSave}
          initial={editItem}
          defaultStatus="owned"
          loading={upsert.isPending}
        />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        message="Remove this item from your closet?"
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={del.isPending}
      />
    </div>
  )
}
