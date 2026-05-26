import { useState, useRef } from 'react'
import { X } from '@phosphor-icons/react'
import Button from '../../ui/Button'
import IconButton from '../../ui/IconButton'
import type { ShoppingItem } from './queries'

// ─── Custom checkbox ──────────────────────────────────────────────────────────

function ItemCheckbox({ checked }: { checked: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`
        flex-shrink-0 w-[18px] h-[18px] rounded-sm border
        flex items-center justify-center
        transition-colors duration-[120ms] ease-out
        ${checked ? 'bg-accent border-accent' : 'bg-transparent border-border-default'}
      `}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShoppingListProps {
  items: ShoppingItem[]
  planId: string | null
  onToggle: (id: string, checked: boolean) => void
  onAdd: (itemName: string) => void
  onUpdate: (id: string, itemName: string) => void
  onDelete: (id: string) => void
  onClearChecked: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShoppingList({
  items,
  planId,
  onToggle,
  onAdd,
  onUpdate,
  onDelete,
  onClearChecked,
}: ShoppingListProps) {
  const [newItemName, setNewItemName] = useState('')
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editValue, setEditValue]     = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)

  const hasChecked = items.some((i) => i.checked)

  // ── Add ──────────────────────────────────────────────────────────────────────
  function handleAdd() {
    const name = newItemName.trim()
    if (!name) return
    onAdd(name)
    setNewItemName('')
  }

  // ── Inline edit ──────────────────────────────────────────────────────────────
  function startEdit(item: ShoppingItem) {
    setEditingId(item.id)
    setEditValue(item.item_name)
  }

  function commitEdit(id: string) {
    const name = editValue.trim()
    if (name) onUpdate(id, name)
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Clear checked ─────────────────────────────────────────────────── */}
      {hasChecked && planId && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClearChecked}>
            Clear checked
          </Button>
        </div>
      )}

      {/* ── Item list ─────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">
          No items yet — add some below
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 min-h-[28px] py-0.5 border-b border-border-subtle last:border-b-0 group"
            >
              {/* Checkbox */}
              <button
                type="button"
                aria-label={item.checked ? 'Uncheck item' : 'Check item'}
                onClick={() => onToggle(item.id, !item.checked)}
                className="flex-shrink-0 cursor-pointer"
              >
                <ItemCheckbox checked={item.checked} />
              </button>

              {/* Item name — double-click to edit */}
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(item.id)
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  className="flex-1 min-w-0 bg-transparent text-sm text-text-primary outline-none border-b border-border-strong"
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onDoubleClick={() => startEdit(item)}
                  onKeyDown={(e) => { if (e.key === 'Enter') startEdit(item) }}
                  className={`
                    flex-1 min-w-0 text-sm truncate cursor-default select-none
                    ${item.checked ? 'line-through text-text-muted' : 'text-text-primary'}
                  `}
                >
                  {item.item_name}
                </span>
              )}

              {/* Delete — visible on hover */}
              <IconButton
                label="Delete item"
                onClick={() => onDelete(item.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} weight="bold" aria-hidden="true" />
              </IconButton>
            </div>
          ))}
        </div>
      )}

      {/* ── Add new item ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <input
          ref={newInputRef}
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add item..."
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          className="
            flex-1 h-8 px-3 rounded-md bg-bg-deep border border-border-default
            text-text-primary text-sm placeholder:text-text-muted
            outline-none focus:border-border-strong transition-colors duration-[120ms]
          "
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={!newItemName.trim()}
          aria-label="Add item"
        >
          +
        </Button>
      </div>
    </div>
  )
}
