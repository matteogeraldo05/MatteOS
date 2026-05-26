import { useState, useEffect, useRef } from 'react'
import { Plus } from '@phosphor-icons/react'
import Spinner from '../../ui/Spinner'
import EmptyState from '../../ui/EmptyState'
import TaskRow from './TaskRow'
import { useToggleCompletion, useUpdateTaskOrder } from './queries'
import type { TodoTaskInstance } from './queries'

interface TaskListViewProps {
  instances: TodoTaskInstance[]
  overdueInstances?: TodoTaskInstance[]
  isLoading: boolean
  onTaskClick: (instance: TodoTaskInstance) => void
  onAddClick: () => void
}

// ─── Reorder helper ───────────────────────────────────────────────────────────

function reorder(
  list: TodoTaskInstance[],
  fromId: string,
  toId: string,
  position: 'above' | 'below',
): TodoTaskInstance[] {
  const result = [...list]
  const fromIdx = result.findIndex((i) => i.task.id === fromId)
  const toIdx   = result.findIndex((i) => i.task.id === toId)
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return list

  const [moved] = result.splice(fromIdx, 1)
  // Recalculate toIdx after removal
  const newToIdx = result.findIndex((i) => i.task.id === toId)
  const insertAt = position === 'above' ? newToIdx : newToIdx + 1
  result.splice(insertAt, 0, moved)
  return result
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskListView({
  instances,
  overdueInstances = [],
  isLoading,
  onTaskClick,
  onAddClick,
}: TaskListViewProps) {
  const toggle      = useToggleCompletion()
  const updateOrder = useUpdateTaskOrder()

  // ── Local order state (optimistic DnD) ────────────────────────────────────
  const [localList, setLocalList] = useState(instances)
  useEffect(() => {
    setLocalList(instances)
  }, [instances])

  // ── Drag state ────────────────────────────────────────────────────────────
  const draggingId     = useRef<string | null>(null)
  const [activeId,    setActiveId]    = useState<string | null>(null)   // row being dragged
  const [overId,      setOverId]      = useState<string | null>(null)   // row being hovered
  const [dropPos,     setDropPos]     = useState<'above' | 'below'>('below')

  // ── Touch-drag refs (keep doc-level handlers stable with empty-dep effect) ──
  const overIdRef       = useRef<string | null>(null)
  const dropPosRef      = useRef<'above' | 'below'>('below')
  const localListRef    = useRef(localList)
  const doUpdateOrder   = useRef(updateOrder.mutate)
  const addListenersRef = useRef<() => void>(() => {})
  localListRef.current  = localList          // always current
  doUpdateOrder.current = updateOrder.mutate // always current

  function handleDragStart(e: React.DragEvent, id: string) {
    draggingId.current = id
    setActiveId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id === draggingId.current) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const pos: 'above' | 'below' = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below'
    setOverId(id)
    setDropPos(pos)
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving to a non-child element
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setOverId(null)
    }
  }

  function handleDrop(e: React.DragEvent, toId: string) {
    e.preventDefault()
    const fromId = draggingId.current
    if (!fromId || fromId === toId) {
      resetDrag()
      return
    }

    const reordered = reorder(localList, fromId, toId, dropPos)
    setLocalList(reordered)
    resetDrag()

    // Persist new sort_order — assign 1000-spaced integers to all visible tasks
    const updates = reordered.map((inst, idx) => ({
      id:         inst.task.id,
      sort_order: (idx + 1) * 1000,
    }))
    updateOrder.mutate(updates)
  }

  function handleDragEnd() {
    resetDrag()
  }

  function resetDrag() {
    draggingId.current = null
    setActiveId(null)
    setOverId(null)
  }

  // ── Touch drag ──────────────────────────────────────────────────────────────
  function handleGripTouchStart(_e: React.TouchEvent, id: string) {
    draggingId.current = id
    overIdRef.current  = null
    setActiveId(id)
    setOverId(null)
    addListenersRef.current()  // attach non-passive doc listeners
  }

  useEffect(() => {
    // All handlers close over refs only → no stale state, empty dep array is safe.

    function onTouchMove(e: TouchEvent) {
      if (!draggingId.current) return
      e.preventDefault()   // stops page scroll while dragging

      const touch  = e.touches[0]
      const el     = document.elementFromPoint(touch.clientX, touch.clientY)
      const row    = el ? (el as HTMLElement).closest<HTMLElement>('[data-task-id]') : null
      const toId   = row?.dataset.taskId ?? null

      if (!toId || toId === draggingId.current) {
        overIdRef.current = null
        setOverId(null)
        return
      }

      const rect = row!.getBoundingClientRect()
      const pos: 'above' | 'below' =
        touch.clientY < rect.top + rect.height / 2 ? 'above' : 'below'

      overIdRef.current  = toId
      dropPosRef.current = pos
      setOverId(toId)
      setDropPos(pos)
    }

    function cleanup() {
      document.removeEventListener('touchmove',  onTouchMove)
      document.removeEventListener('touchend',   onTouchEnd)   // eslint-disable-line @typescript-eslint/no-use-before-define
      document.removeEventListener('touchcancel', onTouchEnd)  // eslint-disable-line @typescript-eslint/no-use-before-define
      draggingId.current = null
      overIdRef.current  = null
      setActiveId(null)
      setOverId(null)
    }

    function onTouchEnd() {
      const fromId = draggingId.current
      const toId   = overIdRef.current
      const pos    = dropPosRef.current
      cleanup()

      if (fromId && toId && toId !== fromId) {
        setLocalList(prev => {
          const reordered = reorder(prev, fromId, toId, pos)
          doUpdateOrder.current(
            reordered.map((inst, idx) => ({ id: inst.task.id, sort_order: (idx + 1) * 1000 })),
          )
          return reordered
        })
      }
    }

    addListenersRef.current = () => {
      document.addEventListener('touchmove',   onTouchMove, { passive: false })
      document.addEventListener('touchend',    onTouchEnd)
      document.addEventListener('touchcancel', onTouchEnd)
    }

    // Safety: remove any lingering listeners if the component unmounts mid-drag
    return () => {
      document.removeEventListener('touchmove',   onTouchMove)
      document.removeEventListener('touchend',    onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }
  }, []) // ← intentionally empty: all state is accessed via refs

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={20} />
      </div>
    )
  }

  const hasOverdue = overdueInstances.length > 0
  const hasToday   = localList.length > 0

  if (!hasOverdue && !hasToday) {
    return (
      <div className="py-12">
        <EmptyState
          message="No tasks scheduled for this day."
          ctaLabel="+ New task"
          onCta={onAddClick}
        />
      </div>
    )
  }

  return (
    <div>
      {/* ── OVERDUE section ──────────────────────────────────────────────── */}
      {hasOverdue && (
        <>
          {/* Section label */}
          <div className="px-4 pt-1 pb-1">
            <span className="text-2xs font-medium uppercase tracking-[0.08em] text-warning">
              Overdue
            </span>
          </div>

          {overdueInstances.map((instance) => (
            <div key={`overdue|${instance.task.id}`} className="relative">
              <TaskRow
                instance={instance}
                onToggle={(inst) => toggle.mutate(inst)}
                onClick={onTaskClick}
                togglePending={toggle.isPending}
                overdueDate={instance.task.start_date}
                showGrip={false}
              />
              <div className="border-b border-border-subtle mx-4" />
            </div>
          ))}

          {/* Thicker divider between OVERDUE and TODAY */}
          <div className="border-b border-border-default mx-0 mt-1 mb-1" />
        </>
      )}

      {/* ── TODAY section ─────────────────────────────────────────────────── */}
      {hasOverdue && hasToday && (
        <div className="px-4 pt-1 pb-1">
          <span className="text-2xs font-medium uppercase tracking-[0.08em] text-text-muted">
            Today
          </span>
        </div>
      )}

      {localList.map((instance) => {
        const id = instance.task.id
        const isDragging = id === activeId
        const isOver     = id === overId && id !== activeId

        return (
          <div key={`${id}|${instance.date}`} data-task-id={id} className="relative">
            {/* Drop indicator — above */}
            {isOver && dropPos === 'above' && (
              <div className="absolute top-0 left-4 right-4 h-0.5 bg-accent z-20 pointer-events-none" />
            )}

            <TaskRow
              instance={instance}
              onToggle={(inst) => toggle.mutate(inst)}
              onClick={onTaskClick}
              togglePending={toggle.isPending}
              isDragging={isDragging}
              onDragStart={(e) => handleDragStart(e, id)}
              onDragOver={(e) => handleDragOver(e, id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, id)}
              onDragEnd={handleDragEnd}
              onGripTouchStart={(e) => handleGripTouchStart(e, id)}
            />

            {/* Hairline separator */}
            <div className="border-b border-border-subtle mx-4" />

            {/* Drop indicator — below */}
            {isOver && dropPos === 'below' && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent z-20 pointer-events-none" />
            )}
          </div>
        )
      })}

      {/* ── "+ add task" row ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onAddClick}
        className="
          w-full flex items-center gap-2 px-4 py-3
          border border-dashed border-border-default rounded-none
          text-sm text-text-muted hover:text-text-secondary hover:border-border-strong
          transition-colors duration-[120ms] ease-out cursor-pointer
          mt-1
        "
      >
        <Plus size={14} weight="regular" aria-hidden="true" />
        add task
      </button>
    </div>
  )
}
