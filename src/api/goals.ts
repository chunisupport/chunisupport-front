import { API_BASE_URL } from '../config'
import type { GoalCreateRequest, GoalDTO, GoalUpdateRequest } from '../types/api'
import { getErrorMessage } from '../types/api'

const throwApiError = async (response: Response): Promise<never> => {
  let fallback = `HTTP ${response.status}`
  try {
    const error = await response.json()
    fallback = getErrorMessage(error)
  } catch {
    // ignore
  }
  throw new Error(fallback)
}

export const fetchGoals = async (): Promise<{ goals: GoalDTO[] }> => {
  const response = await fetch(`${API_BASE_URL}/internal/me/goals`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export const createGoal = async (data: GoalCreateRequest): Promise<GoalDTO> => {
  const response = await fetch(`${API_BASE_URL}/internal/me/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export const updateGoal = async (id: number, data: GoalUpdateRequest): Promise<GoalDTO> => {
  const response = await fetch(`${API_BASE_URL}/internal/me/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export const deleteGoal = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/me/goals/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }
}
