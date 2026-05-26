import { CalendarCheck } from '@phosphor-icons/react'
import ScreenHeader from '../../ui/ScreenHeader'
import EmptyState from '../../ui/EmptyState'

export default function WeeklyReviewPage() {
  return (
    <>
      <ScreenHeader
        title="Weekly Review"
        icon={<CalendarCheck size={22} weight="light" className="text-accent" aria-hidden="true" />}
      />
      <EmptyState message="Weekly Review coming soon — auto-generated AI narrative + personal reflection for each week." />
    </>
  )
}
