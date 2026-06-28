import { useNavigate } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, Show } from 'solid-js'
import { LoadError, Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { saveStandardRecordFilterSetting } from '../../../repositories/viewSettingsRepository'
import type { GoalCreateRequest, GoalDTO, GoalUpdateRequest } from '../../../types/api'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { buildUserProfilePagePath } from '../../users/UserPage/profilePageQuery'
import { buildGoalRecordFilter } from '../utils/goalRecordFilter'
import { GoalsListContent } from './components/GoalsListContent'
import { GoalsListDialogs } from './components/GoalsListDialogs'
import { RECORD_NAVIGATION_ERROR_MESSAGE } from './constants'
import {
  buildGoalsWithProgress,
  resolveDraftGoalProgress as resolveDraftGoalProgressFromData,
  resolveGoalAllCount,
  resolveGoalOverPowerChartMax,
} from './goalsListProgress'
import { deleteGoalRequest, fetchGoalsListData, saveGoalRequest } from './goalsListResource'

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
    async () => fetchGoalsListData(() => navigate('/login', { replace: true }))
  )

  const goalWithProgress = createMemo(() => buildGoalsWithProgress(resource()))

  /**
   * 現在の対象譜面条件に一致するレコード件数を取得する。
   *
   * @param attributes - 件数を確認する対象条件。
   * @returns 条件に一致するレコード件数。
   */
  const resolveAllCount = (attributes: GoalCreateRequest['attributes']) => {
    return resolveGoalAllCount(resource(), attributes)
  }

  /**
   * 現在の対象譜面条件で到達可能なOVER POWER合計最大値を取得する。
   *
   * @param attributes - 最大値を確認する対象条件。
   * @returns 譜面ごとの最大OVER POWER合計値。
   */
  const resolveOverPowerChartMax = (attributes: GoalCreateRequest['attributes']) => {
    return resolveGoalOverPowerChartMax(resource(), attributes)
  }

  /**
   * 目標フォームの下書き内容から現在のプレイヤーレコードに基づく進捗を算出する。
   *
   * @param draftGoal - フォーム入力中の目標内容。
   * @returns 実際の目標カードと同じ計算で作った進捗情報。
   */
  const resolveDraftGoalProgress = (draftGoal: GoalCreateRequest) => {
    return resolveDraftGoalProgressFromData(resource(), draftGoal)
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
      await saveGoalRequest(goal, payload)
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
      await deleteGoalRequest(goal)
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
            <GoalsListContent
              goalsCount={resource()?.goals.length ?? 0}
              goalWithProgress={goalWithProgress()}
              actionError={actionError()}
              onCreate={openCreateDialog}
              onEdit={handleEdit}
              onDelete={handleDeleteAsk}
              onOpenRecords={(selectedGoal) => {
                void handleOpenUnachievedRecords(selectedGoal)
              }}
            />

            <GoalsListDialogs
              data={resource()}
              formOpen={formOpen()}
              deleteOpen={deleteOpen()}
              editingGoal={editingGoal()}
              deletingGoal={deletingGoal()}
              isSaving={isSaving()}
              isDeleting={isDeleting()}
              formError={formError()}
              onFormOpenChange={handleFormOpenChange}
              onDeleteOpenChange={setDeleteOpen}
              onSave={handleSave}
              onDeleteConfirm={() => {
                void handleDelete()
              }}
              resolveAllCount={resolveAllCount}
              resolveOverPowerChartMax={resolveOverPowerChartMax}
              resolveDraftGoalProgress={resolveDraftGoalProgress}
            />
          </Show>
        </Show>
      </Show>
    </ErrorBoundary>
  )
}

export default GoalsList
