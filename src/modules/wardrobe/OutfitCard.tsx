import { useState } from 'react'
import { CaretDown, CaretUp, Trash } from '@phosphor-icons/react'
import IconButton from '../../ui/IconButton'
import type { OutfitWithItems } from './queries'

interface OutfitCardProps {
  outfit: OutfitWithItems
  onDelete: (id: string) => void
}

function ColorSwatch({ item, size = 32 }: { item: OutfitWithItems['outfit_items'][number]['wardrobe_items']; size?: number }) {
  return (
    <div
      className="relative rounded overflow-hidden flex-shrink-0 border border-border-default"
      style={{ width: size, height: size }}
      title={item.name}
    >
      <div className="absolute inset-0" style={{ backgroundColor: item.color || 'var(--color-bg-deep)' }} />
      {item.image_url && (
        <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
      )}
    </div>
  )
}

export default function OutfitCard({ outfit, onDelete }: OutfitCardProps) {
  const [expanded, setExpanded] = useState(false)
  const items = outfit.outfit_items.map((oi) => oi.wardrobe_items)

  return (
    <div className="flex flex-col gap-3 py-4 border-b border-border-subtle last:border-0">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-base font-medium text-text-primary">{outfit.name}</span>
          {outfit.occasion_tag && (
            <span className="text-xs text-text-muted px-1.5 py-0.5 rounded bg-bg-deep self-start">
              {outfit.occasion_tag}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
            aria-expanded={expanded}
          >
            {expanded ? (
              <CaretUp size={12} weight="bold" aria-hidden="true" />
            ) : (
              <CaretDown size={12} weight="bold" aria-hidden="true" />
            )}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <IconButton label="Delete outfit" onClick={() => onDelete(outfit.id)}>
            <Trash size={13} weight="regular" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {/* Swatch strip — always visible */}
      {items.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {items.map((item) => (
            <ColorSwatch key={item.id} item={item} size={32} />
          ))}
        </div>
      )}

      {/* Expanded item list */}
      {expanded && items.length > 0 && (
        <ul className="flex flex-col gap-1.5 pl-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm text-text-secondary">
              <ColorSwatch item={item} size={16} />
              <span>{item.name}</span>
              <span className="text-text-muted text-xs">· {item.color}</span>
            </li>
          ))}
        </ul>
      )}

      {expanded && items.length === 0 && (
        <p className="text-sm text-text-muted">No items in this outfit.</p>
      )}
    </div>
  )
}
