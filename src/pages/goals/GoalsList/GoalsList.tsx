import { useNavigate } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, For, Show } from 'solid-js'
import { createGoal, deleteGoal, fetchGoals, updateGoal } from '../../../api/goals'
import { fetchAllSongs, fetchMasterData, fetchVersions } from '../../../api/songs'
import { fetchMe, fetchUserProfileSummary, fetchUserRecord } from '../../../api/users'
import { Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { GoalCreateRequest, GoalDTO, GoalUpdateRequest } from '../../../types/api'
import { calculateGoalProgress, filterRecordsByAttributes } from '../utils/goalProgress'
import GoalCard from './components/GoalCard'
import GoalDeleteDialog from './components/GoalDeleteDialog'
import GoalFormDialog from './components/GoalFormDialog'

const OVERPOWER_CHART_CONST_BONUS = 3
const OVERPOWER_CHART_MULTIPLIER = 5

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
  const [formError, setFormError] = createSignal('')

  const [resource] = createResource(
    () => refreshKey(),
    async () => {
      const me = await fetchMe().catch((error: Error & { status?: number }) => {
        if (error?.status === 401) {
          navigate('/login', { replace: true })
        }
        throw error
      })

      const [goalsResponse, songsResponse, masterData, versionData, profile, record] =
        await Promise.all([
          fetchGoals(),
          fetchAllSongs(),
          fetchMasterData(),
          fetchVersions(),
          fetchUserProfileSummary(me.username),
          fetchUserRecord(me.username, { includeNoPlay: true }),
        ])

      if (!profile.player) {
        return {
          noPlayerData: true,
          goals: goalsResponse.goals,
          songs: songsResponse.songs,
          masterData,
          versions: versionData.versions ?? [],
          records: [],
        }
      }

      return {
        noPlayerData: false,
        goals: goalsResponse.goals,
        songs: songsResponse.songs,
        masterData,
        versions: versionData.versions ?? [],
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
        data.songs,
        data.versions
      )
      const progress = calculateGoalProgress(goal, filtered, data.songs)
      return { goal, progress }
    })
  })

  const resolveAllCount = (attributes: GoalCreateRequest['attributes']) => {
    const data = resource()
    if (!data) return 0
    return filterRecordsByAttributes(
      data.records,
      attributes,
      data.masterData,
      data.songs,
      data.versions
    ).length
  }

  /**
   * 対象条件に一致する譜面ごとの固定定数から最大OVER POWER合計を算出する。
   *
   * @param attributes - 目標フォームで選択中の対象条件。
   * @returns 対象譜面それぞれの最大OVER POWERを合計した値。
   */
  const resolveOverPowerChartMax = (attributes: GoalCreateRequest['attributes']) => {
    const data = resource()
    if (!data) return 0
    return filterRecordsByAttributes(
      data.records,
      attributes,
      data.masterData,
      data.songs,
      data.versions
    ).reduce(
      (acc, record) =>
        acc + (record.const + OVERPOWER_CHART_CONST_BONUS) * OVERPOWER_CHART_MULTIPLIER,
      0
    )
  }

  useDocumentTitle('目標')

  const openCreateDialog = () => {
    setEditingGoal(undefined)
    setActionError('')
    setFormError('')
    setFormOpen(true)
  }

  const handleEdit = (goal: GoalDTO) => {
    setEditingGoal(goal)
    setActionError('')
    setFormError('')
    setFormOpen(true)
  }

  const handleDeleteAsk = (goal: GoalDTO) => {
    setDeletingGoal(goal)
    setActionError('')
    setDeleteOpen(true)
  }

  /**
   * 目標フォームダイアログの開閉状態を更新する。
   *
   * @param open - 次のダイアログ表示状態。
   * @returns なし。
   */
  const handleFormOpenChange = (open: boolean): void => {
    if (!open) {
      setFormError('')
    }
    setFormOpen(open)
  }

  const handleSave = async (payload: GoalCreateRequest | GoalUpdateRequest) => {
    setActionError('')
    setFormError('')
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
      setFormError(error instanceof Error ? error.message : '保存に失敗しました。')
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
    <ErrorBoundary fallback={(err) => <p class="p-4 text-danger">ERROR: {err.message}</p>}>
      <Show when={!resource.loading} fallback={<Loading />}>
        <Show when={!resource()?.noPlayerData} fallback={<PlayerDataEmptyState />}>
          <div class="mx-auto w-full max-w-3xl p-4 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h1 class="text-2xl font-semibold">目標</h1>
                <p class="text-sm text-text-muted">{resource()?.goals.length ?? 0} / 100件</p>
              </div>
              <button
                type="button"
                class="rounded bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover disabled:opacity-60"
                disabled={(resource()?.goals.length ?? 0) >= 100}
                onClick={openCreateDialog}
              >
                目標を追加
              </button>
            </div>

            <Show when={(resource()?.goals.length ?? 0) >= 100}>
              <p class="rounded border border-warning-border bg-warning-bg px-3 py-2 text-sm text-score-rank-c-text">
                目標は100件まで作成できます。不要な目標を削除してください。
              </p>
            </Show>

            <Show when={actionError()}>
              <p class="rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
                {actionError()}
              </p>
            </Show>

            <Show
              when={goalWithProgress().length > 0}
              fallback={
                <p class="rounded border border-border bg-surface p-4 text-sm text-text-muted">
                  目標がありません。「目標を追加」から作成してください。
                </p>
              }
            >
              <div class="grid grid-cols-1 gap-3">
                <For each={goalWithProgress()}>
                  {({ goal, progress }) => (
                    <GoalCard
                      goal={goal}
                      progress={progress}
                      onEdit={handleEdit}
                      onDelete={handleDeleteAsk}
                    />
                  )}
                </For>
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
                versions={data().versions}
                isSaving={isSaving()}
                apiErrorMessage={formError()}
                onOpenChange={handleFormOpenChange}
                onSave={handleSave}
                resolveAllCount={resolveAllCount}
                resolveOverPowerChartMax={resolveOverPowerChartMax}
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
