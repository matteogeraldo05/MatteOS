// Task shape (matches DB schema — update when Supabase generates types)
interface Task {
  id: string
  title: string
  tag: string
  due_time: string | null
  duration_minutes: number | null
  recurrence_type: 'none' | 'daily' | 'mwf' | 'weekly' | 'monthly'
  recurrence_day_of_week: number | null
  recurrence_day_of_month: number | null
  start_date: string
  end_date: string | null
  deleted_at: string | null
}

/** Returns the YYYY-MM-DD dates in [rangeStart, rangeEnd] on which `task` is scheduled */
export function materializeInstances(
  task: Task,
  rangeStart: Date,
  rangeEnd: Date,
): string[] {
  const dates: string[] = []
  const current = new Date(rangeStart)
  current.setHours(0, 0, 0, 0)

  const taskStart = new Date(task.start_date)
  taskStart.setHours(0, 0, 0, 0)

  const taskEnd = task.end_date ? new Date(task.end_date) : null
  if (taskEnd) taskEnd.setHours(0, 0, 0, 0)

  const endTime = new Date(rangeEnd)
  endTime.setHours(0, 0, 0, 0)

  while (current <= endTime) {
    const dateStr = current.toLocaleDateString('en-CA')

    if (current >= taskStart && (!taskEnd || current <= taskEnd)) {
      const dow = current.getDay() === 0 ? 6 : current.getDay() - 1 // Mon=0
      const dom = current.getDate()

      let matches = false
      switch (task.recurrence_type) {
        case 'none':
          matches = dateStr === task.start_date
          break
        case 'daily':
          matches = true
          break
        case 'mwf':
          matches = [0, 2, 4].includes(dow) // Mon, Wed, Fri
          break
        case 'weekly':
          matches = dow === task.recurrence_day_of_week
          break
        case 'monthly':
          matches = dom === task.recurrence_day_of_month
          break
      }

      if (matches) dates.push(dateStr)
    }

    current.setDate(current.getDate() + 1)
  }

  return dates
}
