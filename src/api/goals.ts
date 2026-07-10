import { API_BASE_URL } from '../config'
import type { GoalCreateRequest, GoalDTO, GoalUpdateRequest } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

export const fetchGoals = async (): Promise<{ goals: GoalDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/goals`, {
    method: 'GET',
  })

  return response.json()
}

export const createGoal = async (data: GoalCreateRequest): Promise<GoalDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  return response.json()
}

export const updateGoal = async (id: number, data: GoalUpdateRequest): Promise<GoalDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  return response.json()
}

export const deleteGoal = async (id: number): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/goals/${id}`, {
    method: 'DELETE',
  })
}

/**
 * ログインユーザーの目標を指定順に並び替える。
 *
 * @param goalIds - 表示順に並べた全目標ID。
 * @returns 並び替え完了後に解決される Promise。
 */
export const reorderGoals = async (goalIds: readonly number[]): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/goals/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal_ids: goalIds }),
  })
}
