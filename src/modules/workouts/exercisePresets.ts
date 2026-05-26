// ─── Types ───────────────────────────────────────────────────────────────────

export type WorkoutSplit = 'chest_triceps' | 'back_biceps' | 'legs_core'

export type ExercisePreset = {
  name: string
  sets: number
  reps: number
  weight_lbs: number
}

// ─── Split display labels ─────────────────────────────────────────────────────

export const SPLIT_LABELS: Record<WorkoutSplit, string> = {
  chest_triceps: 'Chest+Tri',
  back_biceps: 'Back+Bi',
  legs_core: 'Legs+Core',
}

export const SPLIT_OPTIONS: { value: WorkoutSplit; label: string }[] = [
  { value: 'chest_triceps', label: SPLIT_LABELS.chest_triceps },
  { value: 'back_biceps', label: SPLIT_LABELS.back_biceps },
  { value: 'legs_core', label: SPLIT_LABELS.legs_core },
]

// ─── Exercise catalogue ────────────────────────────────────────────────────────

export const EXERCISE_PRESETS: Record<WorkoutSplit, ExercisePreset[]> = {
  chest_triceps: [
    { name: 'Incline DB Press',           sets: 3, reps: 8,  weight_lbs: 27.5 },
    { name: 'Cable Fly',                  sets: 3, reps: 8,  weight_lbs: 12.5 },
    { name: 'Triceps Pulldown',           sets: 3, reps: 9,  weight_lbs: 32   },
    { name: 'Overhead Triceps Extension', sets: 3, reps: 9,  weight_lbs: 22   },
    { name: 'Lat Raises Cable',           sets: 4, reps: 10, weight_lbs: 7.5  },
  ],
  back_biceps: [
    { name: 'Lat Pulldown',         sets: 4, reps: 8,  weight_lbs: 90 },
    { name: 'Seated Diverging Row', sets: 4, reps: 8,  weight_lbs: 60 },
    { name: 'Cable Pulldown',       sets: 4, reps: 8,  weight_lbs: 37 },
    { name: 'Face Pulls',           sets: 2, reps: 8,  weight_lbs: 32 },
    { name: 'Incline Curl',         sets: 3, reps: 10, weight_lbs: 15 },
    { name: 'Preacher Curl',        sets: 3, reps: 8,  weight_lbs: 55 },
  ],
  legs_core: [
    { name: 'Squat',            sets: 4, reps: 8,  weight_lbs: 35  },
    { name: 'Lying Leg Curl',   sets: 3, reps: 8,  weight_lbs: 68  },
    { name: 'Leg Extension',    sets: 3, reps: 8,  weight_lbs: 70  },
    { name: 'Calf Press',       sets: 2, reps: 10, weight_lbs: 100 },
    { name: 'Abdominal Crunch', sets: 2, reps: 10, weight_lbs: 100 },
  ],
}
