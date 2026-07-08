import { API_BASE_URL } from '../config'
import type { FriendRequestCreateRequest, FriendshipListResponse } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

const FRIENDS_API_PATH = `${API_BASE_URL}/internal/friends`

/**
 * 承認済みフレンド一覧を取得する。
 *
 * @returns 成立日時降順のフレンド一覧。
 */
export const fetchFriends = async (): Promise<FriendshipListResponse> => {
  const response = await fetchWithAuth(FRIENDS_API_PATH, {
    method: 'GET',
    requireAuthentication: true,
  })

  return response.json()
}

/**
 * 自分宛てのフレンド申請一覧を取得する。
 *
 * @returns 申請日時降順の受信申請一覧。
 */
export const fetchReceivedFriendRequests = async (): Promise<FriendshipListResponse> => {
  const response = await fetchWithAuth(`${FRIENDS_API_PATH}/requests/received`, {
    method: 'GET',
    requireAuthentication: true,
  })

  return response.json()
}

/**
 * 自分が送ったフレンド申請一覧を取得する。
 *
 * @returns 申請日時降順の送信申請一覧。
 */
export const fetchSentFriendRequests = async (): Promise<FriendshipListResponse> => {
  const response = await fetchWithAuth(`${FRIENDS_API_PATH}/requests/sent`, {
    method: 'GET',
    requireAuthentication: true,
  })

  return response.json()
}

/**
 * username完全一致でフレンド申請を送信する。
 *
 * @param request - 申請先ユーザー名。
 * @returns 申請完了時に解決されるPromise。
 */
export const createFriendRequest = async (request: FriendRequestCreateRequest): Promise<void> => {
  await fetchWithAuth(`${FRIENDS_API_PATH}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    requireAuthentication: true,
  })
}

/**
 * 指定ユーザーから届いたフレンド申請を承認する。
 *
 * @param userId - 申請元ユーザーの内部ID。
 * @returns 承認完了時に解決されるPromise。
 */
export const acceptFriendRequest = async (userId: number): Promise<void> => {
  await fetchWithAuth(`${FRIENDS_API_PATH}/requests/${encodeURIComponent(userId)}/accept`, {
    method: 'POST',
    requireAuthentication: true,
  })
}

/**
 * 指定ユーザーから届いたフレンド申請を拒否する。
 *
 * @param userId - 申請元ユーザーの内部ID。
 * @returns 拒否完了時に解決されるPromise。
 */
export const rejectFriendRequest = async (userId: number): Promise<void> => {
  await fetchWithAuth(`${FRIENDS_API_PATH}/requests/${encodeURIComponent(userId)}/reject`, {
    method: 'POST',
    requireAuthentication: true,
  })
}

/**
 * 指定ユーザーとのフレンド関係を解除する。
 *
 * @param userId - 解除対象ユーザーの内部ID。
 * @returns 解除完了時に解決されるPromise。
 */
export const deleteFriend = async (userId: number): Promise<void> => {
  await fetchWithAuth(`${FRIENDS_API_PATH}/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    requireAuthentication: true,
  })
}
