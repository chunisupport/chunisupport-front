import { useNavigate } from '@solidjs/router'
import type { Component } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  Show,
} from 'solid-js'
import { LoadError, Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type {
  GoalCreateRequest,
  GoalDTO,
  GoalGroupDTO,
  GoalUpdateRequest,
} from '../../../types/api'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { GoalGroupsManageDialog } from './components/list/GoalGroupsManageDialog'
import { GoalsListContent } from './components/list/GoalsListContent'
import { GoalsListDialogs } from './components/list/GoalsListDialogs'
import {
  buildGoalReorderAnnouncement,
  GOAL_GROUP_COPY,
  GOAL_REORDER_ERROR_MESSAGE,
  RECORD_NAVIGATION_ERROR_MESSAGE,
} from './constants'
import {
  buildGoalGroupViews,
  moveDeletedGroupGoalsToUngrouped,
  moveGoalGroup,
  orderGoalsByPersistedGroupOrder,
  resolveCyclicGoalGroupId,
  UNGROUPED_GOALS_LABEL,
} from './goalGroupsModel'
import { moveGoal } from './goalOrder'
import { saveGoalRecordFilterAndBuildPath } from './goalsListNavigation'
import {
  buildGoalsWithProgress,
  resolveDraftGoalProgress as resolveDraftGoalProgressFromData,
  resolveGoalAllCount,
  resolveGoalOverPowerChartMax,
} from './goalsListProgress'
import {
  createGoalGroupRequest,
  deleteGoalGroupRequest,
  deleteGoalRequest,
  fetchGoalsListData,
  reorderGoalGroupsRequest,
  reorderGoalsRequest,
  saveGoalRequest,
  updateGoalGroupRequest,
} from './goalsListResource'

const GoalsList: Component = () => {
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = createSignal(0)

  const [formOpen, setFormOpen] = createSignal(false)
  const [groupsManageOpen, setGroupsManageOpen] = createSignal(false)
  const [deleteOpen, setDeleteOpen] = createSignal(false)
  const [editingGoal, setEditingGoal] = createSignal<GoalDTO | undefined>(undefined)
  const [deletingGoal, setDeletingGoal] = createSignal<GoalDTO | undefined>(undefined)
  const [isSaving, setIsSaving] = createSignal(false)
  const [isDeleting, setIsDeleting] = createSignal(false)
  const [isReordering, setIsReordering] = createSignal(false)
  const [isGroupMutating, setIsGroupMutating] = createSignal(false)
  const [actionError, setActionError] = createSignal('')
  const [reorderAnnouncement, setReorderAnnouncement] = createSignal('')
  const [formError, setFormError] = createSignal('')
  const [groupError, setGroupError] = createSignal('')
  const [selectedGroupId, setSelectedGroupId] = createSignal<number | null>(null)

  const [resource] = createResource(
    () => refreshKey(),
    async () => fetchGoalsListData(() => navigate('/login', { replace: true }))
  )

  const goalWithProgress = createMemo(() => buildGoalsWithProgress(resource()))
  const [orderedGoals, setOrderedGoals] = createSignal(goalWithProgress())
  const [orderedGroups, setOrderedGroups] = createSignal<GoalGroupDTO[]>([])
  let hasInitializedGroupSelection = false

  createEffect(() => {
    setOrderedGoals(orderGoalsByPersistedGroupOrder(goalWithProgress()))
  })

  createEffect(() => {
    const groups = resource()?.groups
    if (!groups) return
    setOrderedGroups([...groups].sort((left, right) => left.sort_order - right.sort_order))
  })

  const groupViews = createMemo(() => buildGoalGroupViews(orderedGroups(), orderedGoals()))
  const currentGroupView = createMemo(() => {
    const views = groupViews()
    return (
      views.find(({ groupId }) => groupId === selectedGroupId()) ??
      views[0] ?? { groupId: null, name: UNGROUPED_GOALS_LABEL, goals: [] }
    )
  })

  createEffect(() => {
    const data = resource()
    if (!data) return
    const views = groupViews()
    if (!hasInitializedGroupSelection) {
      const firstGroup = [...data.groups].sort(
        (left, right) => left.sort_order - right.sort_order
      )[0]
      setSelectedGroupId(firstGroup?.id ?? null)
      hasInitializedGroupSelection = true
      return
    }
    if (!views.some(({ groupId }) => groupId === selectedGroupId())) {
      setSelectedGroupId(views[0]?.groupId ?? null)
    }
  })

  /**
   * 現在の対象条件に一致する譜面数または楽曲数を取得する。
   *
   * @param attributes - 件数を確認する対象条件。
   * @param achievementType - 集約単位を決める目標種別。
   * @returns 条件に一致する譜面数または楽曲数。
   */
  const resolveAllCount = (
    attributes: GoalCreateRequest['attributes'],
    achievementType?: GoalCreateRequest['achievement_type']
  ) => {
    return resolveGoalAllCount(resource(), attributes, achievementType)
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

  /**
   * 指定方向へ目標グループを循環切替する。
   *
   * @param offset - 前後どちらへ切り替えるか。
   * @returns なし。
   */
  const changeSelectedGroup = (offset: -1 | 1): void => {
    setSelectedGroupId(resolveCyclicGoalGroupId(groupViews(), selectedGroupId(), offset))
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
      const path = await saveGoalRecordFilterAndBuildPath(data, goal)
      navigate(path)
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

  /**
   * 目標カードを画面上で即時に並び替え、APIへ表示順を保存する。
   *
   * @param activeId - 移動する目標ID。
   * @param overId - 移動先の目標ID。
   * @returns なし。
   */
  const handleReorder = (activeId: number, overId: number): void => {
    if (isReordering() || isGroupMutating() || activeId === overId) return

    const groupId = currentGroupView().groupId
    const previousGoals = orderedGoals()
    const previousGroupGoals = currentGroupView().goals
    const nextGroupGoals = moveGoal(previousGroupGoals, activeId, overId)
    if (nextGroupGoals.every(({ goal }, index) => goal.id === previousGroupGoals[index]?.goal.id)) {
      return
    }
    let nextGroupIndex = 0
    const nextGoals = previousGoals.map((item) =>
      item.goal.group_id === groupId ? nextGroupGoals[nextGroupIndex++] : item
    )

    setActionError('')
    setOrderedGoals(nextGoals)
    const movedIndex = nextGroupGoals.findIndex(({ goal }) => goal.id === activeId)
    const movedGoal = nextGroupGoals[movedIndex]?.goal
    if (movedGoal) {
      setReorderAnnouncement(
        buildGoalReorderAnnouncement(movedGoal.title, movedIndex + 1, nextGroupGoals.length)
      )
    }
    setIsReordering(true)

    void reorderGoalsRequest(
      groupId,
      nextGroupGoals.map(({ goal }) => goal)
    )
      .catch((error: unknown) => {
        setOrderedGoals(previousGoals)
        setActionError(toUserFriendlyErrorMessage(error, GOAL_REORDER_ERROR_MESSAGE))
      })
      .finally(() => {
        setIsReordering(false)
      })
  }

  /**
   * 目標グループを作成し、作成したグループへ表示を切り替える。
   *
   * @param name - 作成するグループ名。
   * @returns 作成完了後に解決されるPromise。
   */
  const handleCreateGroup = async (name: string): Promise<void> => {
    setGroupError('')
    setIsGroupMutating(true)
    try {
      const group = await createGoalGroupRequest(name)
      setOrderedGroups((groups) => [...groups, group])
      setSelectedGroupId(group.id)
    } catch (error) {
      setGroupError(toUserFriendlyErrorMessage(error, GOAL_GROUP_COPY.createError))
      throw error
    } finally {
      setIsGroupMutating(false)
    }
  }

  /**
   * 目標グループ名を更新する。
   *
   * @param group - 更新対象のグループ。
   * @param name - 更新後のグループ名。
   * @returns 更新完了後に解決されるPromise。
   */
  const handleUpdateGroup = async (group: GoalGroupDTO, name: string): Promise<void> => {
    setGroupError('')
    setIsGroupMutating(true)
    try {
      const updated = await updateGoalGroupRequest(group, name)
      setOrderedGroups((groups) => groups.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      setGroupError(toUserFriendlyErrorMessage(error, GOAL_GROUP_COPY.updateError))
      throw error
    } finally {
      setIsGroupMutating(false)
    }
  }

  /**
   * 目標グループを削除し、所属目標を未分類へ移動する。
   *
   * @param group - 削除するグループ。
   * @returns 削除完了後に解決されるPromise。
   */
  const handleDeleteGroup = async (group: GoalGroupDTO): Promise<void> => {
    setGroupError('')
    setIsGroupMutating(true)
    try {
      await deleteGoalGroupRequest(group)
      setOrderedGroups((groups) => groups.filter(({ id }) => id !== group.id))
      setOrderedGoals((goals) => moveDeletedGroupGoalsToUngrouped(goals, group.id))
      if (selectedGroupId() === group.id) setSelectedGroupId(null)
    } catch (error) {
      setGroupError(toUserFriendlyErrorMessage(error, GOAL_GROUP_COPY.deleteError))
      throw error
    } finally {
      setIsGroupMutating(false)
    }
  }

  /**
   * グループを画面上で即時に並び替え、APIへ保存する。
   *
   * @param activeId - 移動するグループID。
   * @param overId - 移動先のグループID。
   * @returns なし。
   */
  const handleReorderGroups = (activeId: number, overId: number): void => {
    if (isGroupMutating() || activeId === overId) return
    const previousGroups = orderedGroups()
    const nextGroups = moveGoalGroup(previousGroups, activeId, overId)
    if (nextGroups.every(({ id }, index) => id === previousGroups[index]?.id)) return

    setGroupError('')
    setOrderedGroups(nextGroups)
    setIsGroupMutating(true)
    void reorderGoalGroupsRequest(nextGroups)
      .catch((error: unknown) => {
        setOrderedGroups(previousGroups)
        setGroupError(toUserFriendlyErrorMessage(error, GOAL_GROUP_COPY.reorderError))
      })
      .finally(() => setIsGroupMutating(false))
  }

  return (
    <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
      <Show when={!resource.error} fallback={<LoadError error={resource.error} />}>
        <Show when={!resource.loading} fallback={<Loading />}>
          <Show when={!resource()?.noPlayerData} fallback={<PlayerDataEmptyState />}>
            <GoalsListContent
              goalsCount={resource()?.goals.length ?? 0}
              groupView={currentGroupView()}
              groupCount={groupViews().length}
              actionError={actionError()}
              isReordering={isReordering()}
              reorderAnnouncement={reorderAnnouncement()}
              onCreate={openCreateDialog}
              onManageGroups={() => {
                setGroupError('')
                setGroupsManageOpen(true)
              }}
              onPreviousGroup={() => changeSelectedGroup(-1)}
              onNextGroup={() => changeSelectedGroup(1)}
              onEdit={handleEdit}
              onDelete={handleDeleteAsk}
              onOpenRecords={(selectedGoal) => {
                void handleOpenUnachievedRecords(selectedGoal)
              }}
              onReorder={handleReorder}
            />

            <GoalsListDialogs
              data={resource()}
              formOpen={formOpen()}
              initialGroupId={selectedGroupId()}
              groups={orderedGroups()}
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

            <GoalGroupsManageDialog
              open={groupsManageOpen()}
              groups={orderedGroups()}
              isMutating={isGroupMutating()}
              errorMessage={groupError()}
              onOpenChange={setGroupsManageOpen}
              onCreate={handleCreateGroup}
              onUpdate={handleUpdateGroup}
              onDelete={handleDeleteGroup}
              onReorder={handleReorderGroups}
            />
          </Show>
        </Show>
      </Show>
    </ErrorBoundary>
  )
}

export default GoalsList
