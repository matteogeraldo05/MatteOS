import ScreenHeader from '../../ui/ScreenHeader'
import EmptyState from '../../ui/EmptyState'

export default function WorkoutsPage() {
  return (
    <>
      <ScreenHeader title="Workouts" />
      <EmptyState message="Workouts module coming soon — log sessions by split, track sets/reps/weight, and see progression." />
    </>
  )
}
