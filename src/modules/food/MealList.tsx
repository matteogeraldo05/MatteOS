import { useState } from 'react'
import { PencilSimple, Trash } from '@phosphor-icons/react'
import IconButton from '../../ui/IconButton'
import ConfirmDialog from '../../ui/ConfirmDialog'
import EmptyState from '../../ui/EmptyState'
import { useDeleteMeal, type FoodLogMeal } from './queries'
import { useToast } from '../../ui/Toast'
import MealForm from './MealForm'

interface MealListProps {
  meals: FoodLogMeal[]
  date: string
  onAddClick: () => void
}

export default function MealList({ meals, date, onAddClick }: MealListProps) {
  const deleteMeal = useDeleteMeal()
  const { push } = useToast()

  const [editingMeal, setEditingMeal] = useState<FoodLogMeal | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDeleteConfirm() {
    if (!deletingId) return
    deleteMeal.mutate(
      { id: deletingId, date },
      {
        onSuccess: () => {
          push({ kind: 'success', title: 'Meal deleted' })
          setDeletingId(null)
        },
        onError: (err) => {
          push({ kind: 'danger', title: 'Failed to delete meal', description: String(err) })
          setDeletingId(null)
        },
      },
    )
  }

  if (meals.length === 0) {
    return (
      <EmptyState
        message="No meals logged yet — add your first meal."
        ctaLabel="Add meal"
        onCta={onAddClick}
      />
    )
  }

  return (
    <>
      <ul className="divide-y divide-border-subtle">
        {meals.map((meal) => (
          <li
            key={meal.id}
            className="flex items-start gap-3 py-3 group hover:bg-bg-hover transition-colors duration-[120ms]"
          >
            {/* Description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary leading-snug line-clamp-2">
                {meal.description}
              </p>
              {meal.ai_estimated && (
                <span
                  className="inline-flex items-center mt-1 text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-sm"
                  style={{
                    background: 'var(--color-accent-soft)',
                    color: 'var(--color-accent-hover)',
                  }}
                >
                  AI
                </span>
              )}
            </div>

            {/* Calories */}
            <span className="text-sm font-medium text-text-primary tabular-nums whitespace-nowrap flex-shrink-0 pt-0.5">
              {meal.calories} kcal
            </span>

            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms] flex-shrink-0">
              <IconButton
                label="Edit meal"
                onClick={() => setEditingMeal(meal)}
              >
                <PencilSimple size={14} weight="regular" aria-hidden="true" />
              </IconButton>
              <IconButton
                label="Delete meal"
                onClick={() => setDeletingId(meal.id)}
              >
                <Trash size={14} weight="regular" aria-hidden="true" />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      {/* Edit form */}
      <MealForm
        open={!!editingMeal}
        onClose={() => setEditingMeal(null)}
        date={date}
        existingMeal={editingMeal}
        nextOrder={meals.length + 1}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deletingId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
        message="Delete this meal entry? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteMeal.isPending}
      />
    </>
  )
}
