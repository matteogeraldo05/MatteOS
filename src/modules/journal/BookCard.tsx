import type { Book } from './queries'
import BookCover from './BookCover'

interface BookCardProps {
  book: Book
  onClick: () => void
}

export default function BookCard({ book, onClick }: BookCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        flex flex-col gap-3 text-left group
        rounded-lg p-2
        transition-colors duration-[120ms] ease-out
        hover:bg-bg-hover
        focus:outline-none focus:ring-2 focus:ring-accent-line
      "
    >
      <BookCover
        color={book.cover_color}
        texture={book.cover_texture}
        title={book.title}
        author={book.author}
        size="card"
      />
      <div className="flex flex-col gap-0.5 px-1">
        <span className="text-base font-medium text-text-primary line-clamp-2 leading-snug">
          {book.title}
        </span>
        <span className="text-xs text-text-muted">
          {book.author}
        </span>
      </div>
    </button>
  )
}
