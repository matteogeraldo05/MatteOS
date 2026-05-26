import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { materializeInstances } from '../../lib/recurrence'
import type { TaskInstance } from '../../lib/recurrence'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskTag = 'gym' | 'finance' | 'personal' | 'work'
export type RecurrenceType = 'none' | 'daily' | 'mwf' | 'weekly' | 'monthly'

export interface Task {
  id: string
  user_id: string
  title: string
  tag: TaskTag
  due_time: string | null           // HH:MM:SS or null
  duration_minutes: number | null
  recurrence_type: RecurrenceType
  recurrence_day_of_week: number | null   // 0=Mon … 6=Sun
  recurrence_day_of_month: number | null  // 1–28
  start_date: string                // YYYY-MM-DD
  end_date: string | null
  deleted_at: string | null
  sort_order: number | null         // user-defined sort position
  created_at: string
  updated_at: string
}

export type TaskInsert = {
  id?: string
  title: string
  tag: TaskTag
  due_time: string | null
  duration_minutes: number | null
  recurrence_type: RecurrenceType
  recurrence_day_of_week: number | null
  recurrence_day_of_month: number | null
  start_date: string
  end_date: string | null
  sort_order?: number | null
}

export interface TaskCompletion {
  id: string
  user_id: string
  task_id: string
  completion_date: string
  completed_at: string
  created_at: string
}

/** A task scheduled on a specific date, with its completion state */
export type TodoTaskInstance = TaskInstance<Task>

// ─── useTasks ─────────────────────────────────────────────────────────────────

export function useTasks() {
  const { user } = useAuth()
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Task[]
    },
    enabled: !!user,
  })
}

// ─── useCompletions ───────────────────────────────────────────────────────────

export function useCompletions(dateStart: string, dateEnd: string) {
  const { user } = useAuth()
  return useQuery<TaskCompletion[]>({
    queryKey: ['task_completions', dateStart, dateEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('completion_date', dateStart)
        .lte('completion_date', dateEnd)
      if (error) throw error
      return (data ?? []) as TaskCompletion[]
    },
    enabled: !!user,
  })
}

// ─── useCompletedTaskIds ──────────────────────────────────────────────────────
// Returns the set of ALL task_ids that have at least one completion, used to
// determine whether a one-time past-due task has been finished on any day.

export function useCompletedTaskIds() {
  const { user } = useAuth()
  return useQuery<Set<string>>({
    queryKey: ['task_completions', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_completions')
        .select('task_id')
        .eq('user_id', user!.id)
      if (error) throw error
      return new Set((data ?? []).map((c: { task_id: string }) => c.task_id))
    },
    enabled: !!user,
  })
}

// ─── useDayInstances ─────────────────────────────────────────────────────────
//
// Returns two lists:
//   today   — tasks scheduled for `date` (recurring + one-time due on `date`)
//   overdue — one-time tasks past their start_date that have never been completed
//             (carry-forward; only populated when date === today)
//
// Carry-forward rules (per spec):
//   • Recurring tasks do NOT carry forward — they only appear on their next
//     scheduled day.
//   • One-time tasks DO carry forward until explicitly completed.

export function useDayInstances(
  date: string,
  today: string,
): {
  today: TodoTaskInstance[]
  overdue: TodoTaskInstance[]
  isLoading: boolean
} {
  const tasksQ        = useTasks()
  const completionsQ  = useCompletions(date, date)
  const completedIdsQ = useCompletedTaskIds()

  const dayBounds = useMemo(() => {
    const d = new Date(date + 'T00:00:00')
    return { start: d, end: d }
  }, [date])

  const { todayInstances, overdueInstances } = useMemo(() => {
    const tasks        = tasksQ.data ?? []
    const completions  = completionsQ.data ?? []
    const completedIds = completedIdsQ.data ?? new Set<string>()

    // Regular materialization: recurring + one-time tasks due on `date`
    const todayInstances = materializeInstances(
      tasks, completions, dayBounds.start, dayBounds.end,
    )
    const todayTaskIds = new Set(todayInstances.map((i) => i.task.id))

    // Carry-forward: only when viewing today
    const overdueInstances: TodoTaskInstance[] =
      date === today
        ? tasks
            .filter(
              (task) =>
                task.recurrence_type === 'none' &&   // one-time only
                task.start_date < today &&            // strictly in the past
                !completedIds.has(task.id) &&         // never completed
                !todayTaskIds.has(task.id),           // not already in today list
            )
            .sort((a, b) => a.start_date.localeCompare(b.start_date)) // oldest first
            .map((task) => ({
              task,
              date: today,   // log completion against today, not the original due date
              completed: false,
              completionId: undefined,
            }))
        : []

    return { todayInstances, overdueInstances }
  }, [tasksQ.data, completionsQ.data, completedIdsQ.data, dayBounds, date, today])

  return {
    today: todayInstances,
    overdue: overdueInstances,
    isLoading: tasksQ.isLoading || completionsQ.isLoading || completedIdsQ.isLoading,
  }
}

// ─── useUpsertTask ────────────────────────────────────────────────────────────

export function useUpsertTask() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TaskInsert) => {
      const { error } = await supabase
        .from('tasks')
        .upsert({ ...payload, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// ─── useSoftDeleteTask ────────────────────────────────────────────────────────

export function useSoftDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// ─── useUpdateTaskOrder ───────────────────────────────────────────────────────

export function useUpdateTaskOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const results = await Promise.all(
        updates.map(({ id, sort_order }) =>
          supabase.from('tasks').update({ sort_order }).eq('id', id),
        ),
      )
      for (const result of results) {
        if (result.error) throw result.error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => {
      // Refetch to restore correct DB order if the save failed
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// ─── useToggleCompletion ──────────────────────────────────────────────────────

export function useToggleCompletion() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (instance: TodoTaskInstance) => {
      if (instance.completed && instance.completionId) {
        // Un-complete: delete the completion row
        const { error } = await supabase
          .from('task_completions')
          .delete()
          .eq('id', instance.completionId)
        if (error) throw error
      } else {
        // Complete: insert a new completion
        const { error } = await supabase
          .from('task_completions')
          .insert({
            user_id: user!.id,
            task_id: instance.task.id,
            completion_date: instance.date,
          })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task_completions'] })
    },
  })
}
