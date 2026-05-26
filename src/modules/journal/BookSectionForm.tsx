import { useState } from 'react'
import Button from '../../ui/Button'
import Textarea from '../../ui/Textarea'
import { useUpsertBookSection, type BookSection, type BookSectionUpsert } from './queries'
import { useToast } from '../../ui/Toast'

interface BookSectionFormProps {
  bookId: string
  sectionType: 'quote' | 'reflection' | 'note'
  existing?: BookSection | null
  onClose: () => void
}

const SECTION_LABELS: Record<string, string> = {
  quote: 'Quote',
  reflection: 'Reflection',
  note: 'Note',
}

export default function BookSectionForm({
  bookId,
  sectionType,
  existing,
  onClose,
}: BookSectionFormProps) {
  const [body, setBody] = useState(existing?.body ?? '')
  const [error, setError] = useState<string | undefined>()

  const upsert = useUpsertBookSection()
  const { push } = useToast()

  const label = SECTION_LABELS[sectionType]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) { setError(`${label} text is required`); return }

    try {
      const payload: BookSectionUpsert = {
        ...(existing ? { id: existing.id } : {}),
        book_id: bookId,
        section_type: sectionType,
        body: body.trim(),
        ...(existing ? { sort_order: existing.sort_order } : {}),
      }
      await upsert.mutateAsync(payload)
      push({ kind: 'success', title: `${label} saved` })
      onClose()
    } catch {
      push({ kind: 'danger', title: `Failed to save ${label.toLowerCase()}` })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Textarea
        label={label}
        value={body}
        onChange={setBody}
        rows={6}
        error={error}
        placeholder={`Enter ${label.toLowerCase()}…`}
      />

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={upsert.isPending}>
          {existing ? 'Save changes' : `Add ${label.toLowerCase()}`}
        </Button>
      </div>
    </form>
  )
}
