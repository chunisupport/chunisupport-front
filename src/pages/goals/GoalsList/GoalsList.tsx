import { Button } from '@kobalte/core/button'
import { useNavigate } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, For, Show } from 'solid-js'
import { createGoal, deleteGoal, fetchGoals, updateGoal } from '../../../api/goals'
import { fetchMasterData, fetchVersions } from '../../../api/songs'
import { fetchMe, fetchUserProfileSummary } from '../../../api/users'
import { LoadError, Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { saveStandardRecordFilterSetting } from '../../../repositories/viewSettingsRepository'
import type { GoalCreateRequest, GoalDTO, GoalUpdateRequest } from '../../../types/api'
import { fetchAllSongsWithCache } from '../../../usecases/cache/fetchAllSongsWithCache'
import { fetchUserRecordWithCache } from '../../../usecases/cache/fetchUserRecordWithCache'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { buildUserProfilePagePath } from '../../users/UserPage/profilePageQuery'
import { calculateGoalOverPowerChartMax } from '../utils/goalOverPower'
import { calculateGoalProgress, filterRecordsByAttributes } from '../utils/goalProgress'
import { buildGoalRecordFilter } from '../utils/goalRecordFilter'
import GoalCard from './components/GoalCard'
import GoalDeleteDialog from './components/GoalDeleteDialog'
import GoalFormDialog from './components/GoalFormDialog'

const RECORD_NAVIGATION_ERROR_MESSAGE = '未達成レコードの表示に失敗しました。'

/**
 * OP対象のOVER POWER目標で曲内最大値を使うべきか判定する。
 *
 * @param goal - 判定対象の目標。
 * @returns OP対象かつOVER POWER系の目標ならtrue。
 */
const shouldUseOpTargetSongAggregation = (
  goal: Pick<GoalCreateRequest, 'achievement_type' | 'attributes'>
): boolean =>
  goal.attributes.chart_target === 'OP_TARGET' &&
  (goal.achievement_type === 'overpower_value' || goal.achievement_type === 'overpower_percent')

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
          fetchAllSongsWithCache(),
          fetchMasterData(),
          fetchVersions(),
          fetchUserProfileSummary(me.username),
          fetchUserRecordWithCache(me.username),
        ])

      if (!profile.player) {
        return {
          username: me.username,
          noPlayerData: true,
          goals: goalsResponse.goals,
          songs: songsResponse.songs,
          masterData,
          versions: versionData.versions ?? [],
          records: [],
        }
      }

      return {
        username: me.username,
        noPlayerData: false,
        goals: goalsResponse.goals,
        songs: songsResponse.songs,
        masterData,
        versions: versionData.versions ?? [],
        records: record.standard,
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
        data.versions,
        { includeAllChartsForOpTarget: shouldUseOpTargetSongAggregation(goal) }
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

  const resolveOverPowerChartMax = (attributes: GoalCreateRequest['attributes']) => {
    const data = resource()
    if (!data) return 0
    const filteredRecords = filterRecordsByAttributes(
      data.records,
      attributes,
      data.masterData,
      data.songs,
      data.versions,
      { includeAllChartsForOpTarget: attributes.chart_target === 'OP_TARGET' }
    )
    return calculateGoalOverPowerChartMax(filteredRecords, data.songs, attributes)
  }

  /**
   * 目標フォームの下書き内容から現在のプレイヤーレコードに基づく進捗を算出する。
   *
   * @param draftGoal - フォーム入力中の目標内容。
   * @returns 実際の目標カードと同じ計算で作った進捗情報。
   */
  const resolveDraftGoalProgress = (draftGoal: GoalCreateRequest) => {
    const data = resource()
    if (!data) {
      return {
        current: 0,
        target: 1,
        percent: 0,
        achieved: false,
        hasUnknownMaxOp: false,
      }
    }

    const filtered = filterRecordsByAttributes(
      data.records,
      draftGoal.attributes,
      data.masterData,
      data.songs,
      data.versions,
      { includeAllChartsForOpTarget: shouldUseOpTargetSongAggregation(draftGoal) }
    )

    return calculateGoalProgress(
      {
        ...draftGoal,
        id: 0,
        created_at: '',
      },
      filtered,
      data.songs
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
   * 目標の未達成条件を保存し、ログインユーザーの通常レコード画面へ遷移する。
   *
   * @param goal - フィルターへ変換する目標。
   * @returns 保存と遷移の完了後に解決される Promise。
   */
  const handleOpenUnachievedRecords = async (goal: GoalDTO): Promise<void> => {
    const data = resource()
    if (!data) return

    setActionError('')
    try {
      const filter = buildGoalRecordFilter(goal, data.masterData, data.versions)
      await saveStandardRecordFilterSetting(filter)
      navigate(buildUserProfilePagePath(data.username, 'record_normal'))
    } catch (error) {
      setActionError(toUserFriendlyErrorMessage(error, RECORD_NAVIGATION_ERROR_MESSAGE))
    }
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
      setFormError(toUserFriendlyErrorMessage(error, '保存に失敗しました。'))
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
      setActionError(toUserFriendlyErrorMessage(error, '削除に失敗しました。'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
      <Show when={!resource.error} fallback={<LoadError error={resource.error} />}>
        <Show when={!resource.loading} fallback={<Loading />}>
          <Show when={!resource()?.noPlayerData} fallback={<PlayerDataEmptyState />}>
            <div class="mx-auto w-full max-w-3xl p-4 space-y-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h1 class="text-2xl font-semibold">目標</h1>
                  <p class="text-sm text-text-muted">{resource()?.goals.length ?? 0} / 100件</p>
                </div>
                <Button
                  type="button"
                  class="rounded bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover disabled:opacity-60"
                  disabled={(resource()?.goals.length ?? 0) >= 100}
                  onClick={openCreateDialog}
                >
                  目標を追加
                </Button>
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
                        onOpenRecords={(selectedGoal) => {
                          void handleOpenUnachievedRecords(selectedGoal)
                        }}
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
                  resolveDraftGoalProgress={resolveDraftGoalProgress}
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
      </Show>
    </ErrorBoundary>
  )
}

export default GoalsList
