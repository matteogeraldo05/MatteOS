# Seven Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 7 cross-module improvements: typeable rocker inputs, sleep week navigation, todo overdue DnD, body module overhaul, mobile overflow fixes, workouts overhaul, and merge meal prep into food.

**Architecture:** Each fix is self-contained to 1–3 files; no new routes are added (one is removed). Meal Prep components are reused in-place (moved, not rewritten). All state is local React; DB calls use existing mutation hooks.

**Tech Stack:** React 19 + TypeScript + Tailwind CSS v4 + Phosphor Icons + TanStack Query v5

---

## Task 1: RockerWheel → Typeable Input

**Files:**
- Modify: `src/modules/sleep/CycleCalculator.tsx` (lines 121–159)

The center `<div>` of `RockerWheel` becomes a controlled `<input type="text">`. A `draft` local state tracks the in-progress value; on blur/Enter it parses, clamps, and commits.

- [ ] **Step 1: Update `RockerWheel` component**

Replace the component (lines 122–159) with:

```tsx
interface RockerWheelProps {
  value: number; onChange: (v: number) => void
  min: number; max: number
  display: string; label: string
}

function RockerWheel({ value, onChange, min, max, display, label }: RockerWheelProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const inc = () => onChange(value >= max ? min : value + 1)
  const dec = () => onChange(value <= min ? max : value - 1)

  function commit(raw: string) {
    setDraft(null)
    const n = parseInt(raw, 10)
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
  }

  return (
    <div className="flex flex-col items-center gap-0.5" aria-label={label}>
      <button
        type="button" aria-label={`Increase ${label}`} onClick={inc}
        className="w-10 h-10 flex items-center justify-center rounded-md cursor-pointer
          text-text-secondary hover:text-text-primary hover:bg-bg-hover
          active:bg-bg-pressed transition-colors duration-[120ms] ease-out"
      >
        <CaretUp size={14} weight="bold" aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={draft ?? display}
        onFocus={(e) => { setDraft(display); e.target.select() }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur() }
          if (e.key === 'Escape') { setDraft(null); (e.target as HTMLInputElement).blur() }
        }}
        aria-live="polite" aria-atomic="true" aria-label={label}
        className="text-4xl font-bold tabular-nums text-text-primary leading-none py-1
          bg-transparent border-none outline-none text-center cursor-text select-all"
        style={{ minWidth: 52, width: 52 }}
      />
      <button
        type="button" aria-label={`Decrease ${label}`} onClick={dec}
        className="w-10 h-10 flex items-center justify-center rounded-md cursor-pointer
          text-text-secondary hover:text-text-primary hover:bg-bg-hover
          active:bg-bg-pressed transition-colors duration-[120ms] ease-out"
      >
        <CaretDown size={14} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}
```

Note: `useState` is already imported at the top of the file.

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

---

## Task 2: Sleep Week Navigation

**Files:**
- Modify: `src/modules/sleep/SleepPage.tsx`
- Modify: `src/modules/sleep/SleepChart.tsx`

Add `periodOffset` state (0 = current, positive = periods back). Derive `rangeStart`/`rangeEnd` from offset. Show nav row above the chart. Update SleepChart to accept an optional `rangeLabel` prop.

- [ ] **Step 1: Add period navigation to SleepPage.tsx**

Replace the top of `SleepPage` (lines 22–31, the `today`/`rangeStart`/`rangeEnd` block) and add a navigation row above the chart:

```tsx
// ── Period navigation ──────────────────────────────────────────────────────
const [periodOffset, setPeriodOffset] = useState(0)
const periodDays = isDesktop ? 30 : 7

const today = useMemo(() => new Date(), [])
const rangeEnd = useMemo(
  () => addDays(today, -periodOffset * periodDays),
  [today, periodOffset, periodDays],
)
const rangeStart = useMemo(
  () => addDays(rangeEnd, -(periodDays - 1)),
  [rangeEnd, periodDays],
)

const periodLabel = useMemo(() => {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(rangeStart)} – ${fmt(rangeEnd)}`
}, [rangeStart, rangeEnd])
```

Then add the nav row inside the `<div className="py-6">` section, before the Toggle:

```tsx
{/* Period navigation */}
<div className="flex items-center justify-between mb-4">
  <button
    type="button"
    onClick={() => setPeriodOffset((o) => o + 1)}
    aria-label="Previous period"
    className="w-8 h-8 flex items-center justify-center rounded-md
      text-text-secondary hover:text-text-primary hover:bg-bg-hover
      transition-colors duration-[120ms] ease-out cursor-pointer"
  >
    <CaretLeft size={14} weight="bold" aria-hidden="true" />
  </button>

  <div className="flex items-center gap-3">
    <span className="text-sm font-medium text-text-primary tabular-nums">
      {periodLabel}
    </span>
    {periodOffset > 0 && (
      <button
        type="button"
        onClick={() => setPeriodOffset(0)}
        className="text-xs text-accent hover:underline cursor-pointer"
      >
        Today
      </button>
    )}
  </div>

  <button
    type="button"
    onClick={() => setPeriodOffset((o) => Math.max(0, o - 1))}
    disabled={periodOffset === 0}
    aria-label="Next period"
    className="w-8 h-8 flex items-center justify-center rounded-md
      text-text-secondary hover:text-text-primary hover:bg-bg-hover
      transition-colors duration-[120ms] ease-out cursor-pointer
      disabled:opacity-30 disabled:cursor-not-allowed"
  >
    <CaretRight size={14} weight="bold" aria-hidden="true" />
  </button>
