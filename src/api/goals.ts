import { API_BASE_URL } from '../config.ts'
import type { GoalCreateRequest, GoalDTO, GoalUpdateRequest } from '../types/api.ts'
import { fetchWithAuth } from './fetchWithAuth.ts'

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
