import { useState, useEffect, useRef, useCallback } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import IconButton from '../../ui/IconButton'
import { useUpsertJournalEntry, type JournalEntry } from './queries'
import { useToast } from '../../ui/Toast'

interface JournalEditorProps {
  date: string
  entry: JournalEntry | null
  isToday: boolean
  onPrev: () => void
  onNext: () => void
  canGoNext: boolean
}

const WORD_WARN = 180
const WORD_LIMIT = 200
const AUTOSAVE_DEBOUNCE_MS = 1500

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  return `${weekday} · ${month} ${d}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export default function JournalEditor({ date, entry, isToday, onPrev, onNext, canGoNext }: JournalEditorProps) {
  const [body, setBody] = useState(entry?.body ?? '')
  const [moodTag, setMoodTag] = useState(entry?.mood_tag ?? '')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const upsert = useUpsertJournalEntry()
  const { push } = useToast()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when date or entry changes
  useEffect(() => {
    setBody(entry?.body ?? '')
    setMoodTag(entry?.mood_tag ?? '')
    setSavedAt(null)
  }, [date, entry?.id])

  const save = useCallback(
    async (currentBody: string, currentMood: string) => {
      if (currentBody.trim().length === 0) return
      setIsSaving(true)
      try {
        await upsert.mutateAsync({
          entry_date: date,
          body: currentBody,
          mood_tag: currentMood.trim() || null,
        })
        setSavedAt(new Date())
      } catch {
        push({ kind: 'danger', title: 'Failed to save journal entry' })
      } finally {
        setIsSaving(false)
      }
    },
    [date, upsert, push],
  )

  function handleBodyChange(value: string) {
    setBody(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      save(value, moodTag)
    }, AUTOSAVE_DEBOUNCE_MS)
  }

  function handleMoodChange(value: string) {
    setMoodTag(value)
    if (body.trim().length === 0) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      save(body, value)
    }, AUTOSAVE_DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const wordCount = countWords(body)
  let wordCountColor = 'text-text-muted'
  if (wordCount >= WORD_LIMIT) wordCountColor = 'text-danger'
  else if (wordCount >= WORD_WARN) wordCountColor = 'text-warning'

  // Auto-resize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [body])

  return (
    <div className="flex flex-col">
      {/* Header row: navigation + date label + word count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <IconButton label="Previous day" onClick={onPrev}>
            <CaretLeft size={12} weight="bold" aria-hidden="true" />
          </IconButton>
          <div className="flex items-center gap-2 px-1">
            <span className="text-2xs text-accent uppercase tracking-[0.1em] font-medium">
              {isToday ? 'TODAY' : 'PAST ENTRY'}
            </span>
            <span className="text-2xs text-text-muted uppercase tracking-[0.05em]">
              {formatDayLabel(date)}
            </span>
          </div>
          <IconButton label="Next day" onClick={onNext} disabled={!canGoNext}>
            <CaretRight size={12} weight="bold" aria-hidden="true" />
          </IconButton>
        </div>
        <span className={`text-2xs uppercase tracking-[0.06em] font-medium ${wordCountColor}`}>
          {wordCount} / {WORD_LIMIT}
        </span>
      </div>

      {/* Mood/tone input — flat, no border, no background */}
      <input
        type="text"
        value={moodTag}
        onChange={(e) => handleMoodChange(e.target.value)}
        placeholder="How does today feel? (e.g. FOCUSED, CALM, REFLECTIVE)"
        className="
          w-full bg-transparent border-none outline-none
          text-sm text-text-secondary placeholder:text-text-muted
          mb-4
        "
      />

      {/* Hairline separator */}
      <div className="h-px bg-border-subtle mb-5" />

      {/* Body textarea — flat, no border, no background */}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => handleBodyChange(e.target.value)}
        placeholder="How did today go?"
        className="
          w-full bg-transparent border-none outline-none resize-none
          text-text-primary text-sm leading-[1.7] placeholder:text-text-muted
          min-h-[160px]
        "
        style={{ overflow: 'hidden' }}
      />

      {/* Autosave status */}
      <div className="flex justify-end mt-3">
        <span className="text-2xs text-text-muted">
          {isSaving ? 'Saving…' : savedAt ? `Saved · ${formatTime(savedAt)}` : ''}
        </span>
      </div>
    </div>
  )
}
