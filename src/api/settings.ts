import { API_BASE_URL } from '../config'
import type {
  ApiToken,
  ApiTokenIssueResponse,
  ApiTokenListResponse,
  ApiTokenRenameRequest,
} from '../types/api'
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

/**
 * 名前付きAPIトークンを追加発行する。
 *
 * @param name - APIトークンの表示名。
 * @returns 平文トークンと管理情報。平文はこのレスポンスでのみ取得できる。
 */
export const issueApiToken = async (name: string): Promise<ApiTokenIssueResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  return response.json()
}

/**
 * ログインユーザーが所有するAPIトークン一覧を取得する。
 *
 * @returns APIトークン管理情報の一覧。
 */
export const fetchApiTokens = async (): Promise<ApiTokenListResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens`, {
    method: 'GET',
  })

  return response.json()
}

/**
 * APIトークンの表示名を変更する。
 *
 * @param id - 変更対象のAPIトークンID。
 * @param data - 新しい表示名。
 * @returns 変更後のAPIトークン管理情報。
 */
export const renameApiToken = async (
  id: number,
  data: ApiTokenRenameRequest
): Promise<ApiToken> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  return response.json()
}

/**
 * IDで指定したAPIトークンを削除する。
 *
 * @param id - 削除対象のAPIトークンID。
 * @returns 削除完了後に解決されるPromise。
 */
export const deleteApiToken = async (id: number): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/auth/api-tokens/${id}`, {
    method: 'DELETE',
  })
}

export const deletePlayerData = async (): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/player-data`, {
    method: 'DELETE',
  })
}

export const deleteAccount = async (): Promise<void> => {
  const reauthToken = await reauthenticateAndGetToken()
  await fetchWithAuth(`${API_BASE_URL}/internal/me`, {
    method: 'DELETE',
    headers: { 'X-Reauth-Token': reauthToken },
    suppressUnauthorizedRedirectForCodes: ['recent_sign_in_required'],
  })
}
