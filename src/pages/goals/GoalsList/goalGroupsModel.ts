import type { GoalDTO, GoalGroupDTO } from '../../../types/api'
import type { GoalWithProgress } from './goalsListProgress'

/** 未分類グループの表示名。 */
export const UNGROUPED_GOALS_LABEL = '未分類'
/** 1ユーザーが作成できる目標グループ数。 */
export const GOAL_GROUPS_LIMIT = 20
/** 目標グループ名の最大文字数。 */
export const GOAL_GROUP_NAME_MAX_LENGTH = 30

/** 目標一覧で切り替える1グループ分の表示モデル。 */
export interface GoalGroupView {
  groupId: number | null
  name: string
  goals: GoalWithProgress[]
}

/**
 * 目標フォームを開いたときの所属グループIDを解決する。
 *
 * @param goal - 編集対象。未指定なら新規作成。
 * @param initialGroupId - 新規作成時の初期グループID。
 * @returns 編集時は保存済み所属、新規作成時は現在表示中の所属。
 */
export const resolveGoalFormGroupId = (
  goal: Pick<GoalDTO, 'group_id'> | undefined,
  initialGroupId: number | null
): number | null => (goal ? goal.group_id : initialGroupId)

/**
 * APIのグループと進捗付き目標から横方向切替用の表示モデルを作る。
 *
 * @param groups - APIから取得した目標グループ。
 * @param goals - 進捗計算済みの目標。
 * @returns グループ順の表示モデル。未分類は常に末尾へ含める。
 */
export const buildGoalGroupViews = (
  groups: readonly GoalGroupDTO[],
  goals: readonly GoalWithProgress[]
): GoalGroupView[] => {
  return [
    ...groups.map((group) => ({
      groupId: group.id,
      name: group.name,
      goals: goals.filter(({ goal }) => goal.group_id === group.id),
    })),
    {
      groupId: null,
      name: UNGROUPED_GOALS_LABEL,
      goals: goals.filter(({ goal }) => goal.group_id === null),
    },
  ]
}

/**
 * APIから取得した目標をグループ内の永続化済み表示順へ整列する。
 *
 * @param goals - APIレスポンスから進捗計算した目標一覧。
 * @returns 各目標のobject identityを維持して整列した新しい配列。
 */
export const orderGoalsByPersistedGroupOrder = (
  goals: readonly GoalWithProgress[]
): GoalWithProgress[] =>
  [...goals].sort((left, right) => {
    const leftGroup = left.goal.group_id ?? Number.MAX_SAFE_INTEGER
    const rightGroup = right.goal.group_id ?? Number.MAX_SAFE_INTEGER
    return (
      leftGroup - rightGroup ||
      left.goal.sort_order - right.goal.sort_order ||
      left.goal.id - right.goal.id
    )
  })

/**
 * 現在のグループから指定方向へ循環したグループIDを返す。
 *
 * @param views - 表示順のグループ一覧。
 * @param currentGroupId - 現在表示中のグループID。
 * @param offset - 切替方向。
 * @returns 切替先のグループID。候補がなければnull。
 */
export const resolveCyclicGoalGroupId = (
  views: readonly GoalGroupView[],
  currentGroupId: number | null,
  offset: -1 | 1
): number | null => {
  if (views.length === 0) return null
  const currentIndex = views.findIndex(({ groupId }) => groupId === currentGroupId)
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 0
  const nextIndex = (normalizedIndex + offset + views.length) % views.length
  return views[nextIndex]?.groupId ?? null
}

/**
 * 目標グループを指定IDの位置へ移動する。
 *
 * @param groups - 現在の表示順のグループ。
 * @param activeId - 移動するグループID。
 * @param overId - 移動先のグループID。
 * @returns 移動後の新しい配列。
 */
export const moveGoalGroup = (
  groups: readonly GoalGroupDTO[],
  activeId: number,
  overId: number
): GoalGroupDTO[] => {
  const reordered = [...groups]
  const fromIndex = reordered.findIndex(({ id }) => id === activeId)
  const toIndex = reordered.findIndex(({ id }) => id === overId)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return reordered

  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  return reordered
}

/**
 * 目標グループ名をAPI仕様に沿って検証する。
 *
 * @param name - 入力されたグループ名。
 * @param groups - 重複確認に使う既存グループ。
 * @param editingGroupId - 改名時に重複確認から除外するグループID。
 * @returns 検証エラー。正常なら空文字。
 */
export const validateGoalGroupName = (
  name: string,
  groups: readonly GoalGroupDTO[],
  editingGroupId?: number
): string => {
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'グループ名を入力してください。'
  if (Array.from(trimmed).length > GOAL_GROUP_NAME_MAX_LENGTH) {
    return `グループ名は${GOAL_GROUP_NAME_MAX_LENGTH}文字以内で入力してください。`
  }
  if (/\p{Cc}/u.test(trimmed)) return 'グループ名に制御文字は使用できません。'
  if (
    groups.some(
      (group) =>
        group.id !== editingGroupId &&
        group.name.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase()
    )
  ) {
    return '同じ名前の目標グループがすでに存在します。'
  }
  return ''
}

/**
 * 削除されたグループの目標を、現在の順序を保って未分類末尾へ移動する。
 *
 * @param goals - 全目標。
 * @param deletedGroupId - 削除されたグループID。
 * @returns グループ所属と未分類内順序を更新した目標一覧。
 */
export const moveDeletedGroupGoalsToUngrouped = (
  goals: readonly GoalWithProgress[],
  deletedGroupId: number
): GoalWithProgress[] => {
  const ungroupedEnd = goals
    .filter(({ goal }) => goal.group_id === null)
    .reduce((maxOrder, { goal }) => Math.max(maxOrder, goal.sort_order), 0)
  const movedOrderById = new Map(
    goals
      .filter(({ goal }) => goal.group_id === deletedGroupId)
      .sort((left, right) => left.goal.sort_order - right.goal.sort_order)
      .map(({ goal }, index) => [goal.id, ungroupedEnd + index + 1])
  )

  return goals.map((item) => {
    const sortOrder = movedOrderById.get(item.goal.id)
    return sortOrder === undefined
      ? item
      : { ...item, goal: { ...item.goal, group_id: null, sort_order: sortOrder } }
  })
}
