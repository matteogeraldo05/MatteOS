import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Plus } from '@phosphor-icons/react'
import Button from '../../ui/Button'
import EmptyState from '../../ui/EmptyState'
import ExerciseRow, { type ExerciseRowData } from './ExerciseRow'

// ─── Reorder helper ───────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface ExerciseListProps {
  exercises: ExerciseRowData[]
  onExercisesChange: (exercises: ExerciseRowData[]) => void
  readOnly?: boolean
}

export default function ExerciseList({ exercises, onExercisesChange, readOnly = false }: ExerciseListProps) {
  const [localList, setLocalList] = useState(exercises)
  useEffect(() => { setLocalList(exercises) }, [exercises])

  // ── Drag state ────────────────────────────────────────────────────────────
  const draggingKey    = useRef<string | null>(null)
  const [activeKey,  setActiveKey]  = useState<string | null>(null)
  const [overKey,    setOverKey]    = useState<string | null>(null)
  const [dropPos,    setDropPos]    = useState<'above' | 'below'>('below')

  const overKeyRef      = useRef<string | null>(null)
  const dropPosRef      = useRef<'above' | 'below'>('below')
  const onChangeRef     = useRef(onExercisesChange)
  const addListenersRef = useRef<() => void>(() => {})
  useLayoutEffect(() => { onChangeRef.current = onExercisesChange })

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
      document.removeEventListener('touchend',    onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
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
          onChangeRef.current(reordered)
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
  }, []) // intentionally empty: all state accessed via refs

  // ── Handlers ──────────────────────────────────────────────────────────────

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
      } as ExerciseRowData,
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
