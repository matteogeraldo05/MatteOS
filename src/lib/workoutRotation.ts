import type { WorkoutSplit } from '../modules/workouts/exercisePresets'

const ROTATION: Record<WorkoutSplit, WorkoutSplit> = {
  chest_triceps: 'back_biceps',
  back_biceps: 'legs_core',
  legs_core: 'chest_triceps',
}

export function getSuggestedSplit(lastSessionSplit?: WorkoutSplit | null): WorkoutSplit {
  if (!lastSessionSplit) return 'chest_triceps'
  return ROTATION[lastSessionSplit]
}
