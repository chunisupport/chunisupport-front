import { API_BASE_URL } from '../config'
import type { FriendRequestCreateRequest, FriendshipListResponse } from '../types/api'
import { assertValidUsername } from '../utils/usernameInput'
import { fetchWithAuth } from './fetchWithAuth'

const FRIENDS_API_PATH = `${API_BASE_URL}/internal/friends`

/**
 * 承認済みフレンド一覧を取得する。
 *
 * @param signal - リクエストを中断するためのシグナル。
 * @returns 成立日時降順のフレンド一覧。
 */
export const fetchFriends = async (signal?: AbortSignal): Promise<FriendshipListResponse> => {
  const response = await fetchWithAuth(FRIENDS_API_PATH, {
    method: 'GET',
    signal,
    requireAuthentication: true,
  })

  return response.json()
}

/**
 * 自分宛てのフレンド申請一覧を取得する。
 *
 * @param signal - リクエストを中断するためのシグナル。
 * @returns 申請日時降順の受信済みフレンドリクエスト一覧。
 */
export const fetchReceivedFriendRequests = async (
  signal?: AbortSignal
): Promise<FriendshipListResponse> => {
  const response = await fetchWithAuth(`${FRIENDS_API_PATH}/requests/received`, {
    method: 'GET',
    signal,
    requireAuthentication: true,
  })

  return response.json()
}

/**
 * 自分が送ったフレンド申請一覧を取得する。
 *
 * @param signal - リクエストを中断するためのシグナル。
 * @returns 申請日時降順の送信申請一覧。
 */
export const fetchSentFriendRequests = async (
  signal?: AbortSignal
): Promise<FriendshipListResponse> => {
  const response = await fetchWithAuth(`${FRIENDS_API_PATH}/requests/sent`, {
    method: 'GET',
    signal,
    requireAuthentication: true,
  })

  return response.json()
}

/**
 * username完全一致でフレンド申請を送信する。
 *
 * @param request - 申請先ユーザー名。
 * @returns 申請完了時に解決されるPromise。
 * @throws {TypeError} username がフレンド操作用の形式を満たさない場合。
 */
export const createFriendRequest = async (request: FriendRequestCreateRequest): Promise<void> => {
  assertValidUsername(request.username)

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
 * @param username - 申請元ユーザーの公開識別子。
 * @returns 承認完了時に解決されるPromise。
 * @throws {TypeError} username がフレンド操作用の形式を満たさない場合。
 */
export const acceptFriendRequest = async (username: string): Promise<void> => {
  assertValidUsername(username)

  await fetchWithAuth(`${FRIENDS_API_PATH}/requests/${encodeURIComponent(username)}/accept`, {
    method: 'POST',
    requireAuthentication: true,
  })
}

/**
 * 指定ユーザーから届いたフレンド申請を拒否する。
 *
 * @param username - 申請元ユーザーの公開識別子。
 * @returns 拒否完了時に解決されるPromise。
 * @throws {TypeError} username がフレンド操作用の形式を満たさない場合。
 */
export const rejectFriendRequest = async (username: string): Promise<void> => {
  assertValidUsername(username)

  await fetchWithAuth(`${FRIENDS_API_PATH}/requests/${encodeURIComponent(username)}/reject`, {
    method: 'POST',
    requireAuthentication: true,
  })
}

/**
 * 自分が送ったフレンド申請を取り消す。
 *
 * @param username - 申請先ユーザーの公開識別子。
 * @returns 取り消し完了時に解決されるPromise。
 * @throws {TypeError} username がフレンド操作用の形式を満たさない場合。
 */
export const cancelFriendRequest = async (username: string): Promise<void> => {
  assertValidUsername(username)

  await fetchWithAuth(`${FRIENDS_API_PATH}/requests/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    requireAuthentication: true,
  })
}

/**
 * 指定ユーザーとのフレンド関係を解除する。
 *
 * @param username - 解除対象ユーザーの公開識別子。
 * @returns 解除完了時に解決されるPromise。
 * @throws {TypeError} username がフレンド操作用の形式を満たさない場合。
 */
export const deleteFriend = async (username: string): Promise<void> => {
  assertValidUsername(username)

  await fetchWithAuth(`${FRIENDS_API_PATH}/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    requireAuthentication: true,
  })
}
