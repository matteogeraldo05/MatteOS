/**
 * Recurrence materialization — pure, no side-effects, no network calls.
 * Expands recurring task templates into scheduled instances for a date range.
 */

export type RecurrenceType = 'none' | 'daily' | 'mwf' | 'weekly' | 'monthly'

/** Minimal task shape required for materialization */
interface MinTask {
  id: string
  recurrence_type: RecurrenceType
  recurrence_day_of_week: number | null
  recurrence_day_of_month: number | null
  start_date: string   // YYYY-MM-DD
  end_date: string | null
  deleted_at: string | null
}

/** Minimal completion shape */
interface MinCompletion {
  id: string
  task_id: string
  completion_date: string  // YYYY-MM-DD
}

/** A single scheduled occurrence of a task on a specific date */
export interface TaskInstance<T extends MinTask = MinTask> {
  task: T
  date: string          // YYYY-MM-DD
  completed: boolean
  completionId?: string
}

/**
 * Expands task templates into scheduled instances within [rangeStart, rangeEnd].
 * Joins with completions to set `completed` and `completionId`.
 *
 * Mon = 0, Tue = 1, ..., Sun = 6 (matches DB convention).
 */
export function materializeInstances<T extends MinTask>(
  tasks: T[],
  completions: MinCompletion[],
  rangeStart: Date,
  rangeEnd: Date,
): TaskInstance<T>[] {
  // Build completion lookup: "taskId|YYYY-MM-DD" → completionId
  const completionMap = new Map<string, string>()
  for (const c of completions) {
    completionMap.set(`${c.task_id}|${c.completion_date}`, c.id)
  }

  const result: TaskInstance<T>[] = []

  for (const task of tasks) {
    if (task.deleted_at != null) continue

    const taskStart = new Date(task.start_date + 'T00:00:00')
    const taskEnd = task.end_date ? new Date(task.end_date + 'T00:00:00') : null

    const current = new Date(rangeStart)
    current.setHours(0, 0, 0, 0)

    const endTime = new Date(rangeEnd)
    endTime.setHours(0, 0, 0, 0)

    while (current <= endTime) {
      const dateStr = current.toLocaleDateString('en-CA')  // YYYY-MM-DD

      if (current >= taskStart && (!taskEnd || current <= taskEnd)) {
        // Mon=0, Tue=1, ..., Sat=5, Sun=6
        const dow = current.getDay() === 0 ? 6 : current.getDay() - 1
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
            matches = [0, 2, 4].includes(dow)  // Mon, Wed, Fri
            break
          case 'weekly':
            matches = dow === task.recurrence_day_of_week
            break
          case 'monthly':
            matches = dom === task.recurrence_day_of_month
            break
        }

        if (matches) {
          const key = `${task.id}|${dateStr}`
          const completionId = completionMap.get(key)
          result.push({
            task,
            date: dateStr,
            completed: completionId != null,
            completionId,
          })
        }
      }

      current.setDate(current.getDate() + 1)
    }
  }

  return result
}
