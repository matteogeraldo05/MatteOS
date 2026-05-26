import { useNavigate } from 'react-router-dom'
import Panel from '../../ui/Panel'
import Button from '../../ui/Button'
import { EXERCISE_PRESETS, SPLIT_LABELS } from '../workouts/exercisePresets'
import type { WorkoutSplit } from '../workouts/exercisePresets'

interface TodayWorkoutProps {
  suggestedSplit: WorkoutSplit
}

export default function TodayWorkout({ suggestedSplit }: TodayWorkoutProps) {
  const navigate = useNavigate()
  const presets = EXERCISE_PRESETS[suggestedSplit]
  // Show first 2 exercise names as a preview
  const preview = presets.slice(0, 2).map((e) => e.name)

  return (
    <Panel
      eyebrow="TODAY'S WORKOUT"
      right={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/workouts')}
        >
          Start workout
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-xl font-medium text-text-primary">
          {SPLIT_LABELS[suggestedSplit]}
        </p>
        <ul className="flex flex-col gap-1">
          {preview.map((name) => (
            <li key={name} className="text-sm text-text-secondary">
              {name}
            </li>
          ))}
          {presets.length > 2 && (
            <li className="text-xs text-text-muted">
              +{presets.length - 2} more exercises
            </li>
          )}
        </ul>
      </div>
    </Panel>
  )
}
