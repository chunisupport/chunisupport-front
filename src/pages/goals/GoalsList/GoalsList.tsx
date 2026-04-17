import { useNavigate } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, Show } from 'solid-js'
import { createGoal, deleteGoal, fetchGoals, updateGoal } from '../../../api/goals'
import { fetchAllSongs, fetchMasterData } from '../../../api/songs'
import { fetchMe, fetchUserProfileSummary, fetchUserRecord } from '../../../api/users'
import { Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { GoalCreateRequest, GoalDTO, GoalUpdateRequest } from '../../../types/api'
import { calculateGoalProgress, filterRecordsByAttributes } from '../utils/goalProgress'
import GoalCard from './components/GoalCard'
import GoalDeleteDialog from './components/GoalDeleteDialog'
import GoalFormDialog from './components/GoalFormDialog'

const GoalsList: Component = () => {
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = createSignal(0)

  const [formOpen, setFormOpen] = createSignal(false)
  const [deleteOpen, setDeleteOpen] = createSignal(false)
  const [editingGoal, setEditingGoal] = createSignal<GoalDTO | undefined>(undefined)
  const [deletingGoal, setDeletingGoal] = createSignal<GoalDTO | undefined>(undefined)
  const [isSaving, setIsSaving] = createSignal(false)
  const [isDeleting, setIsDeleting] = createSignal(false)
  const [actionError, setActionError] = createSignal('')

  const [resource] = createResource(
    () => refreshKey(),
    async () => {
      const me = await fetchMe().catch((error: Error & { status?: number }) => {
        if (error?.status === 401) {
          navigate('/login', { replace: true })
        }
        throw error
      })

      const [goalsResponse, songsResponse, masterData, profile, record] = await Promise.all([
        fetchGoals(),
        fetchAllSongs(),
        fetchMasterData(),
        fetchUserProfileSummary(me.username),
        fetchUserRecord(me.username, { includeNoPlay: true }),
      ])

      if (!profile.player) {
        return {
          noPlayerData: true,
          goals: goalsResponse.goals,
          songs: songsResponse.songs,
          masterData,
          records: [],
        }
      }

      return {
        noPlayerData: false,
        goals: goalsResponse.goals,
        songs: songsResponse.songs,
        masterData,
        records: record.all,
      }
    }
  )

  const goalWithProgress = createMemo(() => {
    const data = resource()
    if (!data) return []

    return data.goals.map((goal) => {
      const filtered = filterRecordsByAttributes(
        data.records,
        goal.attributes,
        data.masterData,
        data.songs
      )
      const progress = calculateGoalProgress(goal, filtered, data.songs)
      return { goal, progress }
    })
  })

  const resolveAllCount = (attributes: GoalCreateRequest['attributes']) => {
    const data = resource()
    if (!data) return 0
    return filterRecordsByAttributes(data.records, attributes, data.masterData, data.songs).length
  }

  useDocumentTitle('目標')

  const openCreateDialog = () => {
    setEditingGoal(undefined)
    setActionError('')
    setFormOpen(true)
  }

  const handleEdit = (goal: GoalDTO) => {
    setEditingGoal(goal)
    setActionError('')
    setFormOpen(true)
  }

  const handleDeleteAsk = (goal: GoalDTO) => {
    setDeletingGoal(goal)
    setActionError('')
    setDeleteOpen(true)
  }

  const handleSave = async (payload: GoalCreateRequest | GoalUpdateRequest) => {
    setActionError('')
    setIsSaving(true)
    try {
      const goal = editingGoal()
      if (goal) {
        await updateGoal(goal.id, payload)
      } else {
        await createGoal(payload)
      }
      setFormOpen(false)
      setEditingGoal(undefined)
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '保存に失敗しました。')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    const goal = deletingGoal()
    if (!goal) return

    setActionError('')
    setIsDeleting(true)
    try {
      await deleteGoal(goal.id)
      setDeleteOpen(false)
      setDeletingGoal(undefined)
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '削除に失敗しました。')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ErrorBoundary fallback={(err) => <p class="p-4 text-red-500">ERROR: {err.message}</p>}>
      <Show when={!resource.loading} fallback={<Loading />}>
        <Show when={!resource()?.noPlayerData} fallback={<PlayerDataEmptyState />}>
          <div class="mx-auto w-full max-w-3xl p-4 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h1 class="text-2xl font-semibold">目標</h1>
                <p class="text-sm text-gray-600">{resource()?.goals.length ?? 0} / 100件</p>
              </div>
              <button
                type="button"
                class="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                disabled={(resource()?.goals.length ?? 0) >= 100}
                onClick={openCreateDialog}
              >
                目標を追加
              </button>
            </div>

            <Show when={(resource()?.goals.length ?? 0) >= 100}>
              <p class="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                目標は100件まで作成できます。不要な目標を削除してください。
              </p>
            </Show>

            <Show when={actionError()}>
              <p class="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
                {actionError()}
              </p>
            </Show>

            <Show
              when={goalWithProgress().length > 0}
              fallback={
                <p class="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
                  目標がありません。「目標を追加」から作成してください。
                </p>
              }
            >
              <div class="grid grid-cols-1 gap-3">
                {goalWithProgress().map(({ goal, progress }) => {
                  const data = resource()
                  if (!data) return null

                  return (
                    <GoalCard
                      goal={goal}
                      progress={progress}
                      masterData={data.masterData}
                      onEdit={handleEdit}
                      onDelete={handleDeleteAsk}
                    />
                  )
                })}
              </div>
            </Show>
          </div>

          <Show when={resource()}>
            {(data) => (
              <GoalFormDialog
                open={formOpen()}
                mode={editingGoal() ? 'edit' : 'create'}
                initialGoal={editingGoal()}
                masterData={data().masterData}
                isSaving={isSaving()}
                onOpenChange={setFormOpen}
                onSave={handleSave}
                resolveAllCount={resolveAllCount}
              />
            )}
          </Show>

          <GoalDeleteDialog
            open={deleteOpen()}
            goal={deletingGoal()}
            isDeleting={isDeleting()}
            onOpenChange={setDeleteOpen}
            onConfirm={() => {
              void handleDelete()
            }}
          />
        </Show>
      </Show>
    </ErrorBoundary>
  )
}

export default GoalsList
