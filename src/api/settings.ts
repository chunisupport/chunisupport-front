import { API_BASE_URL } from '../config'
import type { ApiTokenResponse, RecoveryCodesResponse, SessionCountResponse } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

type PasswordUpdatePayload = {
  current_password: string
  new_password: string
}

export const fetchPrivacy = async (): Promise<{ is_private: boolean }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me`, {
    method: 'GET',
  })

  const data = (await response.json()) as { is_private: boolean }
  return { is_private: data.is_private }
}

export const updatePrivacy = async (isPrivate: boolean): Promise<{ is_private: boolean }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/privacy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_private: isPrivate }),
  })

  return response.json()
}

export const updatePassword = async (payload: PasswordUpdatePayload): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export const issueRecoveryCodes = async (): Promise<RecoveryCodesResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/recovery-codes`, {
    method: 'POST',
  })

  return response.json()
}

export const issueApiToken = async (): Promise<ApiTokenResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens`, {
    method: 'POST',
  })

  return response.json()
}

export const deleteApiToken = async (): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens`, {
    method: 'DELETE',
  })
}

export const fetchSessionCount = async (): Promise<SessionCountResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/sessions`, {
    method: 'GET',
  })

  return response.json()
}

export const logoutOtherSessions = async (): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/sessions`, {
    method: 'DELETE',
  })
}

export const linkFirebaseAccount = async (idToken: string): Promise<void> => {
  const response = await fetchWithAuth(API_BASE_URL + '/internal/me/firebase/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  })

  if (!response.ok) {
    throw new Error("Googleアカウントの連携に失敗しました。")
  }
}
