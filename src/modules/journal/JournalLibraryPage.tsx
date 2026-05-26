import { useSearchParams } from 'react-router-dom'
import { NotePencil } from '@phosphor-icons/react'
import JournalTab from './JournalTab'
import LibraryTab from './LibraryTab'

type Tab = 'journal' | 'library'

const TABS: { value: Tab; label: string }[] = [
  { value: 'journal', label: 'Journal' },
  { value: 'library', label: 'Library' },
]

export default function JournalLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'library' ? 'library' : 'journal'

  function handleTabChange(value: Tab) {
    if (value === 'library') {
      setSearchParams({ tab: 'library' }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <NotePencil size={20} weight="light" className="text-accent flex-shrink-0" aria-hidden="true" />
          <h1 className="text-2xl font-medium text-text-primary">Journal &amp; Library</h1>
        </div>

        {/* Underline-style tab switcher */}
        <div className="flex mt-4 border-b border-border-subtle">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTabChange(value)}
              className={`
                pb-2 mr-6 text-sm font-medium
                border-b-2 -mb-px
                transition-colors duration-[120ms] ease-out
                ${tab === value
                  ? 'text-accent border-accent'
                  : 'text-text-muted border-transparent hover:text-text-secondary'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'journal' ? <JournalTab /> : <LibraryTab />}
    </>
  )
}