</div>
```

Add imports at top: `CaretLeft, CaretRight` from `@phosphor-icons/react`.

- [ ] **Step 2: Update SleepChart to accept optional rangeLabel prop**

In `SleepChart.tsx`, add `rangeLabel?: string` to `SleepChartProps` interface and use it:

```tsx
interface SleepChartProps {
  logs: SleepLog[]
  rangeStart: Date
  rangeEnd: Date
  goal: number
  rangeLabel?: string  // ← add this
  onBarClick: (date: string, log: SleepLog | null) => void
}
```

In the stats header, replace the computed `rangeLabel` const usage with the prop (fall back to computed):

```tsx
// Remove: const rangeLabel = daysInRange <= 7 ? 'LAST 7 DAYS' : `LAST ${daysInRange} DAYS`
// Replace usages with: rangeLabel ?? (daysInRange <= 7 ? '7 DAYS' : `${daysInRange} DAYS`)
```

In `SleepPage.tsx`, pass `rangeLabel` to `SleepChart`:
```tsx
<SleepChart
  logs={logs}
  rangeStart={rangeStart}
  rangeEnd={rangeEnd}
  goal={sleepGoal}
  rangeLabel={`${periodDays} DAYS`}
  onBarClick={openEdit}
/>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

---

## Task 3: Todo Overdue Drag-to-Reorder

**Files:**
- Modify: `src/modules/todo/TaskListView.tsx`

Add separate drag state for the overdue list. Mirror the same mouse+touch DnD pattern from today's list. Overdue and today sections never interact.

- [ ] **Step 1: Add overdue local state and drag state**

After the existing `const [localList, setLocalList] = useState(instances)` block (around line 51), add:

```tsx
// ── Overdue local state ────────────────────────────────────────────────
const [localOverdueList, setLocalOverdueList] = useState(overdueInstances)
useEffect(() => {
  setLocalOverdueList(overdueInstances)
}, [overdueInstances])

// ── Overdue drag state ─────────────────────────────────────────────────
const overdueDraggingId  = useRef<string | null>(null)
const [overdueActiveId,  setOverdueActiveId]  = useState<string | null>(null)
const [overdueOverId,    setOverdueOverId]    = useState<string | null>(null)
const [overdueDropPos,   setOverdueDropPos]   = useState<'above' | 'below'>('below')

const overdueOverIdRef    = useRef<string | null>(null)
const overdueDropPosRef   = useRef<'above' | 'below'>('below')
const localOverdueListRef = useRef(localOverdueList)
localOverdueListRef.current = localOverdueList

const addOverdueListenersRef = useRef<() => void>(() => {})
```

- [ ] **Step 2: Add overdue drag handlers (mouse)**

After `function resetDrag()` (around line 118), add:

```tsx
// ── Overdue mouse drag handlers ─────────────────────────────────────────
function handleOverdueDragStart(e: React.DragEvent, id: string) {
  overdueDraggingId.current = id
  setOverdueActiveId(id)
  e.dataTransfer.effectAllowed = 'move'
}

function handleOverdueDragOver(e: React.DragEvent, id: string) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  if (id === overdueDraggingId.current) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pos: 'above' | 'below' = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
  setOverdueOverId(id)
  setOverdueDropPos(pos)
}

function handleOverdueDragLeave(e: React.DragEvent) {
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
    setOverdueOverId(null)
  }
}

function handleOverdueDrop(e: React.DragEvent, toId: string) {
  e.preventDefault()
  const fromId = overdueDraggingId.current
  if (!fromId || fromId === toId) { resetOverdueDrag(); return }
  const reordered = reorder(localOverdueList, fromId, toId, overdueDropPos)
  setLocalOverdueList(reordered)
  resetOverdueDrag()
  const updates = reordered.map((inst, idx) => ({ id: inst.task.id, sort_order: (idx + 1) * 1000 }))
  updateOrder.mutate(updates)
}

function handleOverdueDragEnd() { resetOverdueDrag() }

function resetOverdueDrag() {
  overdueDraggingId.current = null
  setOverdueActiveId(null)
  setOverdueOverId(null)
}

function handleOverdueGripTouchStart(_e: React.TouchEvent, id: string) {
  overdueDraggingId.current = id
  overdueOverIdRef.current  = null
  setOverdueActiveId(id)
  setOverdueOverId(null)
  addOverdueListenersRef.current()
}
```

