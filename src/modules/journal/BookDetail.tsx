import { useState } from 'react'
import { ArrowLeft, PencilSimple, Trash, Plus, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import IconButton from '../../ui/IconButton'
import Modal from '../../ui/Modal'
import ConfirmDialog from '../../ui/ConfirmDialog'
import EmptyState from '../../ui/EmptyState'
import Spinner from '../../ui/Spinner'
import BookCover from './BookCover'
import BookForm from './BookForm'
import BookSectionForm from './BookSectionForm'
import {
  useBookDetail,
  useDeleteBook,
  useDeleteBookSection,
  useUpsertBookSection,
  type BookSection,
} from './queries'
import { useToast } from '../../ui/Toast'

interface BookDetailProps {
  bookId: string
  onBack: () => void
}

type SectionType = 'quote' | 'reflection' | 'note'

const SECTION_CONFIG: { type: SectionType; label: string; eyebrow: string }[] = [
  { type: 'quote',      label: 'Quotes',      eyebrow: 'QUOTES' },
  { type: 'reflection', label: 'Reflections', eyebrow: 'REFLECTIONS' },
  { type: 'note',       label: 'Notes',       eyebrow: 'NOTES' },
]

interface SectionModalState {
  open: boolean
  type: SectionType
  existing: BookSection | null
}

function SectionRow({
  section,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  section: BookSection
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-border-subtle last:border-b-0 group">
      <p className="flex-1 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
        {section.body}
      </p>
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms] flex-shrink-0">
        <IconButton label="Move up" onClick={onMoveUp} disabled={isFirst}>
          <ArrowUp size={12} weight="bold" aria-hidden="true" />
        </IconButton>
        <IconButton label="Move down" onClick={onMoveDown} disabled={isLast}>
          <ArrowDown size={12} weight="bold" aria-hidden="true" />
        </IconButton>
        <IconButton label="Edit" onClick={onEdit}>
          <PencilSimple size={14} weight="regular" aria-hidden="true" />
        </IconButton>
        <IconButton label="Delete" onClick={onDelete}>
          <Trash size={14} weight="regular" aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  )
}

