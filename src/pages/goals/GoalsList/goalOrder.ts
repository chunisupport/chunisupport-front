import type { GoalWithProgress } from './goalsListProgress'

/**
 * 進捗付き目標を指定IDの位置へ移動する。
 *
 * @param goals - 現在の表示順で並んだ目標。
 * @param activeId - 移動する目標ID。
 * @param overId - 移動先の目標ID。
 * @returns 指定位置へ移動後の新しい配列。IDが不正な場合は元の順序の複製。
 */
export const moveGoal = (
  goals: readonly GoalWithProgress[],
  activeId: number,
  overId: number
): GoalWithProgress[] => {
  const fromIndex = goals.findIndex(({ goal }) => goal.id === activeId)
  const toIndex = goals.findIndex(({ goal }) => goal.id === overId)
  const reordered = [...goals]

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return reordered
  }

  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  return reordered
}
