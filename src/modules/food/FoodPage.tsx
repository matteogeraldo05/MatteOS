import { useState, useCallback } from 'react'
import { Plus, ForkKnife, CaretLeft, CaretRight } from '@phosphor-icons/react'

import ScreenHeader from '../../ui/ScreenHeader'
import Panel from '../../ui/Panel'
import MetricCard from '../../ui/MetricCard'
import ProgressBar from '../../ui/ProgressBar'
import Toggle from '../../ui/Toggle'
import Spinner from '../../ui/Spinner'
import Button from '../../ui/Button'
import IconButton from '../../ui/IconButton'
import AgentButton from '../../shell/AgentButton'
import { useToast } from '../../ui/Toast'

import { useDayLog, use30DayTotals, useDailyGoal } from './queries'
import {
  useWeekPlan,
  useSaveDay,
  useAddShoppingItem,
  useUpdateShoppingItem,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
  type MealStatus,
} from '../mealprep/queries'
import DayPicker from './DayPicker'
import MealList from './MealList'
import MealForm from './MealForm'
import CalorieChart from './CalorieChart'
import CalorieTable from './CalorieTable'
import WeekPlan from '../mealprep/WeekPlan'
import ShoppingList from '../mealprep/ShoppingList'
import { toDateString, weekStartOf } from '../../lib/dates'

// ─── Helpers ─────────────────────────────────────────────────────────────────

type BarColor = 'accent' | 'warning' | 'danger'

function goalColor(eaten: number, goal: number): BarColor {
  const pct = goal > 0 ? (eaten / goal) * 100 : 0
  if (pct > 110) return 'danger'
  if (pct >= 90)  return 'warning'
  return 'accent'
}

function getTodayWeekStart(): string {
  return toDateString(weekStartOf(new Date()))
}

function shiftWeek(weekStart: string, delta: number): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  return toDateString(new Date(y, m - 1, d + delta * 7))
}

function formatWeekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end   = new Date(y, m - 1, d + 6)
  const fmt = (dt: Date, year?: boolean) =>
    dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}) })
  return `${fmt(start)} — ${fmt(end, true)}`
}

// ─── FoodPage ────────────────────────────────────────────────────────────────

