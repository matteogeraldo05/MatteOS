import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import { toDateString } from '../../lib/dates'

export type SleepLog = {
  id: string
  user_id: string
  log_date: string
  bed_time: string
  wake_time: string
  hours: number
  quality: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type SleepLogInsert = {
  log_date: string
  bed_time: string
  wake_time: string
  hours: number
  quality: number
  notes?: string | null
}

// ─── useSleepLogs ────────────────────────────────────────────────────────────

export function useSleepLogs(rangeStart: Date, rangeEnd: Date) {
  const { user } = useAuth()
  const startStr = toDateString(rangeStart)
  const endStr = toDateString(rangeEnd)

  return useQuery<SleepLog[]>({
    queryKey: ['sleep', startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('log_date', startStr)
        .lte('log_date', endStr)
        .order('log_date', { ascending: true })

      if (error) throw error
      return (data ?? []) as SleepLog[]
    },
    enabled: !!user,
  })
}

// ─── useUpsertSleepLog ───────────────────────────────────────────────────────

export function useUpsertSleepLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SleepLogInsert) => {
      const { error } = await supabase
        .from('sleep_logs')
        .upsert(
          { ...payload, user_id: user!.id },
          { onConflict: 'user_id,log_date' },
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep'] })
    },
  })
}

// ─── useDeleteSleepLog ───────────────────────────────────────────────────────

export function useDeleteSleepLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sleep_logs')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep'] })
    },
  })
}

// ─── useSleepGoal ────────────────────────────────────────────────────────────

export function useSleepGoal(): number {
  const { profile } = useAuth()
  return (profile?.sleep_goal_hours as number) ?? 7.0
}
