// Auto-generated types (in production: run `supabase gen types typescript`)
// These are hand-written for Phase 0 — replace with generated output after `supabase gen types`

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type SexEnum = 'male' | 'female'
export type ActivityLevelEnum = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type TaskTagEnum = 'gym' | 'finance' | 'personal' | 'work'
export type RecurrenceEnum = 'none' | 'daily' | 'mwf' | 'weekly' | 'monthly'
export type FinanceCategoryEnum = 'food' | 'groceries' | 'transport' | 'housing' | 'entertainment' | 'health' | 'shopping' | 'other'
export type WorkoutSplitEnum = 'chest_triceps' | 'back_biceps' | 'legs_core'
export type BookSectionEnum = 'quote' | 'reflection' | 'note'
export type MealStatusEnum = 'prepped' | 'planned' | 'flex'

export interface Database {
  public: {
    Tables: {
      user_profile: {
        Row: {
          id: string
          display_name: string
          height_cm: number | null
          birth_date: string | null
          sex: SexEnum | null
          activity_level: ActivityLevelEnum
          calorie_goal: number | null
          sleep_goal_hours: number
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          height_cm?: number | null
          birth_date?: string | null
          sex?: SexEnum | null
          activity_level?: ActivityLevelEnum
          calorie_goal?: number | null
          sleep_goal_hours?: number
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          height_cm?: number | null
          birth_date?: string | null
          sex?: SexEnum | null
          activity_level?: ActivityLevelEnum
          calorie_goal?: number | null
          sleep_goal_hours?: number
          timezone?: string
          updated_at?: string
        }
      }
      sleep_logs: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          log_date: string
          bed_time: string
          wake_time: string
          hours: number
          quality: number
          notes?: string | null
        }
        Update: {
          log_date?: string
          bed_time?: string
          wake_time?: string
          hours?: number
          quality?: number
          notes?: string | null
        }
      }
    }
    Views: {
      weight_logs_enriched: {
        Row: {
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
      }
    }
    Enums: {
      sex_enum: SexEnum
      activity_level_enum: ActivityLevelEnum
      task_tag_enum: TaskTagEnum
      recurrence_enum: RecurrenceEnum
      finance_category_enum: FinanceCategoryEnum
      workout_split_enum: WorkoutSplitEnum
      book_section_enum: BookSectionEnum
      meal_status_enum: MealStatusEnum
    }
  }
}

export type UserProfile = Database['public']['Tables']['user_profile']['Row']
