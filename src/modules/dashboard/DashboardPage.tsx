import ScreenHeader from '../../ui/ScreenHeader'
import EmptyState from '../../ui/EmptyState'

export default function DashboardPage() {
  return (
    <>
      <ScreenHeader title="Dashboard" />
      <EmptyState message="Dashboard coming soon — your daily overview will live here." />
    </>
  )
}
