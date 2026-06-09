import { useState, useMemo } from 'react'
import Spinner from '../../ui/Spinner'
import EmptyState from '../../ui/EmptyState'
import { useJournalEntry, useJournalList, type JournalEntry } from './queries'
import JournalEditor from './JournalEditor'
import { getMoodColor } from './moodColors'
import { toDateString } from '../../lib/dates'

interface EntryDayParts {
  dayNum: number
  dayAbbr: string
  monthAbbr: string
}

function parseEntryDayParts(dateStr: string): EntryDayParts {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    dayNum: d,
    dayAbbr: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    monthAbbr: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  }
}

function PastEntryRow({
  entry,
  isSelected,
  onClick,
}: {
  entry: JournalEntry
  isSelected: boolean
  onClick: () => void
}) {
  const { dayNum, dayAbbr, monthAbbr } = parseEntryDayParts(entry.entry_date)
  const moodBorderColor = getMoodColor(entry.mood_tag)

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left flex gap-5 py-5
        border-b border-border-subtle last:border-b-0
        transition-colors duration-[120ms] ease-out
        hover:bg-bg-hover
        ${isSelected ? 'bg-bg-hover' : ''}
        -mx-1 px-1
      `}
      style={{ borderLeftColor: moodBorderColor }}
    >
      {/* Left column: big day number + day abbr / month */}
      <div className="flex flex-col items-center w-10 flex-shrink-0 pt-0.5">
        <span className="text-3xl font-medium text-text-primary leading-none tabular-nums">
          {dayNum}
        </span>
        <span className="text-[10px] text-text-muted mt-1.5 leading-tight text-center tracking-[0.04em]">
          {dayAbbr}
          <br />
          {monthAbbr}
        </span>
      </div>

      {/* Right column: title/mood tag + full body text */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {entry.mood_tag && (
          <span className="text-2xs text-accent uppercase tracking-[0.08em] font-medium">
            {entry.mood_tag}
          </span>
        )}
        <p className="text-sm text-text-primary leading-[1.65] whitespace-pre-wrap break-words">
          {entry.body}
        </p>
      </div>
    </button>
  )
}

export default function JournalTab() {
  const todayStr = useMemo(() => toDateString(new Date()), [])
  const [selectedDate, setSelectedDate] = useState(todayStr)

  const { data: currentEntry, isLoading: loadingEntry } = useJournalEntry(selectedDate)
  const { data: pastEntries = [], isLoading: loadingList } = useJournalList(50)

  return (
    <div className="flex flex-col">
      {/* Composer */}
      <div className="pb-8 border-b border-border-subtle">
        {loadingEntry ? (
          <div className="flex justify-center py-10">
            <Spinner size={18} />
          </div>
        ) : (
          <JournalEditor
            key={selectedDate}
            date={selectedDate}
            entry={currentEntry ?? null}
            maxDate={todayStr}
            onDateChange={setSelectedDate}
          />
        )}
      </div>

      {/* Recent entries */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[10px] text-text-muted uppercase tracking-[0.1em]">Recent Entries</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {loadingList && pastEntries.length === 0 ? (
          <div className="flex justify-center py-10">
            <Spinner size={18} />
          </div>
        ) : pastEntries.length === 0 ? (
          <EmptyState message="No past entries yet — start writing above." />
        ) : (
          <div>
            {pastEntries.map((entry) => (
              <PastEntryRow
                key={entry.id}
                entry={entry}
                isSelected={entry.entry_date === selectedDate}
                onClick={() => setSelectedDate(entry.entry_date)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