export default function FoodPage() {
  const today = toDateString(new Date())
  const { push: pushToast } = useToast()

  // ── Food diary state ──────────────────────────────────────────────────────
  const [date, setDate] = useState(today)
  const [chartView, setChartView] = useState<'chart' | 'table'>('chart')
  const [addOpen, setAddOpen] = useState(false)

  const { data: dayLog, isLoading: dayLoading } = useDayLog(date)
  const { data: totals = [], isLoading: totalsLoading } = use30DayTotals()
  const dailyGoal = useDailyGoal()

  const meals = dayLog?.food_log_meals ?? []
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
  const nextMealOrder = meals.length + 1

  const calorieDisplay = dailyGoal != null
    ? `${totalCalories.toLocaleString()} / ${dailyGoal.toLocaleString()}`
    : totalCalories.toLocaleString()

  // ── Meal prep state ───────────────────────────────────────────────────────
  const todayWeekStart = getTodayWeekStart()
  const [weekStart, setWeekStart] = useState(todayWeekStart)
  const isCurrentWeek = weekStart === todayWeekStart

  const { data: prepData, isLoading: prepLoading } = useWeekPlan(weekStart)
  const saveDay      = useSaveDay()
  const addItem      = useAddShoppingItem()
  const updateItem   = useUpdateShoppingItem()
  const toggleItem   = useToggleShoppingItem()
  const deleteItem   = useDeleteShoppingItem()
  const clearChecked = useClearCheckedItems()

  const handleSaveDay = useCallback(
    (dow: number, description: string, calories: number | null, status: MealStatus) => {
      saveDay.mutate({ weekStart, dow, description, calories, status })
    },
    [weekStart, saveDay],
  )

  const handleAddItem = useCallback(
    (itemName: string) => {
      const maxOrder = (prepData?.items ?? []).reduce((m, i) => Math.max(m, i.item_order), -1)
      addItem.mutate({ weekStart, itemName, currentMaxOrder: maxOrder })
    },
    [weekStart, prepData?.items, addItem],
  )

  const handleUpdateItem = useCallback(
    (id: string, itemName: string) => updateItem.mutate({ id, itemName, weekStart }),
    [weekStart, updateItem],
  )

  const handleToggleItem = useCallback(
    (id: string, checked: boolean) => toggleItem.mutate({ id, checked, weekStart }),
    [weekStart, toggleItem],
  )

  const handleDeleteItem = useCallback(
    (id: string) => deleteItem.mutate({ id, weekStart }),
    [weekStart, deleteItem],
  )

  const handleClearChecked = useCallback(() => {
    if (!prepData?.plan) return
    clearChecked.mutate({ planId: prepData.plan.id, weekStart })
  }, [prepData?.plan, weekStart, clearChecked])

  const handleAgentSuggestWeek = () => {
    pushToast({
      kind: 'info',
      title: 'Agent unavailable',
      description: 'Meal week suggestion will be available after agent setup.',
    })
  }

  return (
    <>
      <ScreenHeader
        title="Food"
        icon={<ForkKnife size={22} weight="light" className="text-accent" aria-hidden="true" />}
        right={<AgentButton label="ESTIMATE CALORIES" onClick={() => setAddOpen(true)} />}
      />

      {/* ── Day picker ─────────────────────────────────────────────────────── */}
      <DayPicker date={date} onDateChange={setDate} />

      {/* ── Panel A — Today's log ─────────────────────────────────────────── */}
      <Panel
        eyebrow={date === today ? 'TODAY' : undefined}
        title={date === today ? undefined : date}
      >
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
        {dayLoading ? (
          <div className="flex justify-center py-8"><Spinner size={16} /></div>
        ) : (
          <MealList meals={meals} date={date} onAddClick={() => setAddOpen(true)} />
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
            <div className="flex justify-center py-8"><Spinner size={16} /></div>
          ) : chartView === 'chart' ? (
            <CalorieChart data={totals} goal={dailyGoal} height={200} />
          ) : (
            <CalorieTable data={totals} goal={dailyGoal} />
          )}
        </Panel>
      </div>

      {/* ── Meal Prep section ─────────────────────────────────────────────── */}
      <div className="mt-8" id="meal-prep">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
            Meal Prep
          </h2>
          <Button variant="ghost" size="sm" onClick={handleAgentSuggestWeek}>
            Suggest week
          </Button>
        </div>

        {/* Week picker */}
        <div className="flex items-center gap-2 mb-4">
          <IconButton label="Previous week" onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>
            <CaretLeft size={16} weight="bold" aria-hidden="true" />
          </IconButton>
          <span className="text-base font-medium text-text-primary min-w-[200px] text-center tabular-nums">
            {formatWeekLabel(weekStart)}
          </span>
          <IconButton label="Next week" onClick={() => setWeekStart(shiftWeek(weekStart, 1))}>
            <CaretRight size={16} weight="bold" aria-hidden="true" />
          </IconButton>
          {!isCurrentWeek && (
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(todayWeekStart)}>
              This week
            </Button>
          )}
        </div>

        {prepLoading ? (
          <div className="flex items-center justify-center py-12"><Spinner size={20} /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <Panel eyebrow="WEEKLY PLAN">
              <WeekPlan
                data={prepData ?? { plan: null, days: [], items: [] }}
                weekStart={weekStart}
                onSaveDay={handleSaveDay}
              />
            </Panel>
            <Panel eyebrow="SHOPPING LIST">
              <ShoppingList
                items={prepData?.items ?? []}
                planId={prepData?.plan?.id ?? null}
                onToggle={handleToggleItem}
                onAdd={handleAddItem}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                onClearChecked={handleClearChecked}
              />
            </Panel>
          </div>
        )}
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
