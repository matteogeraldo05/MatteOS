import { useState, useEffect, useRef } from 'react'
import { Barbell } from '@phosphor-icons/react'

import ScreenHeader from '../../ui/ScreenHeader'
import Panel from '../../ui/Panel'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'
import AgentButton from '../../shell/AgentButton'
import { useToast } from '../../ui/Toast'

import { toDateString } from '../../lib/dates'
import { getSuggestedSplit } from '../../lib/workoutRotation'
import {
  EXERCISE_PRESETS,
  SPLIT_LABELS,
  type WorkoutSplit,
} from './exercisePresets'
import {
  useRecentSessions,
  useLastSessionAnySplit,
  useUpsertSession,
  useDeleteSession,
  type WorkoutSession,
} from './queries'
import SplitPicker from './SplitPicker'
import ExerciseList from './ExerciseList'
import SessionHistoryRail from './SessionHistoryRail'
import type { ExerciseRowData } from './ExerciseRow'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build initial exercise rows from presets, optionally pre-filled from a previous session. */
function buildInitialExercises(
  split: WorkoutSplit,
  prevSession: WorkoutSession | undefined | null,
): ExerciseRowData[] {
  const presets = EXERCISE_PRESETS[split]
  const prevExByName = new Map(
    (prevSession?.workout_exercises ?? []).map((ex) => [ex.exercise_name, ex]),
  )
  return presets.map((preset, idx): ExerciseRowData => {
    const prevEx = prevExByName.get(preset.name)
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
    }
  })
}