- [ ] **Step 3: Add overdue touch listeners in useEffect**

In the existing `useEffect(() => { ... }, [])`, after defining `addListenersRef.current`, add an overdue-specific touch handler block:

```tsx
// ── Overdue touch handlers ──────────────────────────────────────────────
function onOverdueTouchMove(e: TouchEvent) {
  if (!overdueDraggingId.current) return
  e.preventDefault()
  const touch = e.touches[0]
  const el    = document.elementFromPoint(touch.clientX, touch.clientY)
  const row   = el ? (el as HTMLElement).closest<HTMLElement>('[data-overdue-task-id]') : null
  const toId  = row?.dataset.overdueTaskId ?? null
  if (!toId || toId === overdueDraggingId.current) {
    overdueOverIdRef.current = null
    setOverdueOverId(null)
    return
  }
  const rect = row!.getBoundingClientRect()
  const pos: 'above' | 'below' = touch.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
  overdueOverIdRef.current  = toId
  overdueDropPosRef.current = pos
  setOverdueOverId(toId)
  setOverdueDropPos(pos)
}

function overdueCleanup() {
  document.removeEventListener('touchmove',   onOverdueTouchMove)
  document.removeEventListener('touchend',    onOverdueTouchEnd)   // eslint-disable-line @typescript-eslint/no-use-before-define
  document.removeEventListener('touchcancel', onOverdueTouchEnd)   // eslint-disable-line @typescript-eslint/no-use-before-define
  overdueDraggingId.current = null
  overdueOverIdRef.current  = null
  setOverdueActiveId(null)
  setOverdueOverId(null)
}

function onOverdueTouchEnd() {
  const fromId = overdueDraggingId.current
  const toId   = overdueOverIdRef.current
  const pos    = overdueDropPosRef.current
  overdueCleanup()
  if (fromId && toId && toId !== fromId) {
    setLocalOverdueList(prev => {
      const reordered = reorder(prev, fromId, toId, pos)
      doUpdateOrder.current(
        reordered.map((inst, idx) => ({ id: inst.task.id, sort_order: (idx + 1) * 1000 })),
      )
      return reordered
    })
  }
}

addOverdueListenersRef.current = () => {
  document.addEventListener('touchmove',   onOverdueTouchMove, { passive: false })
  document.addEventListener('touchend',    onOverdueTouchEnd)
  document.addEventListener('touchcancel', onOverdueTouchEnd)
}
```

Also update the cleanup return to remove overdue listeners:
```tsx
return () => {
  document.removeEventListener('touchmove',   onTouchMove)
  document.removeEventListener('touchend',    onTouchEnd)
  document.removeEventListener('touchcancel', onTouchEnd)
  document.removeEventListener('touchmove',   onOverdueTouchMove)
  document.removeEventListener('touchend',    onOverdueTouchEnd)
  document.removeEventListener('touchcancel', onOverdueTouchEnd)
}
```

- [ ] **Step 4: Update overdue section render**

Replace the `overdueInstances.map(...)` block with `localOverdueList.map(...)` and add drag support:

```tsx
{localOverdueList.map((instance) => {
  const id = instance.task.id
  const isDragging = id === overdueActiveId
  const isOver     = id === overdueOverId && id !== overdueActiveId
  return (
    <div key={`overdue|${id}`} data-overdue-task-id={id} className="relative">
      {isOver && overdueDropPos === 'above' && (
        <div className="absolute top-0 left-4 right-4 h-0.5 bg-accent z-20 pointer-events-none" />
      )}
      <TaskRow
        instance={instance}
        onToggle={(inst) => toggle.mutate(inst)}
        onClick={onTaskClick}
        togglePending={toggle.isPending}
        overdueDate={instance.task.start_date}
        showGrip={true}
        isDragging={isDragging}
        onDragStart={(e) => handleOverdueDragStart(e, id)}
        onDragOver={(e) => handleOverdueDragOver(e, id)}
        onDragLeave={handleOverdueDragLeave}
        onDrop={(e) => handleOverdueDrop(e, id)}
        onDragEnd={handleOverdueDragEnd}
        onGripTouchStart={(e) => handleOverdueGripTouchStart(e, id)}
      />
      <div className="border-b border-border-subtle mx-4" />
      {isOver && overdueDropPos === 'below' && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent z-20 pointer-events-none" />
      )}
    </div>
  )
})}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

---

## Task 4: Body Module Overhaul

**Files:**
- Modify: `src/modules/body/BodyPage.tsx`
- Modify: `src/ui/MetricCard.tsx` (add optional `subtext` prop)

Changes: (a) log weight via modal, (b) BMI/TDEE empty state → "—" + "Set up in Settings", (c) remove Recent Entries section, (d) "Weight (lbs)" label + integer rounding + remove "lbs" unit, (e) Person icon.

- [ ] **Step 1: Add `subtext` prop to MetricCard**

In `src/ui/MetricCard.tsx`, add `subtext?: string` to the interface and render it:

```tsx
interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  subtext?: string
  delta?: { value: number; direction: 'up' | 'down' | 'flat' }
}

