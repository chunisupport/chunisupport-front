import type { QueryClient } from '@tanstack/solid-query'
import { createRoot } from 'solid-js'
import { createStore } from 'solid-js/store'
import { receivedFriendRequestsQueryOptions } from '../queries/friends'
import {
  readFriendRequestNotificationState,
  saveFriendRequestNotificationState,
} from '../repositories/friendRequestNotificationRepository'

export const FRIEND_REQUEST_NOTIFICATION_REFRESH_INTERVAL_MS = 10 * 60 * 1000

type FriendRequestNotificationState = {
  username: string | null
  hasPendingReceivedRequest: boolean
  fetchedAt: string | null
  isHydrated: boolean
}

export const [friendRequestNotification, setFriendRequestNotification] = createRoot(() =>
  createStore<FriendRequestNotificationState>({
    username: null,
    hasPendingReceivedRequest: false,
    fetchedAt: null,
    isHydrated: false,
  })
)

let activeNotificationUsername: string | null = null

/**
 * フレンド申請通知を反映してよい認証ユーザー名を設定する。
 *
 * @param username - 現在の認証ユーザー名。未認証時は null。
 * @returns なし。
 */
export const setActiveFriendRequestNotificationUser = (username: string | null): void => {
  activeNotificationUsername = username
}

/**
 * 指定ユーザーが現在の通知反映対象か判定する。
 *
 * @param username - 判定対象のユーザー名。
 * @returns 現在の通知反映対象であれば true。
 */
const isActiveFriendRequestNotificationUser = (username: string): boolean =>
  activeNotificationUsername === username

/**
 * フレンド申請通知状態が再取得期限を過ぎているか判定する。
 *
 * @param fetchedAt - 前回取得日時。
 * @param nowMs - 判定基準時刻。
 * @returns 再取得が必要な場合は true。
 */
export const isFriendRequestNotificationStale = (
  fetchedAt: string | null | undefined,
  nowMs = Date.now()
): boolean => {
  if (!fetchedAt) {
    return true
  }

  const fetchedAtMs = Date.parse(fetchedAt)
  if (Number.isNaN(fetchedAtMs)) {
    return true
  }

  return nowMs - fetchedAtMs >= FRIEND_REQUEST_NOTIFICATION_REFRESH_INTERVAL_MS
}

/**
 * IndexedDB に保存されたフレンド申請通知状態を Signal へ反映する。
 *
 * @param username - 認証ユーザー名。
 * @returns 読み込み完了後に解決される Promise。
 */
export const hydrateFriendRequestNotification = async (username: string): Promise<void> => {
  const cached = await readFriendRequestNotificationState(username)

  if (!isActiveFriendRequestNotificationUser(username)) {
    return
  }

  if (!cached) {
    setFriendRequestNotification({
      username,
      hasPendingReceivedRequest: false,
      fetchedAt: null,
      isHydrated: true,
    })
    return
  }

  setFriendRequestNotification({
    username,
    hasPendingReceivedRequest: cached.hasPendingReceivedRequest,
    fetchedAt: cached.fetchedAt,
    isHydrated: true,
  })
}

/**
 * フレンド申請通知状態を受信申請queryから取得して更新する。
 *
 * @param queryClient - 受信申請queryを共有するQueryClient。
 * @param username - 認証ユーザー名。
 * @returns 更新完了後に解決される Promise。
 */
export const refreshFriendRequestNotification = async (
  queryClient: QueryClient,
  username: string
): Promise<void> => {
  if (!isActiveFriendRequestNotificationUser(username)) {
    return
  }

  setFriendRequestNotification({
    username,
    isHydrated: true,
  })

  const options = receivedFriendRequestsQueryOptions(username)
  const receivedRequests = await queryClient.fetchQuery({
    ...options,
    staleTime: 0,
  })
  const dataUpdatedAt = queryClient.getQueryState(options.queryKey)?.dataUpdatedAt

  if (!dataUpdatedAt) {
    return
  }

  await syncFriendRequestNotificationFromReceivedCount(
    username,
    receivedRequests.length,
    dataUpdatedAt
  )
}

/**
 * 前回取得時刻が古い場合だけフレンド申請通知状態を更新する。
 *
 * @param queryClient - 受信申請queryを共有するQueryClient。
 * @param username - 認証ユーザー名。
 * @returns 必要な更新が完了した後に解決される Promise。
 */
export const refreshFriendRequestNotificationIfStale = async (
  queryClient: QueryClient,
  username: string
): Promise<void> => {
  if (!isActiveFriendRequestNotificationUser(username)) {
    return
  }

  if (friendRequestNotification.username !== username || !friendRequestNotification.isHydrated) {
    await hydrateFriendRequestNotification(username)
  }

  if (
    isActiveFriendRequestNotificationUser(username) &&
    friendRequestNotification.username === username &&
    isFriendRequestNotificationStale(friendRequestNotification.fetchedAt)
  ) {
    await refreshFriendRequestNotification(queryClient, username)
  }
}

/**
 * 既に取得済みのフレンド申請一覧から通知状態を同期する。
 *
 * @param username - 認証ユーザー名。
 * @param receivedRequestCount - 受信済みフレンド申請件数。
 * @param dataUpdatedAt - 受信申請queryがデータを取得したUnix時刻（ミリ秒）。
 * @returns 保存完了後に解決される Promise。
 */
export const syncFriendRequestNotificationFromReceivedCount = async (
  username: string,
  receivedRequestCount: number,
  dataUpdatedAt: number
): Promise<void> => {
  if (!isActiveFriendRequestNotificationUser(username)) {
    return
  }

  const hasPendingReceivedRequest = receivedRequestCount > 0
  const fetchedAt = new Date(dataUpdatedAt).toISOString()

  if (
    friendRequestNotification.username === username &&
    friendRequestNotification.hasPendingReceivedRequest === hasPendingReceivedRequest &&
    friendRequestNotification.fetchedAt === fetchedAt
  ) {
    return
  }

  await saveFriendRequestNotificationState(username, hasPendingReceivedRequest, fetchedAt)
  if (!isActiveFriendRequestNotificationUser(username)) {
    return
  }

  setFriendRequestNotification({
    username,
    hasPendingReceivedRequest,
    fetchedAt,
    isHydrated: true,
  })
}

/**
 * メモリ上のフレンド申請通知状態を初期状態へ戻す。
 *
 * @returns なし。
 */
export const clearFriendRequestNotification = (): void => {
  activeNotificationUsername = null
  setFriendRequestNotification({
    username: null,
    hasPendingReceivedRequest: false,
    fetchedAt: null,
    isHydrated: false,
  })
}
