import { PencilSimple, Trash } from '@phosphor-icons/react'
import type { WardrobeItem } from './queries'
import { CATEGORY_LABELS } from './queries'
import IconButton from '../../ui/IconButton'

interface ItemCardProps {
  item: WardrobeItem
  onEdit: (item: WardrobeItem) => void
  onDelete: (id: string) => void
  onMarkOwned?: (id: string) => void
}

const priorityDot: Record<string, string> = {
  low: 'bg-text-muted',
  medium: 'bg-accent',
  high: 'bg-white',
}

export default function ItemCard({ item, onEdit, onDelete, onMarkOwned }: ItemCardProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Image / color rectangle — border lives here only */}
      <div className="relative w-full aspect-square rounded-md border border-border-default overflow-hidden">
        {/* Color placeholder — always present, covered by img if it loads */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: item.color || 'var(--color-bg-deep)' }}
          aria-hidden="true"
        />
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      {/* Name + priority dot */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-text-primary leading-snug">{item.name}</span>
        {item.priority && item.status === 'wishlist' && (
          <span
            className={`flex-shrink-0 w-2 h-2 rounded-full mt-[3px] ${priorityDot[item.priority] ?? 'bg-text-muted'}`}
            title={`Priority: ${item.priority}`}
          />
        )}
      </div>

      {/* Category + color */}
      <div className="flex flex-col gap-0.5">
        <span className="text-2xs uppercase tracking-wide text-text-muted font-medium px-1.5 py-0.5 rounded bg-bg-deep self-start">
          {CATEGORY_LABELS[item.category]}
        </span>
        <span className="text-xs text-text-muted">{item.color}</span>
      </div>

      {/* Wishlist price */}
      {item.price_cents !== null && (
        <span className="text-xs text-text-secondary">${(item.price_cents / 100).toFixed(2)}</span>
      )}

      {/* Actions */}
      <div className="flex items-center mt-auto">
        {onMarkOwned && (
          <button
            className="text-xs text-accent hover:underline"
            onClick={() => onMarkOwned(item.id)}
          >
            Mark as owned
          </button>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <IconButton label="Edit item" onClick={() => onEdit(item)}>
            <PencilSimple size={13} weight="regular" aria-hidden="true" />
          </IconButton>
          <IconButton label="Delete item" onClick={() => onDelete(item.id)}>
            <Trash size={13} weight="regular" aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
