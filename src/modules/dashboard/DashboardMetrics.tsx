import MetricCard from '../../ui/MetricCard'
import ProgressBar from '../../ui/ProgressBar'
import type { DashboardData } from './queries'

interface DashboardMetricsProps {
  data: DashboardData
}

// ─── Calorie progress bar color ────────────────────────────────────────────────

function calorieBarColor(calories: number, goal: number): 'accent' | 'warning' | 'danger' {
  const pct = goal > 0 ? calories / goal : 0
  if (pct > 1.1) return 'danger'
  if (pct > 0.9) return 'warning'
  return 'accent'
}

// ─── Quality stars ────────────────────────────────────────────────────────────

function QualityStars({ quality }: { quality: number }) {
  return (
    <div className="flex gap-1 mt-1" aria-label={`Sleep quality ${quality} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-sm ${
            i < quality ? 'bg-accent' : 'border border-border-default'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardMetrics({ data }: DashboardMetricsProps) {
  const {
    latestWeight,
    weightSevenDaysAgo,
    todayCalories,
    calorieGoal,
    lastSleepHours,
    lastSleepQuality,
    monthSpendCents,
  } = data

  // Weight delta
  const weightDelta =
    latestWeight !== null && weightSevenDaysAgo !== null
      ? latestWeight - weightSevenDaysAgo
      : null

  // Calories display
  const calDisplay = todayCalories.toString()
  const calUnit = calorieGoal ? `/ ${calorieGoal} kcal` : 'kcal'
  const barColor = calorieGoal ? calorieBarColor(todayCalories, calorieGoal) : 'accent'

  // Sleep display
  const sleepDisplay =
    lastSleepHours !== null ? Number(lastSleepHours).toFixed(1) : '—'

  // Month spend display
  const spendDollars = (monthSpendCents / 100).toFixed(2)
  const spendDisplay = monthSpendCents > 0 ? spendDollars : '0.00'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {/* Weight */}
      <div className="bg-bg-base border border-border-default rounded-lg p-card">
        <MetricCard
          label="Weight"
          value={latestWeight !== null ? Number(latestWeight).toFixed(1) : '—'}
          unit={latestWeight !== null ? 'lbs' : undefined}
          delta={
            weightDelta !== null
              ? {
                  value: Math.abs(parseFloat(weightDelta.toFixed(1))),
                  direction:
                    weightDelta < -0.05
                      ? 'down'
                      : weightDelta > 0.05
                      ? 'up'
                      : 'flat',
                }
              : undefined
          }
        />
      </div>

      {/* Calories */}
      <div className="bg-bg-base border border-border-default rounded-lg p-card">
        <MetricCard
          label="Calories today"
          value={calDisplay}
          unit={calUnit}
        />
        {calorieGoal && (
          <ProgressBar
            value={todayCalories}
            max={calorieGoal}
            color={barColor}
            className="mt-2"
          />
        )}
      </div>

      {/* Sleep */}
      <div className="bg-bg-base border border-border-default rounded-lg p-card">
        <MetricCard
          label="Last night"
          value={sleepDisplay}
          unit={lastSleepHours !== null ? 'h' : undefined}
        />
        {lastSleepQuality !== null && (
          <QualityStars quality={lastSleepQuality} />
        )}
      </div>

      {/* Month spend */}
      <div className="bg-bg-base border border-border-default rounded-lg p-card">
        <MetricCard
          label="Month spend"
          value={spendDisplay}
          unit="$"
        />
      </div>
    </div>
  )
}
