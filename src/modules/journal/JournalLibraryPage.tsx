import { useState } from 'react'
import { NotePencil } from '@phosphor-icons/react'
import JournalTab from './JournalTab'
import LibraryTab from './LibraryTab'

type Tab = 'journal' | 'library'

interface JournalLibraryPageProps {
  defaultTab?: Tab
}

const TABS: { value: Tab; label: string }[] = [
  { value: 'journal', label: 'Journal' },
  { value: 'library', label: 'Library' },
]

export default function JournalLibraryPage({ defaultTab = 'journal' }: JournalLibraryPageProps) {
  const [tab, setTab] = useState<Tab>(defaultTab)

  return (
    <>
      {/* Page header — pr-14 keeps right edge free for the fixed agent button */}
      <div className="mb-6 pr-14">
        <div className="flex items-center gap-2.5">
          <NotePencil size={20} weight="light" className="text-accent flex-shrink-0" aria-hidden="true" />
          <h1 className="text-2xl font-medium text-text-primary">Journal &amp; Library</h1>
        </div>

        {/* Underline-style tab switcher */}
        <div className="flex mt-4 border-b border-border-subtle">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
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
