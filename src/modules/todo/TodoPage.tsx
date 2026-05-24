import ScreenHeader from '../../ui/ScreenHeader'
import EmptyState from '../../ui/EmptyState'

export default function TodoPage() {
  return (
    <>
      <ScreenHeader title="To-do" />
      <EmptyState message="To-do module coming soon — tasks with recurrence, timeline view, and tag filtering." />
    </>
  )
}
