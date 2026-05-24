import ScreenHeader from '../../ui/ScreenHeader'
import EmptyState from '../../ui/EmptyState'

interface JournalLibraryPageProps {
  defaultTab?: 'journal' | 'library'
}

export default function JournalLibraryPage({ defaultTab = 'journal' }: JournalLibraryPageProps) {
  const title = defaultTab === 'journal' ? 'Journal' : 'Library'
  const message = defaultTab === 'journal'
    ? 'Journal module coming soon — daily entries with mood tags and word count.'
    : 'Library module coming soon — annotate books with quotes, reflections, and notes.'
  return (
    <>
      <ScreenHeader title={title} />
      <EmptyState message={message} />
    </>
  )
}