export default function BookDetail({ bookId, onBack }: BookDetailProps) {
  const { data: book, isLoading } = useBookDetail(bookId)
  const deleteBook = useDeleteBook()
  const deleteSection = useDeleteBookSection()
  const upsertSection = useUpsertBookSection()
  const { push } = useToast()

  const [editBookOpen, setEditBookOpen] = useState(false)
  const [confirmDeleteBook, setConfirmDeleteBook] = useState(false)
  const [sectionModal, setSectionModal] = useState<SectionModalState>({
    open: false,
    type: 'quote',
    existing: null,
  })
  const [confirmDeleteSection, setConfirmDeleteSection] = useState<BookSection | null>(null)

  async function handleDeleteBook() {
    try {
      await deleteBook.mutateAsync(bookId)
      push({ kind: 'success', title: 'Book deleted' })
      onBack()
    } catch {
      push({ kind: 'danger', title: 'Failed to delete book' })
    }
    setConfirmDeleteBook(false)
  }

  async function handleDeleteSection() {
    if (!confirmDeleteSection) return
    try {
      await deleteSection.mutateAsync({ id: confirmDeleteSection.id, bookId })
      push({ kind: 'success', title: 'Entry deleted' })
    } catch {
      push({ kind: 'danger', title: 'Failed to delete entry' })
    }
    setConfirmDeleteSection(null)
  }

  async function handleMoveSection(section: BookSection, direction: 'up' | 'down', peers: BookSection[]) {
    const idx = peers.findIndex((s) => s.id === section.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= peers.length) return
    const swapTarget = peers[swapIdx]
    try {
      await upsertSection.mutateAsync({ id: section.id, book_id: bookId, section_type: section.section_type, body: section.body, sort_order: swapTarget.sort_order })
      await upsertSection.mutateAsync({ id: swapTarget.id, book_id: bookId, section_type: swapTarget.section_type, body: swapTarget.body, sort_order: section.sort_order })
    } catch {
      push({ kind: 'danger', title: 'Failed to reorder' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={20} />
      </div>
    )
  }

  if (!book) {
    return (
      <EmptyState message="Book not found." ctaLabel="Back to Library" onCta={onBack} />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <IconButton label="Back to library" onClick={onBack}>
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
        </IconButton>

        <div className="flex gap-4 flex-1 min-w-0">
          <BookCover
            color={book.cover_color}
            texture={book.cover_texture}
            title={book.title}
            author={book.author}
            size="detail"
          />
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              <h2 className="text-xl font-medium text-text-primary">{book.title}</h2>
              <p className="text-sm text-text-secondary mt-1">{book.author}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <IconButton label="Edit book" onClick={() => setEditBookOpen(true)}>
                <PencilSimple size={14} weight="regular" aria-hidden="true" />
              </IconButton>
              <IconButton label="Delete book" onClick={() => setConfirmDeleteBook(true)}>
                <Trash size={14} weight="regular" aria-hidden="true" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>

      {/* Section panels — flat, no border/bg wrapper */}
      {SECTION_CONFIG.map(({ type, label, eyebrow }) => {
        const sections = (book.book_sections ?? [])
          .filter((s) => s.section_type === type)
          .sort((a, b) => a.sort_order - b.sort_order)

        return (
          <div key={type} className="flex flex-col">
            {/* Section header row */}
            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
              <span className="text-[10px] text-text-muted uppercase tracking-[0.1em]">
                {eyebrow}
              </span>
              <IconButton
                label={`Add ${label.slice(0, -1).toLowerCase()}`}
                onClick={() => setSectionModal({ open: true, type, existing: null })}
              >
                <Plus size={14} weight="bold" aria-hidden="true" />
              </IconButton>
            </div>

            {/* Section content */}
            {sections.length === 0 ? (
              <EmptyState
                message={`No ${label.toLowerCase()} yet.`}
                ctaLabel={`Add ${label.slice(0, -1).toLowerCase()}`}
                onCta={() => setSectionModal({ open: true, type, existing: null })}
              />
            ) : (
              <div>
                {sections.map((section, idx) => (
                  <SectionRow
                    key={section.id}
                    section={section}
                    isFirst={idx === 0}
                    isLast={idx === sections.length - 1}
                    onEdit={() => setSectionModal({ open: true, type, existing: section })}
                    onDelete={() => setConfirmDeleteSection(section)}
                    onMoveUp={() => handleMoveSection(section, 'up', sections)}
                    onMoveDown={() => handleMoveSection(section, 'down', sections)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Edit book modal */}
      <Modal open={editBookOpen} onClose={() => setEditBookOpen(false)} title="Edit book">
        <BookForm existing={book} onClose={() => setEditBookOpen(false)} />
      </Modal>

      {/* Add/edit section modal */}
      <Modal
        open={sectionModal.open}
        onClose={() => setSectionModal((s) => ({ ...s, open: false }))}
        title={sectionModal.existing
          ? `Edit ${sectionModal.type}`
          : `Add ${sectionModal.type}`}
      >
        <BookSectionForm
          key={sectionModal.existing?.id ?? `new-${sectionModal.type}`}
          bookId={bookId}
          sectionType={sectionModal.type}
          existing={sectionModal.existing}
          onClose={() => setSectionModal((s) => ({ ...s, open: false }))}
        />
      </Modal>

      {/* Delete book confirm */}
      <ConfirmDialog
        open={confirmDeleteBook}
        onConfirm={handleDeleteBook}
        onCancel={() => setConfirmDeleteBook(false)}
        message={`Delete "${book.title}"? All quotes, reflections, and notes will be permanently removed.`}
        confirmLabel="Delete book"
        confirmVariant="danger"
        loading={deleteBook.isPending}
      />

      {/* Delete section confirm */}
      <ConfirmDialog
        open={!!confirmDeleteSection}
        onConfirm={handleDeleteSection}
        onCancel={() => setConfirmDeleteSection(null)}
        message="Delete this entry? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteSection.isPending}
      />
    </div>
  )
}
