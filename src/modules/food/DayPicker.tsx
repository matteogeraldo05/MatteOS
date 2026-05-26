import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import IconButton from '../../ui/IconButton'
import Button from '../../ui/Button'
import { toDateString, addDays, formatDateShort } from '../../lib/dates'

interface DayPickerProps {
  date: string          // YYYY-MM-DD
  onDateChange: (date: string) => void
}

function shiftDate(str: string, delta: number): string {
  const [y, m, d] = str.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  return toDateString(addDays(base, delta))
}

export default function DayPicker({ date, onDateChange }: DayPickerProps) {
  const today = toDateString(new Date())
  const atToday = date === today

  const label = atToday ? 'Today' : formatDateShort(date)

  return (
    <div className="flex items-center gap-2 mb-6">
      <IconButton label="Previous day" onClick={() => onDateChange(shiftDate(date, -1))}>
        <CaretLeft size={16} weight="bold" aria-hidden="true" />
      </IconButton>

      <span className="text-base font-medium text-text-primary min-w-[120px] text-center tabular-nums">
        {label}
      </span>

      <IconButton
        label="Next day"
        onClick={() => onDateChange(shiftDate(date, 1))}
        disabled={atToday}
      >
        <CaretRight size={16} weight="bold" aria-hidden="true" />
      </IconButton>

      {!atToday && (
        <Button variant="ghost" size="sm" onClick={() => onDateChange(today)}>
          Today
        </Button>
      )}
    </div>
  )
}
