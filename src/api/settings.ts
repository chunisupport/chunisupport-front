import { API_BASE_URL } from '../config'
import {
  type ApiTokenResponse,
  getErrorMessage,
  type RecoveryCodesResponse,
  type SessionCountResponse,
} from '../types/api'

type PasswordUpdatePayload = {
  current_password: string
  new_password: string
}

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

export const fetchPrivacy = async (): Promise<{ is_private: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/internal/me`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const data = (await response.json()) as { is_private: boolean }
  return { is_private: data.is_private }
}

export const updatePrivacy = async (isPrivate: boolean): Promise<{ is_private: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/internal/me/privacy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ is_private: isPrivate }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export const updatePassword = async (payload: PasswordUpdatePayload): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/me/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await throwApiError(response)
  }
}

export const issueRecoveryCodes = async (): Promise<RecoveryCodesResponse> => {
  const response = await fetch(`${API_BASE_URL}/internal/me/recovery-codes`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export const issueApiToken = async (): Promise<ApiTokenResponse> => {
  const response = await fetch(`${API_BASE_URL}/internal/auth/api-tokens`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export const deleteApiToken = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/auth/api-tokens`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }
}

export const fetchSessionCount = async (): Promise<SessionCountResponse> => {
  const response = await fetch(`${API_BASE_URL}/internal/me/sessions`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export const logoutOtherSessions = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/internal/me/sessions`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }
}