export default function MetricCard({ label, value, unit, subtext, delta }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xs text-text-secondary uppercase tracking-[0.08em]">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-text-primary tabular-nums">{value}</span>
        {unit && <span className="text-base text-text-muted">{unit}</span>}
      </div>
      {subtext && (
        <span className="text-2xs text-text-muted">{subtext}</span>
      )}
      {delta && (
        <span className={`flex items-center gap-0.5 text-xs ${deltaColors[delta.direction]}`}>
          {deltaIcons[delta.direction]}
          {Math.abs(delta.value)}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Rewrite BodyPage.tsx**

Full replacement of `src/modules/body/BodyPage.tsx`:

```tsx
import { useState, useMemo } from 'react'
import { useWeightLogs } from './queries'
import { useAuth } from '../../auth/AuthProvider'
import { todayInTz } from '../../lib/dates'
import { Plus } from '@phosphor-icons/react'
import ScreenHeader from '../../ui/ScreenHeader'
import Panel from '../../ui/Panel'
import MetricCard from '../../ui/MetricCard'
import Toggle from '../../ui/Toggle'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'
import BodyCharts from './BodyCharts'
import BodyTable from './BodyTable'
import WeightLogForm from './WeightLogForm'

function PersonIcon() {
  return (
    <svg
      width={22} height={22} viewBox="0 0 256 256"
      fill="currentColor" aria-hidden="true"
      className="text-accent"
    >
      <path d="M128,40a32,32,0,1,0,32,32A32,32,0,0,0,128,40Zm0,56a24,24,0,1,1,24-24A24,24,0,0,1,128,96Zm48,24H80a24,24,0,0,0-24,24v48a8,8,0,0,0,16,0V144a8,8,0,0,1,8-8h96a8,8,0,0,1,8,8v48a8,8,0,0,0,16,0V144A24,24,0,0,0,176,120Z" />
    </svg>
  )
}

export default function BodyPage() {
  const { profile } = useAuth()
  const tz = profile?.timezone ?? 'UTC'
  const today = todayInTz(tz)

  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [logOpen, setLogOpen] = useState(false)

  const rangeEnd = useMemo(() => new Date(today + 'T00:00:00'), [today])
  const rangeStart = useMemo(() => {
    const d = new Date(rangeEnd)
    d.setDate(d.getDate() - 29)
    return d
  }, [rangeEnd])

  const { data: chartData = [], isLoading: chartLoading } = useWeightLogs(rangeStart, rangeEnd)

  const latest = chartData.length > 0 ? chartData[chartData.length - 1] : null
  const hasProfile = !!(profile?.height_cm && profile?.birth_date && profile?.sex)

  const weightDisplay = latest ? String(Math.round(latest.weight_lbs)) : '—'
  const bmiDisplay    = hasProfile && latest?.bmi != null ? latest.bmi.toFixed(1) : '—'
  const tdeeDisplay   = hasProfile && latest?.tdee != null ? Math.round(latest.tdee).toString() : '—'

  return (
    <>
      <ScreenHeader
        title="Body"
        icon={<PersonIcon />}
      />

      <Panel
        eyebrow="Body"
        right={
          <Toggle
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
          />
        }
      >
        {/* Metric cards row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MetricCard label="Weight (lbs)" value={weightDisplay} />
          <MetricCard
            label="BMI"
            value={bmiDisplay}
            subtext={!hasProfile ? 'Set up in Settings' : undefined}
          />
          <MetricCard
            label="TDEE"
            value={tdeeDisplay}
            unit={hasProfile && latest?.tdee != null ? 'kcal' : undefined}
            subtext={!hasProfile ? 'Set up in Settings' : undefined}
          />
        </div>

        {chartLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={20} />
          </div>
        ) : view === 'chart' ? (
          <BodyCharts data={chartData} hasProfile={hasProfile} />
        ) : (
          <BodyTable data={chartData} />
        )}
      </Panel>

      {/* Log Weight CTA */}
      <div className="py-6">
        <Button
          variant="primary"
          onClick={() => setLogOpen(true)}
          className="w-full h-12 text-base justify-center gap-2"
        >
          <Plus size={16} weight="bold" aria-hidden="true" />
          Log Weight
        </Button>
      </div>

      {/* Log Weight Modal */}
      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log weight"
      >
        <WeightLogForm onSaved={() => setLogOpen(false)} />
      </Modal>
    </>
  )
}
```

Note: removes `useRecentWeightLogs` import, `RecentWeightsList` import, and `recentData`/`recentLoading` queries entirely.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

---

## Task 5: Mobile Overflow Fixes

**Files:**
- Modify: `src/modules/todo/TaskForm.tsx` (duration row)
- Modify: `src/modules/body/WeightLogForm.tsx` (date+weight row in modal)
- Modify: `src/modules/workouts/ExerciseRow.tsx` (sets/reps/weight row)

- [ ] **Step 1: Fix TaskForm.tsx duration row**

Find the `<div className="flex gap-3">` wrapping the due time and duration fields (around line 146) and add `min-w-0` to each child:

```tsx
<div className="flex gap-3">
  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
    <label className="text-2xs text-text-muted uppercase tracking-[0.08em]">
      Due time <span className="normal-case text-text-muted">(optional)</span>
    </label>
    <input
      type="time"
      value={dueTime}
      onChange={(e) => setDueTime(e.target.value)}
      style={{ colorScheme: 'dark' }}
      className={inputClass}
    />
  </div>
  <div className="flex flex-col gap-1.5 min-w-0" style={{ width: 100 }}>
    <label className="text-2xs text-text-muted uppercase tracking-[0.08em]">
      Duration
    </label>
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        min={5}
        max={1440}
        step={5}
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className={inputClass + ' pr-8'}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
        min
      </span>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Fix WeightLogForm.tsx date+weight row**

Replace the `<div className="grid grid-cols-2 gap-3">` wrapper with a flex-wrap layout:

```tsx
<div className="flex flex-wrap gap-3">
  <div className="flex flex-col gap-1.5 flex-1 min-w-0" style={{ minWidth: 120 }}>
    <label className="text-2xs text-text-muted uppercase tracking-[0.08em]">Date</label>
    <DateInput
      value={date}
      onChange={(v) => setDate(v)}
      max={today}
    />
  </div>
  <div className="flex-1 min-w-0" style={{ minWidth: 120 }}>
    <NumberInput
      label="Weight (lbs)"
      value={weight}
      onChange={(v) => { setWeight(v); setError(undefined) }}
      min={0}
      max={999}
      step={0.1}
      placeholder="0.0"
      error={error}
    />
  </div>
</div>
```

- [ ] **Step 3: Fix ExerciseRow.tsx sets/reps/weight row**

Add `flex-wrap` to the row (around line 90):

```tsx
<div className="flex gap-3 items-end flex-wrap">
  <div className="min-w-0" style={{ width: 48 }}>
    <NumberInput label="Sets" value={data.sets} onChange={(v) => onChange({ ...data, sets: v })} min={1} max={20} step={1} />
  </div>
  <div className="min-w-0" style={{ width: 48 }}>
    <NumberInput label="Reps" value={data.reps} onChange={(v) => onChange({ ...data, reps: v })} min={1} max={100} step={1} />
  </div>
  <div className="min-w-0" style={{ width: 80 }}>
    <NumberInput label="Weight lbs" value={data.weight_lbs} onChange={(v) => onChange({ ...data, weight_lbs: v })} min={0} max={2000} step={0.5} />
  </div>
</div>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

---

## Task 6a: Workouts — Exercise Rename

**Files:**
- Modify: `src/modules/workouts/ExerciseRow.tsx`

Add a pencil `IconButton` for non-adhoc exercises in edit mode. Clicking it enables inline name editing for that session.

- [ ] **Step 1: Add rename state and PencilSimple import**

Add to imports: `PencilSimple` from `@phosphor-icons/react`.

Add inside the component (after `const [notesOpen, setNotesOpen] = useState(!!data.notes)`):
```tsx
const [isRenaming, setIsRenaming] = useState(false)
```

- [ ] **Step 2: Update name display section**

Replace the current name block (the `if (data.isAdHoc && !readOnly)` / else block, lines 48–56) with:

```tsx
<div className="flex-1 min-w-0">
  {data.isAdHoc && !readOnly ? (
    <Input
      value={data.exercise_name}
      onChange={(v) => onChange({ ...data, exercise_name: v })}
      placeholder="Exercise name"
    />
  ) : isRenaming && !readOnly ? (
    <Input
      value={data.exercise_name}
      onChange={(v) => onChange({ ...data, exercise_name: v })}
      onBlur={() => setIsRenaming(false)}
      autoFocus
    />
  ) : (
    <p className="text-base text-text-primary font-medium leading-snug">{data.exercise_name}</p>
  )}

  {hasHint && !isRenaming && (
    <p className="text-2xs text-text-muted mt-0.5 tabular-nums">
      last: {data.lastSets}×{data.lastReps} @ {data.lastWeightLbs} lbs
    </p>
  )}
</div>
```

Note: move the `hasHint` block inside the name div (it was previously below the entire `flex items-start` row).

- [ ] **Step 3: Add pencil button for preset exercises**

In the controls area (after the NotePencil notes-toggle button), add:

```tsx
{/* Rename preset exercise (edit mode only) */}
{!data.isAdHoc && !readOnly && (
  <IconButton label="Rename exercise" onClick={() => setIsRenaming((r) => !r)}>
    <PencilSimple
      size={14}
      weight={isRenaming ? 'fill' : 'regular'}
      className={isRenaming ? 'text-accent' : 'text-text-muted'}
    />
  </IconButton>
)}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

---

## Task 6b: Workouts — Previous Session Notes

**Files:**
- Modify: `src/modules/workouts/ExerciseRow.tsx` (add `lastNotes` to type + display)
- Modify: `src/modules/workouts/WorkoutsPage.tsx` (populate `lastNotes`)

- [ ] **Step 1: Add `lastNotes` to ExerciseRowData type**

In `ExerciseRow.tsx`, add to the type:

```tsx
export type ExerciseRowData = {
  // ... existing fields ...
  lastNotes?: string | null  // ← add this
}
```

- [ ] **Step 2: Display last note in edit mode**

In `ExerciseRow.tsx`, after the `hasHint` block, add a last-note display (only in edit mode, only when there's a note):

```tsx
{data.lastNotes && !readOnly && (
  <p className="text-2xs text-text-muted mt-0.5 italic">
    Last note: {data.lastNotes}
  </p>
)}
```

This goes inside the name div, after the `hasHint` block.

- [ ] **Step 3: Populate lastNotes in WorkoutsPage.tsx**

In `buildInitialExercises`, update the return to include `lastNotes`:

```tsx
return {
  key: preset.name,
  exercise_name: preset.name,
  exercise_order: idx,
  sets: prevEx?.sets ?? preset.sets,
  reps: prevEx?.reps ?? preset.reps,
  weight_lbs: prevEx?.weight_lbs ?? preset.weight_lbs,
  notes: '',
  isAdHoc: false,
  lastSets: prevEx?.sets,
  lastReps: prevEx?.reps,
  lastWeightLbs: prevEx?.weight_lbs,
  lastNotes: prevEx?.notes ?? null,  // ← add this
}
```

In `buildEditExercises`, update similarly:

```tsx
return {
  key: ex.id,
  exercise_name: ex.exercise_name,
  exercise_order: ex.exercise_order,
  sets: ex.sets,
  reps: ex.reps,
  weight_lbs: ex.weight_lbs,
  notes: ex.notes ?? '',
  isAdHoc: !presetNames.has(ex.exercise_name),
  lastSets: prevEx?.sets,
  lastReps: prevEx?.reps,
  lastWeightLbs: prevEx?.weight_lbs,
  lastNotes: prevEx?.notes ?? null,  // ← add this
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

---

## Task 6c: Workouts — Exercise Drag-to-Reorder

**Files:**
- Modify: `src/modules/workouts/ExerciseList.tsx`
- Modify: `src/modules/workouts/ExerciseRow.tsx` (add grip handle + drag props)

- [ ] **Step 1: Add GripHandle + drag props to ExerciseRow**

Add `GripHandle` SVG component at top of `ExerciseRow.tsx`:

```tsx
function GripHandle() {
  return (
    <svg
      width="12" height="16" viewBox="0 0 12 16" fill="none"
      aria-hidden="true"
      className="text-text-disabled flex-shrink-0 cursor-grab active:cursor-grabbing"
    >
      <circle cx="3"  cy="3.5"  r="1.3" fill="currentColor" />
      <circle cx="9"  cy="3.5"  r="1.3" fill="currentColor" />
      <circle cx="3"  cy="8"    r="1.3" fill="currentColor" />
      <circle cx="9"  cy="8"    r="1.3" fill="currentColor" />
      <circle cx="3"  cy="12.5" r="1.3" fill="currentColor" />
      <circle cx="9"  cy="12.5" r="1.3" fill="currentColor" />
    </svg>
  )
}
```

Add drag-related props to `ExerciseRowProps`:

```tsx
interface ExerciseRowProps {
  data: ExerciseRowData
  onChange: (updated: ExerciseRowData) => void
  onRemove?: () => void
  readOnly?: boolean
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  onGripTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void
}
```

Wrap the outer `<div>` of `ExerciseRow` to support dragging, and add the grip handle before the name section (only in edit mode):

```tsx
return (
  <div
    draggable={!readOnly}
    onDragStart={!readOnly ? onDragStart : undefined}
    onDragOver={!readOnly ? onDragOver : undefined}
    onDragLeave={!readOnly ? onDragLeave : undefined}
    onDrop={!readOnly ? onDrop : undefined}
    onDragEnd={!readOnly ? onDragEnd : undefined}
    className={`py-3 border-b border-border-subtle last:border-b-0 ${isDragging ? 'opacity-40' : ''}`}
  >
    {/* Name row with grip handle */}
    <div className="flex items-start gap-2 mb-2">
      {!readOnly && (
        <div
          onTouchStart={onGripTouchStart}
          onClick={(e) => e.stopPropagation()}
          className="touch-none flex-shrink-0 mt-1"
        >
          <GripHandle />
        </div>
      )}
      {/* ... rest of name/controls content ... */}
    </div>
    {/* ... sets/reps/weight and notes ... */}
  </div>
)
```

- [ ] **Step 2: Add drag-to-reorder logic to ExerciseList.tsx**

Full replacement of `ExerciseList.tsx`:

```tsx
import { useState, useEffect, useRef } from 'react'
import { Plus } from '@phosphor-icons/react'
import Button from '../../ui/Button'
import EmptyState from '../../ui/EmptyState'
import ExerciseRow, { type ExerciseRowData } from './ExerciseRow'

function reorder(list: ExerciseRowData[], fromKey: string, toKey: string, pos: 'above' | 'below'): ExerciseRowData[] {
  const result = [...list]
  const fromIdx = result.findIndex((ex) => ex.key === fromKey)
  const toIdx   = result.findIndex((ex) => ex.key === toKey)
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return list
  const [moved] = result.splice(fromIdx, 1)
  const newToIdx = result.findIndex((ex) => ex.key === toKey)
  result.splice(pos === 'above' ? newToIdx : newToIdx + 1, 0, moved)
  return result
}

interface ExerciseListProps {
  exercises: ExerciseRowData[]
  onExercisesChange: (exercises: ExerciseRowData[]) => void
  readOnly?: boolean
}

export default function ExerciseList({ exercises, onExercisesChange, readOnly = false }: ExerciseListProps) {
  const [localList, setLocalList] = useState(exercises)
  useEffect(() => { setLocalList(exercises) }, [exercises])

  const draggingKey    = useRef<string | null>(null)
  const [activeKey,  setActiveKey]  = useState<string | null>(null)
  const [overKey,    setOverKey]    = useState<string | null>(null)
  const [dropPos,    setDropPos]    = useState<'above' | 'below'>('below')
  const overKeyRef   = useRef<string | null>(null)
  const dropPosRef   = useRef<'above' | 'below'>('below')
  const localListRef = useRef(localList)
  localListRef.current = localList
  const addListenersRef = useRef<() => void>(() => {})

  function handleDragStart(e: React.DragEvent, key: string) {
    draggingKey.current = key
    setActiveKey(key)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, key: string) {
    e.preventDefault()
    if (key === draggingKey.current) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const pos: 'above' | 'below' = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
    setOverKey(key); setDropPos(pos)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setOverKey(null)
  }

  function handleDrop(e: React.DragEvent, toKey: string) {
    e.preventDefault()
    const fromKey = draggingKey.current
    if (!fromKey || fromKey === toKey) { resetDrag(); return }
    const reordered = reorder(localList, fromKey, toKey, dropPos)
    setLocalList(reordered)
    onExercisesChange(reordered)
    resetDrag()
  }

  function resetDrag() {
    draggingKey.current = null
    setActiveKey(null); setOverKey(null)
  }

  function handleGripTouchStart(_e: React.TouchEvent, key: string) {
    draggingKey.current = key
    overKeyRef.current = null
    setActiveKey(key); setOverKey(null)
    addListenersRef.current()
  }

  useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!draggingKey.current) return
      e.preventDefault()
      const touch = e.touches[0]
      const el  = document.elementFromPoint(touch.clientX, touch.clientY)
      const row = el ? (el as HTMLElement).closest<HTMLElement>('[data-ex-key]') : null
      const toKey = row?.dataset.exKey ?? null
      if (!toKey || toKey === draggingKey.current) { overKeyRef.current = null; setOverKey(null); return }
      const rect = row!.getBoundingClientRect()
      const pos: 'above' | 'below' = touch.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
      overKeyRef.current = toKey; dropPosRef.current = pos
      setOverKey(toKey); setDropPos(pos)
    }

    function cleanup() {
      document.removeEventListener('touchmove',   onTouchMove)
      document.removeEventListener('touchend',    onTouchEnd)   // eslint-disable-line @typescript-eslint/no-use-before-define
      document.removeEventListener('touchcancel', onTouchEnd)   // eslint-disable-line @typescript-eslint/no-use-before-define
      draggingKey.current = null; overKeyRef.current = null
      setActiveKey(null); setOverKey(null)
    }

    function onTouchEnd() {
      const fromKey = draggingKey.current
      const toKey   = overKeyRef.current
      const pos     = dropPosRef.current
      cleanup()
      if (fromKey && toKey && toKey !== fromKey) {
        setLocalList(prev => {
          const reordered = reorder(prev, fromKey, toKey, pos)
          onExercisesChange(reordered)
          return reordered
        })
      }
    }

    addListenersRef.current = () => {
      document.addEventListener('touchmove',   onTouchMove, { passive: false })
      document.addEventListener('touchend',    onTouchEnd)
      document.addEventListener('touchcancel', onTouchEnd)
    }

    return () => {
      document.removeEventListener('touchmove',   onTouchMove)
      document.removeEventListener('touchend',    onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (idx: number, updated: ExerciseRowData) => {
    const next = localList.map((ex, i) => (i === idx ? updated : ex))
    setLocalList(next)
    onExercisesChange(next)
  }

  const handleRemove = (idx: number) => {
    const next = localList.filter((_, i) => i !== idx)
    setLocalList(next)
    onExercisesChange(next)
  }

  const handleAddAdHoc = () => {
    const nextOrder = localList.length
    const next = [
      ...localList,
      {
        key: `adhoc-${Date.now()}`,
        exercise_name: '',
        exercise_order: nextOrder,
        sets: 3,
        reps: 8,
        weight_lbs: 0,
        notes: '',
        isAdHoc: true,
      },
    ]
    setLocalList(next)
    onExercisesChange(next)
  }

  if (!readOnly && localList.length === 0) {
    return (
      <div>
        <EmptyState message="No exercises yet." ctaLabel="Add exercise" onCta={handleAddAdHoc} />
      </div>
    )
  }

  return (
    <div>
      {localList.map((ex, idx) => {
        const isDragging = ex.key === activeKey
        const isOver     = ex.key === overKey && ex.key !== activeKey
        return (
          <div key={ex.key} data-ex-key={ex.key} className="relative">
            {isOver && dropPos === 'above' && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent z-20 pointer-events-none" />
            )}
            <ExerciseRow
              data={ex}
              onChange={(updated) => handleChange(idx, updated)}
              onRemove={() => handleRemove(idx)}
              readOnly={readOnly}
              isDragging={isDragging}
              onDragStart={(e) => handleDragStart(e, ex.key)}
              onDragOver={(e) => handleDragOver(e, ex.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, ex.key)}
              onDragEnd={resetDrag}
              onGripTouchStart={(e) => handleGripTouchStart(e, ex.key)}
            />
            {isOver && dropPos === 'below' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent z-20 pointer-events-none" />
            )}
          </div>
        )
      })}

      {!readOnly && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={handleAddAdHoc}>
            <span className="flex items-center gap-1.5">
              <Plus size={13} weight="bold" />
              Add exercise
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}
```

Note: `ExerciseList` now manages its own `localList` state for DnD and calls `onExercisesChange` immediately on reorder so `WorkoutsPage` always has current state.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

---

## Task 7: Merge Meal Prep into Food Module

**Files:**
- Modify: `src/modules/food/FoodPage.tsx` (add meal prep section)
- Modify: `src/App.tsx` (remove `/mealprep` route)
- Modify: `src/shell/Sidebar.tsx` (remove Meal Prep nav item)
- Modify: `src/shell/MobileNav.tsx` (remove Meal Prep nav item)

- [ ] **Step 1: Update FoodPage.tsx to include Meal Prep section**

Full replacement of `src/modules/food/FoodPage.tsx`:

```tsx
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

      <DayPicker date={date} onDateChange={setDate} />

      {/* ── Panel A — Today's log ──────────────────────────────────────────── */}
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
              options={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }]}
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

      {/* ── Meal Prep section ─────────────────────────────────────────────────── */}
      <div className="mt-6" id="meal-prep">
        {/* Section header with SUGGEST WEEK button */}
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

      {/* ── Floating add button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        aria-label="Add meal"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center
          bg-accent hover:bg-accent-hover shadow-lg transition-colors duration-[120ms] ease-out cursor-pointer"
      >
        <Plus size={24} weight="bold" className="text-white" aria-hidden="true" />
      </button>

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
```

- [ ] **Step 2: Remove `/mealprep` route from App.tsx**

In `src/App.tsx`:
- Remove: `import MealPrepPage from './modules/mealprep/MealPrepPage'`
- Remove: `<Route path="/mealprep" element={<MealPrepPage />} />`

- [ ] **Step 3: Remove Meal Prep from Sidebar.tsx**

Remove the `CookingPot` import and the Meal Prep item from `navItems`:
```tsx
// Remove from imports: CookingPot
// Remove from navItems:
{ label: 'Meal Prep', path: '/mealprep', icon: <CookingPot size={16} weight="light" aria-hidden="true" /> },
```

- [ ] **Step 4: Remove Meal Prep from MobileNav.tsx**

Same as Sidebar — remove `CookingPot` import and Meal Prep nav item.

- [ ] **Step 5: Verify build and lint**

```bash
npm run build && npm run lint
```

---

## Final Verification

- [ ] **Run build**

```bash
npm run build
```

Expected: 0 TypeScript errors, 0 build errors.

- [ ] **Run lint**

```bash
npm run lint
```

Expected: 0 errors (warnings acceptable).
