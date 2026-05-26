import { useState } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import NumberInput from '../../ui/NumberInput'
import { useUpsertMeal, type FoodLogMeal } from './queries'
import { useToast } from '../../ui/Toast'
import { callAgent } from '../../agent/client'

interface MealFormProps {
  open: boolean
  onClose: () => void
  date: string
  /** If provided, we are editing an existing meal */
  existingMeal?: FoodLogMeal | null
  /** The next meal_order to use when inserting a new meal */
  nextOrder: number
}

export default function MealForm({
  open,
  onClose,
  date,
  existingMeal,
  nextOrder,
}: MealFormProps) {
  const isEdit = !!existingMeal

  const [description, setDescription] = useState(existingMeal?.description ?? '')
  const [calories, setCalories] = useState<number | ''>(existingMeal?.calories ?? '')
  const [aiEstimated, setAiEstimated] = useState(existingMeal?.ai_estimated ?? false)
  const [estimating, setEstimating] = useState(false)
  const [errors, setErrors] = useState<{ description?: string; calories?: string }>({})

  const upsertMeal = useUpsertMeal()
  const { push } = useToast()

  // Reset form state when modal opens/closes or editing target changes
  function resetForm() {
    setDescription(existingMeal?.description ?? '')
    setCalories(existingMeal?.calories ?? '')
    setAiEstimated(existingMeal?.ai_estimated ?? false)
    setErrors({})
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  // ── Validate ─────────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!description.trim()) errs.description = 'Description is required'
    if (calories === '' || calories < 0) errs.calories = 'Enter calories (0 or more)'
    if (typeof calories === 'number' && calories > 5000)
      errs.calories = 'Max 5000 kcal per meal'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── AI Estimate ──────────────────────────────────────────────────────────────

  async function handleEstimate() {
    if (!description.trim()) {
      setErrors((prev) => ({ ...prev, description: 'Enter a description first' }))
      return
    }
    setEstimating(true)
    try {
      const result = await callAgent<{ description: string }, { calories: number }>({
        module: 'food.estimate',
        payload: { description: description.trim() },
      })

      if (result.ok && result.data) {
        setCalories(result.data.calories)
        setAiEstimated(true)
        push({ kind: 'success', title: `Estimated: ${result.data.calories} kcal` })
      } else {
        // Pre-Phase 11: endpoint returns 503 → agent_disabled error
        push({
          kind: 'info',
          title: 'Estimation unavailable yet — enter calories manually',
        })
      }
    } catch {
      push({
        kind: 'info',
        title: 'Estimation unavailable yet — enter calories manually',
      })
    } finally {
      setEstimating(false)
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validate()) return

    upsertMeal.mutate(
      {
        date,
        meal: {
          id: existingMeal?.id,
          description: description.trim(),
          calories: calories as number,
          ai_estimated: aiEstimated,
          meal_order: existingMeal?.meal_order ?? nextOrder,
        },
      },
      {
        onSuccess: () => {
          push({ kind: 'success', title: isEdit ? 'Meal updated' : 'Meal added' })
          handleClose()
        },
        onError: (err) => {
          push({ kind: 'danger', title: 'Failed to save meal', description: String(err) })
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit meal' : 'Add meal'}
    >
      <div className="flex flex-col gap-4">
        {/* Description */}
        <Input
          label="Description"
          value={description}
          onChange={(v) => {
            setDescription(v)
            setAiEstimated(false)
            if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }))
          }}
          placeholder="e.g. Chicken breast with rice"
          error={errors.description}
        />

        {/* Calories + Estimate button */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text-secondary uppercase tracking-[0.06em]">Calories</span>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <NumberInput
                value={calories}
                onChange={(v) => {
                  setCalories(v)
                  setAiEstimated(false)
                  if (errors.calories) setErrors((prev) => ({ ...prev, calories: undefined }))
                }}
                min={0}
                max={5000}
                placeholder="kcal"
                error={errors.calories}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEstimate}
              loading={estimating}
              disabled={estimating}
            >
              ESTIMATE
            </Button>
          </div>
          {aiEstimated && (
            <span
              className="inline-flex items-center self-start text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-sm"
              style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-hover)' }}
            >
              AI
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={upsertMeal.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={upsertMeal.isPending}
          >
            {isEdit ? 'Save changes' : 'Add meal'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
