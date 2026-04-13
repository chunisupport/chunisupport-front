import { API_BASE_URL } from '../config'
import type { ApiTokenResponse } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'
import { reauthenticateAndGetToken } from './reauthenticate'

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

export const deleteAccount = async (): Promise<void> => {
  const reauthToken = await reauthenticateAndGetToken()
  await fetchWithAuth(`${API_BASE_URL}/internal/me`, {
    method: 'DELETE',
    headers: { 'X-Reauth-Token': reauthToken },
    redirectOnUnauthorized: false,
  })
}
