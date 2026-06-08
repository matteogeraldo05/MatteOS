import { SquaresFour } from '@phosphor-icons/react'
import ScreenHeader from '../../ui/ScreenHeader'
import Spinner from '../../ui/Spinner'
import GreetingHeader from './GreetingHeader'
import DashboardMetrics from './DashboardMetrics'
import TodayWorkout from './TodayWorkout'
import TodayTodoPreview from './TodayTodoPreview'
import { useDashboardData } from './queries'

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return <DashboardContent />
}

// ─── Main dashboard content ───────────────────────────────────────────────────

function DashboardContent() {
  const { data, isLoading } = useDashboardData()

  return (
    <>
      <ScreenHeader
        title="Dashboard"
        icon={<SquaresFour size={22} weight="light" className="text-accent" aria-hidden="true" />}
      />

      <div className="flex flex-col gap-section">
        {/* Greeting */}
        <GreetingHeader />

        {/* Metrics row */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size={20} />
          </div>
        ) : (
          <DashboardMetrics data={data} />
        )}

        {/* Workout + Todo grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodayWorkout suggestedSplit={data.suggestedSplit} />
          <TodayTodoPreview tasks={data.todayTasks} />
        </div>
      </div>
    </>
  )
}
