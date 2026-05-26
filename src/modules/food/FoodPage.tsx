import { useState } from 'react'
import { Plus, ForkKnife } from '@phosphor-icons/react'


import ScreenHeader from '../../ui/ScreenHeader'
import Panel from '../../ui/Panel'
import MetricCard from '../../ui/MetricCard'
import ProgressBar from '../../ui/ProgressBar'
import Toggle from '../../ui/Toggle'
import Spinner from '../../ui/Spinner'
import AgentButton from '../../shell/AgentButton'

import { useDayLog, use30DayTotals, useDailyGoal } from './queries'
import DayPicker from './DayPicker'
import MealList from './MealList'
import MealForm from './MealForm'
import CalorieChart from './CalorieChart'
import CalorieTable from './CalorieTable'
import { toDateString } from '../../lib/dates'

// ─── Progress bar colour based on % of daily goal ────────────────────────────

type BarColor = 'accent' | 'warning' | 'danger'

function goalColor(eaten: number, goal: number): BarColor {
  const pct = goal > 0 ? (eaten / goal) * 100 : 0
  if (pct > 110) return 'danger'
  if (pct >= 90) return 'warning'
  return 'accent'
}

// ─── FoodPage ────────────────────────────────────────────────────────────────

export default function FoodPage() {
  const today = toDateString(new Date())
  const [date, setDate] = useState(today)
  const [chartView, setChartView] = useState<'chart' | 'table'>('chart')
  const [addOpen, setAddOpen] = useState(false)

  const { data: dayLog, isLoading: dayLoading } = useDayLog(date)
  const { data: totals = [], isLoading: totalsLoading } = use30DayTotals()
  const dailyGoal = useDailyGoal()

  const meals = dayLog?.food_log_meals ?? []
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
  const nextMealOrder = meals.length + 1

  // MetricCard display
  const calorieDisplay = dailyGoal != null
    ? `${totalCalories.toLocaleString()} / ${dailyGoal.toLocaleString()}`
    : totalCalories.toLocaleString()

  return (
    <>
      <ScreenHeader
        title="Food"
        icon={<ForkKnife size={22} weight="light" className="text-accent" aria-hidden="true" />}
        right={
          <AgentButton label="ESTIMATE CALORIES" onClick={() => setAddOpen(true)} />
        }
      />

      {/* ── Day picker ─────────────────────────────────────────────────────── */}
      <DayPicker date={date} onDateChange={setDate} />

      {/* ── Panel A — Today's log ─────────────────────────────────────────── */}
      <Panel
        eyebrow={date === today ? 'TODAY' : undefined}
        title={date === today ? undefined : date}
      >
        {/* Calorie counter + progress bar */}
        <div className="mb-4">
          <MetricCard
            label="Calories"
            value={calorieDisplay}
            unit={dailyGoal != null ? undefined : 'kcal'}
          />
          {dailyGoal != null && (
            <div className="mt-2">
              <ProgressBar
                value={totalCalories}
                max={dailyGoal}
                color={goalColor(totalCalories, dailyGoal)}
              />
              <p className="text-xs text-text-muted mt-1 tabular-nums">
                {totalCalories > 0
                  ? `${Math.round((totalCalories / dailyGoal) * 100)}% of daily goal`
                  : `Goal: ${dailyGoal.toLocaleString()} kcal`}
              </p>
            </div>
          )}
        </div>

        {/* Meal list */}
        {dayLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size={16} />
          </div>
        ) : (
          <MealList
            meals={meals}
            date={date}
            onAddClick={() => setAddOpen(true)}
          />
        )}
      </Panel>

      {/* ── Panel B — 30-day calories ──────────────────────────────────────── */}
      <div className="mt-6">
        <Panel
          eyebrow="30-DAY CALORIES"
          right={
            <Toggle
              value={chartView}
              onChange={setChartView}
              options={[
                { value: 'chart', label: 'Chart' },
                { value: 'table', label: 'Table' },
              ]}
            />
          }
        >
          {totalsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={16} />
            </div>
          ) : chartView === 'chart' ? (
            <CalorieChart data={totals} goal={dailyGoal} height={200} />
          ) : (
            <CalorieTable data={totals} goal={dailyGoal} />
          )}
        </Panel>
      </div>

      {/* ── Floating add button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        aria-label="Add meal"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center
          bg-accent hover:bg-accent-hover shadow-lg transition-colors duration-[120ms] ease-out cursor-pointer"
      >
        <Plus size={24} weight="bold" className="text-white" aria-hidden="true" />
      </button>

      {/* ── Add meal modal ─────────────────────────────────────────────────── */}
      <MealForm
        key={date + '-new'}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        date={date}
        existingMeal={null}
        nextOrder={nextMealOrder}
      />
    </>
  )
}
