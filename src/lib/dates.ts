/** Returns today's date as YYYY-MM-DD in the given IANA timezone */
export function todayInTz(tz: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz })
}

/** Returns the Monday (week start) of the ISO week containing the given date */
export function weekStartOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Formats a Date as YYYY-MM-DD */
export function toDateString(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

/** Adds N days to a date and returns a new Date */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Returns an array of YYYY-MM-DD strings for a range [start, end] inclusive */
export function dateRange(start: Date, end: Date): string[] {
  const result: string[] = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const endTime = new Date(end)
  endTime.setHours(0, 0, 0, 0)
  while (current <= endTime) {
    result.push(toDateString(current))
    current.setDate(current.getDate() + 1)
  }
  return result
}

/** Format a time string (HH:MM:SS or HH:MM) into a readable AM/PM format */
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

/** Format a date string (YYYY-MM-DD) into a short readable form like "Jan 12" */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
