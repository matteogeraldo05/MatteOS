import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { todayInTz, weekStartOf, toDateString } from '../../lib/dates'
import { SquaresFour } from '@phosphor-icons/react'
import ScreenHeader from '../../ui/ScreenHeader'
import Spinner from '../../ui/Spinner'
import WeeklyReviewPage from '../weekly/WeeklyReviewPage'
import GreetingHeader from './GreetingHeader'
import DashboardMetrics from './DashboardMetrics'
import TodayWorkout from './TodayWorkout'
import TodayTodoPreview from './TodayTodoPreview'
import { useDashboardData } from './queries'
import Button from '../../ui/Button'

// ─── Sunday takeover helpers ──────────────────────────────────────────────────

function isSunday(tz: string): boolean {
  const dowStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).format(new Date())
  return dowStr === 'Sun'
}

function getSkipKey(tz: string): string {
  const today = todayInTz(tz)
  const weekStart = toDateString(weekStartOf(new Date(today + 'T00:00:00')))
  return `matteos:weeklyReviewSkipped:${weekStart}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile } = useAuth()
  const tz = (profile?.timezone as string) ?? 'UTC'

  const skipKey = getSkipKey(tz)
  const [skipped, setSkipped] = useState<boolean>(() => !!localStorage.getItem(skipKey))

  const sunday = isSunday(tz)

  function handleSkip() {
    localStorage.setItem(skipKey, '1')
    setSkipped(true)
  }

  // Sunday takeover: show Weekly Review unless the user has already skipped
  if (sunday && !skipped) {
    return (
      <div className="relative">
        {/* "Skip this week" Ghost button — top-right corner */}
        <div className="absolute top-0 right-0 z-10">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip this week
          </Button>
        </div>
        <WeeklyReviewPage />
      </div>
    )
  }

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
