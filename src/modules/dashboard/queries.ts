import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { todayInTz, toDateString, addDays } from '../../lib/dates'
import { materializeInstances } from '../../lib/recurrence'
import { getSuggestedSplit } from '../../lib/workoutRotation'
import type { WorkoutSplit } from '../workouts/exercisePresets'
import type { TodoTaskInstance } from '../todo/queries'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardData = {
  /** Latest weight entry */
  latestWeight: number | null
  /** Weight 7 days ago (for delta) */
  weightSevenDaysAgo: number | null
  /** Today's total calories from food_log_meals */
  todayCalories: number
  /** User's calorie goal (profile or TDEE fallback) */
  calorieGoal: number | null
  /** Last night's sleep hours */
  lastSleepHours: number | null
  /** Last night's sleep quality (1–5) */
  lastSleepQuality: number | null
  /** Month spend in cents */
  monthSpendCents: number
  /** Today's task instances (top 5 shown in preview) */
  todayTasks: TodoTaskInstance[]
  /** Suggested split based on rotation */
  suggestedSplit: WorkoutSplit
}

// ─── useDashboardData ─────────────────────────────────────────────────────────

export function useDashboardData() {
  const { user, profile } = useAuth()

  const tz = (profile?.timezone as string) ?? 'UTC'
  const today = user ? todayInTz(tz) : ''
  const sevenDaysAgo = user ? toDateString(addDays(new Date(today + 'T00:00:00'), -7)) : ''

  // Current month bounds
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // ── Latest weight ──────────────────────────────────────────────────────────
  const latestWeightQ = useQuery<number | null>({
    queryKey: ['dashboard_weight_latest', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('weight_logs')
        .select('weight_lbs')
        .eq('user_id', user!.id)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      return (data as { weight_lbs: number } | null)?.weight_lbs ?? null
    },
    enabled: !!user,
  })

  // ── Weight 7 days ago ──────────────────────────────────────────────────────
  const weight7DaysAgoQ = useQuery<number | null>({
    queryKey: ['dashboard_weight_7days', user?.id, sevenDaysAgo],
    queryFn: async () => {
      const { data } = await supabase
        .from('weight_logs')
        .select('weight_lbs')
        .eq('user_id', user!.id)
        .lte('log_date', sevenDaysAgo)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      return (data as { weight_lbs: number } | null)?.weight_lbs ?? null
    },
    enabled: !!user && !!sevenDaysAgo,
  })

  // ── Today's calories ───────────────────────────────────────────────────────
  const todayCaloriesQ = useQuery<number>({
    queryKey: ['dashboard_calories_today', user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('food_logs')
        .select('food_log_meals(calories)')
        .eq('user_id', user!.id)
        .eq('log_date', today)
        .maybeSingle()
      if (!data) return 0
      const meals = (data as { food_log_meals: { calories: number }[] }).food_log_meals ?? []
      return meals.reduce((sum, m) => sum + m.calories, 0)
    },
    enabled: !!user && !!today,
  })

  // ── Calorie goal ───────────────────────────────────────────────────────────
  const calorieGoalFromProfile = (profile?.calorie_goal as number | null) ?? null
  const calorieGoalQ = useQuery<number | null>({
    queryKey: ['dashboard_calorie_goal_tdee', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('weight_logs_enriched')
        .select('tdee')
        .eq('user_id', user!.id)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      return Math.round((data as { tdee: number | null } | null)?.tdee ?? 0) || null
    },
    enabled: !!user && calorieGoalFromProfile === null,
  })

  const calorieGoal = calorieGoalFromProfile ?? calorieGoalQ.data ?? null

  // ── Last night's sleep ─────────────────────────────────────────────────────
  const lastSleepQ = useQuery<{ hours: number; quality: number } | null>({
    queryKey: ['dashboard_sleep_last', user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('sleep_logs')
        .select('hours, quality')
        .eq('user_id', user!.id)
        .eq('log_date', today)
        .maybeSingle()
      return (data as { hours: number; quality: number } | null)
    },
    enabled: !!user && !!today,
  })

  // ── Month spend ────────────────────────────────────────────────────────────
  const monthSpendQ = useQuery<number>({
    queryKey: ['dashboard_month_spend', user?.id, monthStart, monthEnd],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('amount_cents')
        .eq('user_id', user!.id)
        .gte('transaction_date', monthStart)
        .lte('transaction_date', monthEnd)
      const rows = (data ?? []) as { amount_cents: number }[]
      return rows.reduce((sum, t) => sum + t.amount_cents, 0)
    },
    enabled: !!user,
  })

  // ── Today's tasks ──────────────────────────────────────────────────────────
  const tasksQ = useQuery<TodoTaskInstance[]>({
    queryKey: ['dashboard_tasks_today', user?.id, today],
    queryFn: async () => {
      const [{ data: tasksData }, { data: completionsData }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user!.id)
          .is('deleted_at', null)
          .order('sort_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', user!.id)
          .gte('completion_date', today)
          .lte('completion_date', today),
      ])

      const tasks = (tasksData ?? []) as Parameters<typeof materializeInstances>[0]
      const completions = (completionsData ?? []) as Parameters<typeof materializeInstances>[1]
      const dayStart = new Date(today + 'T00:00:00')
      return materializeInstances(tasks, completions, dayStart, dayStart) as TodoTaskInstance[]
    },
    enabled: !!user && !!today,
  })

  // ── Suggested split ────────────────────────────────────────────────────────
  const lastSplitQ = useQuery<WorkoutSplit | null>({
    queryKey: ['dashboard_last_split', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('workout_sessions')
        .select('split')
        .eq('user_id', user!.id)
        .order('session_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      return (data as { split: WorkoutSplit } | null)?.split ?? null
    },
    enabled: !!user,
  })

  const isLoading =
    latestWeightQ.isLoading ||
    weight7DaysAgoQ.isLoading ||
    todayCaloriesQ.isLoading ||
    lastSleepQ.isLoading ||
    monthSpendQ.isLoading ||
    tasksQ.isLoading ||
    lastSplitQ.isLoading

  const data: DashboardData = {
    latestWeight: latestWeightQ.data ?? null,
    weightSevenDaysAgo: weight7DaysAgoQ.data ?? null,
    todayCalories: todayCaloriesQ.data ?? 0,
    calorieGoal,
    lastSleepHours: lastSleepQ.data?.hours ?? null,
    lastSleepQuality: lastSleepQ.data?.quality ?? null,
    monthSpendCents: monthSpendQ.data ?? 0,
    todayTasks: tasksQ.data ?? [],
    suggestedSplit: getSuggestedSplit(lastSplitQ.data ?? null),
  }

  return { data, isLoading }
}
