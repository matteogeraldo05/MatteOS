import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import EmptyState from '../../ui/EmptyState'
import Spinner from '../../ui/Spinner'
import BookCard from './BookCard'
import BookForm from './BookForm'
import BookDetail from './BookDetail'
import { useBooks } from './queries'

export default function LibraryTab() {
  const { data: books = [], isLoading } = useBooks()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)

  // In-page takeover when a book is selected
  if (selectedBookId) {
    return (
      <BookDetail
        bookId={selectedBookId}
        onBack={() => setSelectedBookId(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Flat header row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-muted uppercase tracking-[0.1em]">
          {books.length > 0 ? `${books.length} book${books.length !== 1 ? 's' : ''}` : 'Library'}
        </span>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          <Plus size={14} weight="bold" aria-hidden="true" className="mr-1.5" />
          New book
        </Button>
      </div>

      {/* Book grid — flat, no panel */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size={20} />
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          message="No books yet — add one to start annotating."
          ctaLabel="Add first book"
          onCta={() => setAddOpen(true)}
        />
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => setSelectedBookId(book.id)}
            />
          ))}
        </div>
      )}

      {/* Add book modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add book">
        <BookForm onClose={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}
