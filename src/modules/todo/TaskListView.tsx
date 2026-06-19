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

  // ── Overdue local state ───────────────────────────────────────────────────
  const [localOverdueList, setLocalOverdueList] = useState(overdueInstances)
  useEffect(() => {
    setLocalOverdueList(overdueInstances)
  }, [overdueInstances])

  // ── Drag state (today) ────────────────────────────────────────────────────
  const draggingId     = useRef<string | null>(null)
  const [activeId,    setActiveId]    = useState<string | null>(null)
  const [overId,      setOverId]      = useState<string | null>(null)
  const [dropPos,     setDropPos]     = useState<'above' | 'below'>('below')

  // ── Drag state (overdue) ──────────────────────────────────────────────────
  const overdueDraggingId   = useRef<string | null>(null)
  const [overdueActiveId,   setOverdueActiveId]   = useState<string | null>(null)
  const [overdueOverId,     setOverdueOverId]     = useState<string | null>(null)
  const [overdueDropPos,    setOverdueDropPos]    = useState<'above' | 'below'>('below')

  // ── Touch-drag refs (keep doc-level handlers stable with empty-dep effect) ──
  const overIdRef       = useRef<string | null>(null)
  const dropPosRef      = useRef<'above' | 'below'>('below')
  const localListRef    = useRef(localList)
  const doUpdateOrder   = useRef(updateOrder.mutate)
  const addListenersRef = useRef<() => void>(() => {})
  localListRef.current  = localList          // always current
  doUpdateOrder.current = updateOrder.mutate // always current

  const overdueOverIdRef       = useRef<string | null>(null)
  const overdueDropPosRef      = useRef<'above' | 'below'>('below')
  const localOverdueListRef    = useRef(localOverdueList)
  const addOverdueListenersRef = useRef<() => void>(() => {})
  localOverdueListRef.current  = localOverdueList

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

  // ── Overdue mouse drag handlers ───────────────────────────────────────────
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
      document.removeEventListener('touchend',    onOverdueTouchEnd)
      document.removeEventListener('touchcancel', onOverdueTouchEnd)
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

    // Safety: remove any lingering listeners if the component unmounts mid-drag
    return () => {
      document.removeEventListener('touchmove',   onTouchMove)
      document.removeEventListener('touchend',    onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
      document.removeEventListener('touchmove',   onOverdueTouchMove)
      document.removeEventListener('touchend',    onOverdueTouchEnd)
      document.removeEventListener('touchcancel', onOverdueTouchEnd)
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
                  onDragEnd={resetOverdueDrag}
                  onGripTouchStart={(e) => handleOverdueGripTouchStart(e, id)}
                />
                <div className="border-b border-border-subtle mx-4" />
                {isOver && overdueDropPos === 'below' && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent z-20 pointer-events-none" />
                )}
              </div>
            )
          })}

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
