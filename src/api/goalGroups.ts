import { API_BASE_URL } from '../config'
import type { GoalGroupDTO, GoalGroupRequest } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/**
 * ログインユーザーが所有する目標グループを取得する。
 *
 * @returns APIの表示順で並んだ目標グループ一覧。
 */
export const fetchGoalGroups = async (): Promise<{ groups: GoalGroupDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/goal-groups`, {
    method: 'GET',
  })

  return response.json()
}

/**
 * 目標グループを作成する。
 *
 * @param data - 作成するグループ名。
 * @returns 作成された目標グループ。
 */
export const createGoalGroup = async (data: GoalGroupRequest): Promise<GoalGroupDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/goal-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  return response.json()
}

/**
 * 目標グループ名を更新する。
 *
 * @param id - 更新するグループID。
 * @param data - 更新後のグループ名。
 * @returns 更新された目標グループ。
 */
export const updateGoalGroup = async (
  id: number,
  data: GoalGroupRequest
): Promise<GoalGroupDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/goal-groups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  return response.json()
}

/**
 * 目標グループを削除する。
 *
 * @param id - 削除するグループID。
 * @returns 削除完了後に解決されるPromise。
 */
export const deleteGoalGroup = async (id: number): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/goal-groups/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 目標グループを指定順に並び替える。
 *
 * @param groupIds - 表示順に並べた全グループID。
 * @returns 並び替え完了後に解決されるPromise。
 */
export const reorderGoalGroups = async (groupIds: readonly number[]): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/goal-groups/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group_ids: groupIds }),
  })
}