/** Build exercise rows for editing an existing session, with hints from the session before it. */
function buildEditExercises(
  session: WorkoutSession,
  prevSession: WorkoutSession | undefined | null,
  split: WorkoutSplit,
): ExerciseRowData[] {
  const presetNames = new Set(EXERCISE_PRESETS[split].map((p) => p.name))
  const prevExByName = new Map(
    (prevSession?.workout_exercises ?? []).map((ex) => [ex.exercise_name, ex]),
  )
  return session.workout_exercises
    .slice()
    .sort((a, b) => a.exercise_order - b.exercise_order)
    .map((ex): ExerciseRowData => {
      const prevEx = prevExByName.get(ex.exercise_name)
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
      }
    })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const todayStr = toDateString(new Date())
  const { push: pushToast } = useToast()

  // ── Rotation: determine suggested split from last session ────────────
  const { data: lastAnySplit, isLoading: rotationLoading } = useLastSessionAnySplit()
  const [selectedSplit, setSelectedSplit] = useState<WorkoutSplit>('chest_triceps')
  const splitInitializedRef = useRef(false)

  // Set the suggested split once after rotation data loads
  useEffect(() => {
    if (!rotationLoading && !splitInitializedRef.current) {
      splitInitializedRef.current = true
      setSelectedSplit(getSuggestedSplit(lastAnySplit?.split ?? null))
    }
  }, [rotationLoading, lastAnySplit])

  const suggestedSplit = getSuggestedSplit(lastAnySplit?.split ?? null)

  // ── Session data for selected split ─────────────────────────────────
  const { data: recentSessions = [], isLoading: sessionsLoading } = useRecentSessions(selectedSplit, 10)
  const upsertSession = useUpsertSession()
  const deleteSession = useDeleteSession()

  // Determine today's session and the previous session
  const todaySession = recentSessions[0]?.session_date === todayStr ? recentSessions[0] : undefined
  const prevSession  = todaySession ? recentSessions[1] : recentSessions[0]

  // ── Form state ───────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false)
  const [exercises, setExercises] = useState<ExerciseRowData[]>([])
  const [sessionNotes, setSessionNotes] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  /**
   * A composite key that changes when:
   *  - The user picks a different split
   *  - A today session appears or disappears (e.g., after save or delete)
   * Tracked via a ref so we can detect changes without causing re-render loops.
   */
  const formKeyRef = useRef('')

  useEffect(() => {
    if (sessionsLoading) return

    const currentKey = `${selectedSplit}:${todaySession?.id ?? 'none'}`
    if (currentKey === formKeyRef.current) return
    formKeyRef.current = currentKey

    setSavedAt(null)

    if (todaySession) {
      // A session already exists for today — start in read-only mode
      setIsEditMode(false)
    } else {
      // No session yet — start in edit mode, pre-filled from last session
      setExercises(buildInitialExercises(selectedSplit, prevSession))
      setSessionNotes('')
      setIsEditMode(true)
    }
  // prevSession intentionally omitted: if the user is already editing, we don't want
  // a background refetch to reset their in-progress form.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSplit, sessionsLoading, todaySession])

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSplitChange = (split: WorkoutSplit) => {
    setSelectedSplit(split)
  }

  const handleEditSession = () => {
    if (todaySession) {
      setExercises(buildEditExercises(todaySession, recentSessions[1], selectedSplit))
      setSessionNotes(todaySession.notes ?? '')
    } else {
      setExercises(buildInitialExercises(selectedSplit, prevSession))
      setSessionNotes('')
    }
    setSavedAt(null)
    setIsEditMode(true)
  }

  const handleSaveSession = async () => {
    // Basic validation
    for (const ex of exercises) {
      if (!ex.exercise_name.trim()) {
        pushToast({ kind: 'danger', title: 'Validation error', description: 'All exercises need a name.' })
        return
      }
    }

    const exerciseInputs = exercises.map((ex, idx) => ({
      exercise_name: ex.exercise_name.trim(),
      exercise_order: idx,
      sets:       Math.max(1, Number(ex.sets)       || 1),
      reps:       Math.max(1, Number(ex.reps)       || 1),
      weight_lbs: Math.max(0, Number(ex.weight_lbs) || 0),
      notes: ex.notes.trim() || null,
    }))

    try {
      await upsertSession.mutateAsync({
        sessionDate: todayStr,
        split: selectedSplit,
        notes: sessionNotes.trim() || null,
        exercises: exerciseInputs,
      })

      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      setSavedAt(`${hh}:${mm}`)
      setIsEditMode(false)

      pushToast({ kind: 'success', title: 'Session saved' })
    } catch (err) {
      pushToast({
        kind: 'danger',
        title: 'Save failed',
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const handleDeleteSession = (id: string) => {
    deleteSession.mutate(id, {
      onError: (err) => {
        pushToast({
          kind: 'danger',
          title: 'Delete failed',
          description: err instanceof Error ? err.message : String(err),
        })
      },
    })
  }

  const handleAgentSuggest = () => {
    pushToast({
      kind: 'info',
      title: 'Agent unavailable',
      description: 'Workout progression suggestions will be available after agent setup.',
    })
  }

  // ── Derived render values ────────────────────────────────────────────
  const isLoading = rotationLoading || sessionsLoading

  // In read-only mode: prefer the freshly-loaded todaySession; fall back to
  // `exercises` (the just-saved state) while the refetch is in-flight.
  const readOnlyExercises: ExerciseRowData[] = todaySession
    ? todaySession.workout_exercises
        .slice()
        .sort((a, b) => a.exercise_order - b.exercise_order)
        .map((ex): ExerciseRowData => ({
          key: ex.id,
          exercise_name: ex.exercise_name,
          exercise_order: ex.exercise_order,
          sets: ex.sets,
          reps: ex.reps,
          weight_lbs: ex.weight_lbs,
          notes: ex.notes ?? '',
          isAdHoc: false,
        }))
    : exercises

  const displayExercises = isEditMode ? exercises : readOnlyExercises

  // Sessions to show in the history rail (exclude today's so there's no duplication)
  const historySessions = recentSessions.filter((s) => s.session_date !== todayStr)

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <ScreenHeader
        title="Workouts"
        icon={<Barbell size={22} weight="light" className="text-accent" aria-hidden="true" />}
        right={<AgentButton label="SUGGEST PROGRESSION" onClick={handleAgentSuggest} />}
      />

      {/* Split picker — only show once rotation is resolved */}
      {!rotationLoading && (
        <SplitPicker
          value={selectedSplit}
          onChange={handleSplitChange}
          suggestedSplit={suggestedSplit}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={20} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* ── Panel A — Today's session ─────────────────────── */}
          <Panel eyebrow="TODAY">

            {/* Date + split header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-[0.08em]">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-base text-text-primary font-medium mt-0.5">
                  {SPLIT_LABELS[selectedSplit]}
                </p>
              </div>

              {!isEditMode && (
                <div className="flex items-center gap-3">
                  {savedAt && (
                    <span className="text-xs text-text-muted">Session saved at {savedAt}</span>
                  )}
                  <Button variant="secondary" size="sm" onClick={handleEditSession}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Exercise list */}
            <ExerciseList
              exercises={displayExercises}
              onExercisesChange={setExercises}
              readOnly={!isEditMode}
            />

            {/* Save button (edit mode only) */}
            {isEditMode && (
              <div className="mt-5 flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSaveSession}
                  loading={upsertSession.isPending}
                >
                  Save session
                </Button>
              </div>
            )}
          </Panel>

          {/* ── Panel B — History rail ────────────────────────── */}
          <SessionHistoryRail
            sessions={historySessions}
            isLoading={false}
            onDelete={handleDeleteSession}
          />
        </div>
      )}
    </>
  )
}
