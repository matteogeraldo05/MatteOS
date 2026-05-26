import { Plus } from '@phosphor-icons/react'
import Button from '../../ui/Button'
import EmptyState from '../../ui/EmptyState'
import ExerciseRow, { type ExerciseRowData } from './ExerciseRow'

interface ExerciseListProps {
  exercises: ExerciseRowData[]
  onExercisesChange: (exercises: ExerciseRowData[]) => void
  readOnly?: boolean
}

export default function ExerciseList({ exercises, onExercisesChange, readOnly = false }: ExerciseListProps) {
  const handleChange = (idx: number, updated: ExerciseRowData) => {
    const next = exercises.map((ex, i) => (i === idx ? updated : ex))
    onExercisesChange(next)
  }

  const handleRemove = (idx: number) => {
    onExercisesChange(exercises.filter((_, i) => i !== idx))
  }

  const handleAddAdHoc = () => {
    const nextOrder = exercises.length
    onExercisesChange([
      ...exercises,
      {
        key: `adhoc-${Date.now()}`,
        exercise_name: '',
        exercise_order: nextOrder,
        sets: 3,
        reps: 8,
        weight_lbs: 0,
        notes: '',
        isAdHoc: true,
      },
    ])
  }

  if (!readOnly && exercises.length === 0) {
    return (
      <div>
        <EmptyState
          message="No exercises yet."
          ctaLabel="Add exercise"
          onCta={handleAddAdHoc}
        />
      </div>
    )
  }

  return (
    <div>
      {exercises.map((ex, idx) => (
        <ExerciseRow
          key={ex.key}
          data={ex}
          onChange={(updated) => handleChange(idx, updated)}
          onRemove={() => handleRemove(idx)}
          readOnly={readOnly}
        />
      ))}

      {!readOnly && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={handleAddAdHoc}>
            <span className="flex items-center gap-1.5">
              <Plus size={13} weight="bold" />
              Add exercise
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}
