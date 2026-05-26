import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { toDateString } from '../../lib/dates'

// ─── Types ───────────────────────────────────────────────────────────────────

export type WeightLogEnriched = {
  id: string
  user_id: string
  log_date: string
  weight_lbs: number
  weight_kg: number | null
  height_m: number | null
  bmi: number | null
  age_years: number | null
  bmr: number | null
  tdee: number | null
  created_at: string
}

export type WeightLogInsert = {
  log_date: string
  weight_lbs: number
}

// ─── useWeightLogs ────────────────────────────────────────────────────────────

export function useWeightLogs(rangeStart: Date, rangeEnd: Date) {
  const { user } = useAuth()
  const startStr = toDateString(rangeStart)
  const endStr = toDateString(rangeEnd)

  return useQuery<WeightLogEnriched[]>({
    queryKey: ['weight_logs', startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weight_logs_enriched')
        .select('*')
        .eq('user_id', user!.id)
        .gte('log_date', startStr)
        .lte('log_date', endStr)
        .order('log_date', { ascending: true })

      if (error) throw error
      return (data ?? []) as WeightLogEnriched[]
    },
    enabled: !!user,
  })
}

// ─── useRecentWeightLogs ─────────────────────────────────────────────────────
// Fetches the last N entries for the "Recent" list (from the enriched view)

export function useRecentWeightLogs(limit = 10) {
  const { user } = useAuth()

  return useQuery<WeightLogEnriched[]>({
    queryKey: ['weight_logs_recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weight_logs_enriched')
        .select('*')
        .eq('user_id', user!.id)
        .order('log_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data ?? []) as WeightLogEnriched[]
    },
    enabled: !!user,
  })
}

// ─── useUpsertWeight ─────────────────────────────────────────────────────────

export function useUpsertWeight() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: WeightLogInsert) => {
      const { error } = await supabase
        .from('weight_logs')
        .upsert(
          { ...payload, user_id: user!.id },
          { onConflict: 'user_id,log_date' },
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight_logs'] })
      queryClient.invalidateQueries({ queryKey: ['weight_logs_recent'] })
    },
  })
}

// ─── useDeleteWeight ─────────────────────────────────────────────────────────

export function useDeleteWeight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight_logs'] })
      queryClient.invalidateQueries({ queryKey: ['weight_logs_recent'] })
    },
  })
}
