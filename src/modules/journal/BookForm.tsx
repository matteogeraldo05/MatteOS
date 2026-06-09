import { useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import { useUpsertBook, type Book, type BookUpsert } from './queries'
import { useToast } from '../../ui/Toast'
import BookCover from './BookCover'

interface BookFormProps {
  existing?: Book | null
  onClose: () => void
}

const PRESET_COLORS = [
  { label: 'Burgundy',    value: '#6b1a2e' },
  { label: 'Forest',      value: '#1a4731' },
  { label: 'Navy',        value: '#1a2b4a' },
  { label: 'Plum',        value: '#4a1a5e' },
  { label: 'Ochre',       value: '#7a5c1a' },
  { label: 'Teal',        value: '#1a4a4a' },
  { label: 'Rust',        value: '#7a2e1a' },
  { label: 'Slate',       value: '#2e3a4a' },
  { label: 'Moss',        value: '#3a4a1a' },
  { label: 'Indigo',      value: '#2a1a6a' },
  { label: 'Rose',        value: '#6a1a3a' },
  { label: 'Charcoal',    value: '#2a2a2a' },
]

const TEXTURE_OPTIONS = [
  { value: 'solid',    label: 'Solid' },
  { value: 'lines',    label: 'Lines' },
  { value: 'dots',     label: 'Dots' },
  { value: 'gradient', label: 'Gradient' },
]

export default function BookForm({ existing, onClose }: BookFormProps) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [author, setAuthor] = useState(existing?.author ?? '')
  const [coverColor, setCoverColor] = useState(existing?.cover_color ?? '#1a2b4a')
  const [customHex, setCustomHex] = useState(
    PRESET_COLORS.some((c) => c.value === existing?.cover_color) ? '' : (existing?.cover_color ?? ''),
  )
  const [texture, setTexture] = useState<'solid' | 'lines' | 'dots' | 'gradient'>(
    existing?.cover_texture ?? 'solid',
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const upsert = useUpsertBook()
  const { push } = useToast()

  const activeColor = customHex.match(/^#[0-9a-fA-F]{6}$/) ? customHex : coverColor

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!author.trim()) e.author = 'Author is required'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    try {
      const payload: BookUpsert = {
        ...(existing ? { id: existing.id } : {}),
        title: title.trim(),
        author: author.trim(),
        cover_color: activeColor,
        cover_texture: texture,
      }
      await upsert.mutateAsync(payload)
      push({ kind: 'success', title: existing ? 'Book updated' : 'Book added' })
      onClose()
    } catch {
      push({ kind: 'danger', title: 'Failed to save book' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Preview */}
      <div className="flex justify-center">
        <div className="w-28">
          <BookCover
            color={activeColor}
            texture={texture}
            title={title || 'Book title'}
            author={author || 'Author'}
            size="card"
          />
        </div>
      </div>

      <Input
        label="Title"
        value={title}
        onChange={setTitle}
        error={errors.title}
        placeholder="Book title"
      />
      <Input
        label="Author"
        value={author}
        onChange={setAuthor}
        error={errors.author}
        placeholder="Author name"
      />

      {/* Color picker */}
      <div className="flex flex-col gap-2">
        <span className="text-2xs text-text-muted uppercase tracking-[0.08em]">Cover Color</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => { setCoverColor(c.value); setCustomHex('') }}
              className={`
                w-7 h-7 rounded-md border-2 transition-all duration-[120ms]
                ${activeColor === c.value && !customHex ? 'border-border-strong scale-110' : 'border-transparent hover:border-border-default'}
              `}
              style={{ background: c.value }}
              aria-label={c.label}
            />
          ))}
        </div>
        <Input
          value={customHex}
          onChange={(v) => setCustomHex(v)}
          placeholder="#rrggbb"
          error={customHex && !customHex.match(/^#[0-9a-fA-F]{6}$/) ? 'Must be a valid hex (#rrggbb)' : undefined}
        />
      </div>

      {/* Texture */}
      <Select
        label="Cover Texture"
        value={texture}
        onChange={(v) => setTexture(v as typeof texture)}
        options={TEXTURE_OPTIONS}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={upsert.isPending}>
          {existing ? 'Save changes' : 'Add book'}
        </Button>
      </div>
    </form>
  )
}
