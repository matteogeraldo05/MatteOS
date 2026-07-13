import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'

// ─── Types ───────────────────────────────────────────────────────────────────

export type MealStatus = 'prepped' | 'planned' | 'flex'

export type MealPrepPlan = {
  id: string
  user_id: string
  week_start_date: string
  created_at: string
  updated_at: string
}

export type MealPrepDay = {
  id: string
  user_id: string
  plan_id: string
  day_of_week: number  // 0=Mon, 6=Sun
  description: string
  calories: number | null
  status: MealStatus
  created_at: string
  updated_at: string
}

export type ShoppingItem = {
  id: string
  user_id: string
  plan_id: string
  item_name: string
  checked: boolean
  item_order: number
  created_at: string
  updated_at: string
}

export type WeekPlanData = {
  plan: MealPrepPlan | null
  days: MealPrepDay[]
  items: ShoppingItem[]
}

// ─── Internal: ensure a plan row exists ──────────────────────────────────────

async function ensurePlanId(userId: string, weekStart: string): Promise<string> {
  // Upsert on the (user_id, week_start_date) unique constraint — atomic, so
  // rapid concurrent edits can't race a check-then-insert into a violation.
  const { data, error } = await supabase
    .from('meal_prep_plans')
    .upsert(
      { user_id: userId, week_start_date: weekStart },
      { onConflict: 'user_id,week_start_date' },
    )
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

// ─── useWeekPlan ──────────────────────────────────────────────────────────────

export function useWeekPlan(weekStart: string) {
  const { user } = useAuth()

  return useQuery<WeekPlanData>({
    queryKey: ['mealprep', weekStart],
    queryFn: async () => {
      const { data: plan, error: planError } = await supabase
        .from('meal_prep_plans')
        .select('*')
        .eq('user_id', user!.id)
        .eq('week_start_date', weekStart)
        .maybeSingle()

      if (planError) throw planError
      if (!plan) return { plan: null, days: [], items: [] }

      const [daysResult, itemsResult] = await Promise.all([
        supabase
          .from('meal_prep_days')
          .select('*')
          .eq('plan_id', plan.id)
          .order('day_of_week', { ascending: true }),
        supabase
          .from('shopping_items')
          .select('*')
          .eq('plan_id', plan.id)
          .order('item_order', { ascending: true }),
      ])

      if (daysResult.error) throw daysResult.error
      if (itemsResult.error) throw itemsResult.error

      return {
        plan: plan as MealPrepPlan,
        days: (daysResult.data ?? []) as MealPrepDay[],
        items: (itemsResult.data ?? []) as ShoppingItem[],
      }
    },
    enabled: !!user,
  })
}

// ─── useSaveDay ───────────────────────────────────────────────────────────────

export type SaveDayVars = {
  weekStart: string
  dow: number
  description: string
  calories: number | null
  status: MealStatus
}

export function useSaveDay() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ weekStart, dow, description, calories, status }: SaveDayVars) => {
      const planId = await ensurePlanId(user!.id, weekStart)

      const { error } = await supabase
        .from('meal_prep_days')
        .upsert(
          {
            user_id: user!.id,
            plan_id: planId,
            day_of_week: dow,
            description,
            calories,
            status,
          },
          { onConflict: 'plan_id,day_of_week' },
        )

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mealprep', vars.weekStart] })
    },
  })
}

// ─── useAddShoppingItem ───────────────────────────────────────────────────────

export type AddItemVars = {
  weekStart: string
  itemName: string
  currentMaxOrder: number
}

export function useAddShoppingItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ weekStart, itemName, currentMaxOrder }: AddItemVars) => {
      const planId = await ensurePlanId(user!.id, weekStart)

      const { error } = await supabase
        .from('shopping_items')
        .insert({
          user_id: user!.id,
          plan_id: planId,
          item_name: itemName.trim(),
          item_order: currentMaxOrder + 1,
        })

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mealprep', vars.weekStart] })
    },
  })
}

// ─── useUpdateShoppingItem ────────────────────────────────────────────────────

export function useUpdateShoppingItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, itemName }: { id: string; itemName: string; weekStart: string }) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({ item_name: itemName.trim() })
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mealprep', vars.weekStart] })
    },
  })
}

// ─── useToggleShoppingItem ────────────────────────────────────────────────────

export function useToggleShoppingItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      checked,
    }: { id: string; checked: boolean; weekStart: string }) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({ checked })
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mealprep', vars.weekStart] })
    },
  })
}

// ─── useDeleteShoppingItem ────────────────────────────────────────────────────

export function useDeleteShoppingItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; weekStart: string }) => {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mealprep', vars.weekStart] })
    },
  })
}

// ─── useClearCheckedItems ─────────────────────────────────────────────────────

export function useClearCheckedItems() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ planId }: { planId: string; weekStart: string }) => {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('plan_id', planId)
        .eq('user_id', user!.id)
        .eq('checked', true)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['mealprep', vars.weekStart] })
    },
  })
}
