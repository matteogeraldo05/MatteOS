import { useState, useCallback } from 'react'
import { CaretLeft, CaretRight, CookingPot } from '@phosphor-icons/react'

import ScreenHeader from '../../ui/ScreenHeader'
import Panel from '../../ui/Panel'
import Button from '../../ui/Button'
import IconButton from '../../ui/IconButton'
import Spinner from '../../ui/Spinner'
import AgentButton from '../../shell/AgentButton'
import { useToast } from '../../ui/Toast'

import { weekStartOf, toDateString } from '../../lib/dates'
import {
  useWeekPlan,
  useSaveDay,
  useAddShoppingItem,
  useUpdateShoppingItem,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
  type MealStatus,
} from './queries'
import WeekPlan from './WeekPlan'
import ShoppingList from './ShoppingList'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayWeekStart(): string {
  return toDateString(weekStartOf(new Date()))
}

/** Shift a YYYY-MM-DD week-start string by ±7 days */
function shiftWeek(weekStart: string, delta: number): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const date = new Date(y, m - 1, d + delta * 7)
  return toDateString(date)
}

/** "May 18 — May 24, 2026" */
function formatWeekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end   = new Date(y, m - 1, d + 6)
  const fmt = (dt: Date, year?: boolean) =>
    dt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(year ? { year: 'numeric' } : {}),
    })
  return `${fmt(start)} — ${fmt(end, true)}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MealPrepPage() {
  const { push: pushToast } = useToast()

  const todayWeekStart = getTodayWeekStart()
  const [weekStart, setWeekStart] = useState(todayWeekStart)

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data, isLoading } = useWeekPlan(weekStart)
  const saveDay      = useSaveDay()
  const addItem      = useAddShoppingItem()
  const updateItem   = useUpdateShoppingItem()
  const toggleItem   = useToggleShoppingItem()
  const deleteItem   = useDeleteShoppingItem()
  const clearChecked = useClearCheckedItems()

  // ── Week navigation ──────────────────────────────────────────────────────────
  const isCurrentWeek = weekStart === todayWeekStart

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSaveDay = useCallback(
    (dow: number, description: string, calories: number | null, status: MealStatus) => {
      saveDay.mutate({ weekStart, dow, description, calories, status })
    },
    [weekStart, saveDay],
  )

  const handleAddItem = useCallback(
    (itemName: string) => {
      const maxOrder = (data?.items ?? []).reduce((m, i) => Math.max(m, i.item_order), -1)
      addItem.mutate({ weekStart, itemName, currentMaxOrder: maxOrder })
    },
    [weekStart, data?.items, addItem],
  )

  const handleUpdateItem = useCallback(
    (id: string, itemName: string) => {
      updateItem.mutate({ id, itemName, weekStart })
    },
    [weekStart, updateItem],
  )

  const handleToggleItem = useCallback(
    (id: string, checked: boolean) => {
      toggleItem.mutate({ id, checked, weekStart })
    },
    [weekStart, toggleItem],
  )

  const handleDeleteItem = useCallback(
    (id: string) => {
      deleteItem.mutate({ id, weekStart })
    },
    [weekStart, deleteItem],
  )

  const handleClearChecked = useCallback(() => {
    if (!data?.plan) return
    clearChecked.mutate({ planId: data.plan.id, weekStart })
  }, [data?.plan, weekStart, clearChecked])

  const handleAgentSuggest = () => {
    pushToast({
      kind: 'info',
      title: 'Agent unavailable',
      description: 'Meal week suggestion will be available after agent setup.',
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <ScreenHeader
        title="Meal Prep"
        icon={<CookingPot size={22} weight="light" className="text-accent" aria-hidden="true" />}
        right={<AgentButton label="SUGGEST WEEK" onClick={handleAgentSuggest} />}
      />

      {/* ── Week picker ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
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

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Panel A — Weekly Plan */}
          <Panel eyebrow="WEEKLY PLAN">
            <WeekPlan
              data={data ?? { plan: null, days: [], items: [] }}
              weekStart={weekStart}
              onSaveDay={handleSaveDay}
            />
          </Panel>

          {/* Panel B — Shopping List */}
          <Panel eyebrow="SHOPPING LIST">
            <ShoppingList
              items={data?.items ?? []}
              planId={data?.plan?.id ?? null}
              onToggle={handleToggleItem}
              onAdd={handleAddItem}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onClearChecked={handleClearChecked}
            />
          </Panel>
        </div>
      )}
    </>
  )
}
