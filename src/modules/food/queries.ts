import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { toDateString, addDays } from '../../lib/dates'

// ─── Types ───────────────────────────────────────────────────────────────────

export type FoodLogMeal = {
  id: string
  user_id: string
  food_log_id: string
  meal_order: number
  description: string
  calories: number
  ai_estimated: boolean
  created_at: string
  updated_at: string
}

export type DayLog = {
  id: string
  user_id: string
  log_date: string
  notes: string | null
  created_at: string
  updated_at: string
  food_log_meals: FoodLogMeal[]
}

export type DayTotal = {
  date: string
  total: number | null // null = no log for that day; 0 = logged but no calories
}

// ─── useDayLog ───────────────────────────────────────────────────────────────

export function useDayLog(date: string) {
  const { user } = useAuth()

  return useQuery<DayLog | null>({
    queryKey: ['food_day', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_logs')
        .select('*, food_log_meals(*)')
        .eq('user_id', user!.id)
        .eq('log_date', date)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      // Sort meals client-side by meal_order
      const sorted: DayLog = {
        ...(data as DayLog),
        food_log_meals: [...((data as DayLog).food_log_meals ?? [])].sort(
          (a, b) => a.meal_order - b.meal_order,
        ),
      }
      return sorted
    },
    enabled: !!user,
  })
}

// ─── useUpsertMeal ───────────────────────────────────────────────────────────

export type UpsertMealInput = {
  date: string
  meal: {
    id?: string         // present = update existing
    description: string
    calories: number
    ai_estimated?: boolean
    meal_order: number
  }
}

export function useUpsertMeal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ date, meal }: UpsertMealInput) => {
      // Step 1: Get or create the parent food_log for this date
      const { data: existing } = await supabase
        .from('food_logs')
        .select('id')
        .eq('user_id', user!.id)
        .eq('log_date', date)
        .maybeSingle()

      let foodLogId: string
      if (existing) {
        foodLogId = (existing as { id: string }).id
      } else {
        const { data: newLog, error: insertErr } = await supabase
          .from('food_logs')
          .insert({ user_id: user!.id, log_date: date })
          .select('id')
          .single()
        if (insertErr) throw insertErr
        foodLogId = (newLog as { id: string }).id
      }

      // Step 2: Insert or update the meal
      if (meal.id) {
        const { error } = await supabase
          .from('food_log_meals')
          .update({
            description: meal.description,
            calories: meal.calories,
            ai_estimated: meal.ai_estimated ?? false,
            meal_order: meal.meal_order,
          })
          .eq('id', meal.id)
          .eq('user_id', user!.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('food_log_meals')
          .insert({
            user_id: user!.id,
            food_log_id: foodLogId,
            meal_order: meal.meal_order,
            description: meal.description,
            calories: meal.calories,
            ai_estimated: meal.ai_estimated ?? false,
          })
        if (error) throw error
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['food_day', vars.date] })
      queryClient.invalidateQueries({ queryKey: ['food_30day'] })
    },
  })
}

// ─── useDeleteMeal ───────────────────────────────────────────────────────────

export function useDeleteMeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; date: string }) => {
      const { error } = await supabase
        .from('food_log_meals')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['food_day', vars.date] })
      queryClient.invalidateQueries({ queryKey: ['food_30day'] })
    },
  })
}

// ─── use30DayTotals ───────────────────────────────────────────────────────────

export function use30DayTotals() {
  const { user } = useAuth()

  return useQuery<DayTotal[]>({
    queryKey: ['food_30day'],
    queryFn: async () => {
      const today = new Date()
      const endStr = toDateString(today)
      const startStr = toDateString(addDays(today, -29))

      const { data: logs, error } = await supabase
        .from('food_logs')
        .select('log_date, food_log_meals(calories)')
        .eq('user_id', user!.id)
        .gte('log_date', startStr)
        .lte('log_date', endStr)

      if (error) throw error

      // Build map: log_date → total calories
      const totalsMap = new Map<string, number>()
      for (const log of (logs ?? []) as Array<{
        log_date: string
        food_log_meals: Array<{ calories: number }>
      }>) {
        const sum = (log.food_log_meals ?? []).reduce((acc, m) => acc + m.calories, 0)
        totalsMap.set(log.log_date, sum)
      }

      // Fill all 30 days: null for days with no food_log row
      const result: DayTotal[] = []
      for (let i = 29; i >= 0; i--) {
        const d = toDateString(addDays(today, -i))
        result.push({ date: d, total: totalsMap.has(d) ? totalsMap.get(d)! : null })
      }

      return result
    },
    enabled: !!user,
  })
}

// ─── useDailyGoal ─────────────────────────────────────────────────────────────
// Returns the calorie goal: user_profile.calorie_goal first; falls back to
// the most recent TDEE from weight_logs_enriched if calorie_goal is null.

export function useDailyGoal(): number | null {
  const { profile, user } = useAuth()

  const calGoal = (profile?.calorie_goal as number | null) ?? null

  const { data: latestTdee } = useQuery<number | null>({
    queryKey: ['food_daily_goal_tdee', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('weight_logs_enriched')
        .select('tdee')
        .eq('user_id', user!.id)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      return (data as { tdee: number | null } | null)?.tdee ?? null
    },
    enabled: !!user && calGoal === null,
  })

  if (calGoal !== null) return calGoal
  if (latestTdee !== null && latestTdee !== undefined) return Math.round(latestTdee)
  return null
}
