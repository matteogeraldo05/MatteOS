import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/AuthProvider'
import type { WorkoutSplit } from './exercisePresets'

// ─── Types ───────────────────────────────────────────────────────────────────

export type WorkoutExercise = {
  id: string
  user_id: string
  session_id: string
  exercise_name: string
  exercise_order: number
  sets: number
  reps: number
  weight_lbs: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type WorkoutSession = {
  id: string
  user_id: string
  session_date: string
  split: WorkoutSplit
  notes: string | null
  created_at: string
  updated_at: string
  workout_exercises: WorkoutExercise[]
}

export type ExerciseInput = {
  exercise_name: string
  exercise_order: number
  sets: number
  reps: number
  weight_lbs: number
  notes?: string | null
}

export type UpsertSessionVars = {
  sessionDate: string
  split: WorkoutSplit
  notes?: string | null
  exercises: ExerciseInput[]
}

// ─── useRecentSessions ────────────────────────────────────────────────────────

export function useRecentSessions(split: WorkoutSplit, limit = 10) {
  const { user } = useAuth()

  return useQuery<WorkoutSession[]>({
    queryKey: ['workout_sessions', split, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*, workout_exercises(*)')
        .eq('user_id', user!.id)
        .eq('split', split)
        .order('session_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data ?? []) as WorkoutSession[]
    },
    enabled: !!user,
  })
}

// ─── useLastSessionAnySplit ────────────────────────────────────────────────────

export function useLastSessionAnySplit() {
  const { user } = useAuth()

  return useQuery<WorkoutSession | null>({
    queryKey: ['workout_last_session_any'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*, workout_exercises(*)')
        .eq('user_id', user!.id)
        .order('session_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data as WorkoutSession | null
    },
    enabled: !!user,
  })
}

// ─── useUpsertSession ─────────────────────────────────────────────────────────

export function useUpsertSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionDate, split, notes, exercises }: UpsertSessionVars) => {
      // Check if a session already exists for this date + split
      const { data: existing } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user!.id)
        .eq('session_date', sessionDate)
        .eq('split', split)
        .maybeSingle()

      let sessionId: string

      if (existing?.id) {
        // Update existing session
        const { error } = await supabase
          .from('workout_sessions')
          .update({ notes: notes ?? null })
          .eq('id', existing.id)
        if (error) throw error
        sessionId = existing.id as string
      } else {
        // Insert new session
        const { data, error } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user!.id,
            session_date: sessionDate,
            split,
            notes: notes ?? null,
          })
          .select('id')
          .single()
        if (error) throw error
        sessionId = (data as { id: string }).id
      }

      // Replace exercises: delete old, insert new
      const { error: delError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user!.id)
      if (delError) throw delError

      if (exercises.length > 0) {
        const { error: insError } = await supabase
          .from('workout_exercises')
          .insert(
            exercises.map((ex) => ({
              user_id: user!.id,
              session_id: sessionId,
              exercise_name: ex.exercise_name,
              exercise_order: ex.exercise_order,
              sets: ex.sets,
              reps: ex.reps,
              weight_lbs: ex.weight_lbs,
              notes: ex.notes ?? null,
            })),
          )
        if (insError) throw insError
      }

      return sessionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['workout_last_session_any'] })
    },
  })
}

// ─── useDeleteSession ─────────────────────────────────────────────────────────

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Exercises cascade-delete via FK on delete cascade
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['workout_last_session_any'] })
    },
  })
}
