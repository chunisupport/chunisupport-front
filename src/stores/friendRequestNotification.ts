import { createRoot } from 'solid-js'
import { createStore } from 'solid-js/store'
import { fetchReceivedFriendRequests } from '../api/friends'
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

const refreshingUsernames = new Set<string>()
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
 * フレンド申請通知状態を API から取得して更新する。
 *
 * @param username - 認証ユーザー名。
 * @returns 更新完了後に解決される Promise。
 */
export const refreshFriendRequestNotification = async (username: string): Promise<void> => {
  if (!isActiveFriendRequestNotificationUser(username) || refreshingUsernames.has(username)) {
    return
  }

  refreshingUsernames.add(username)
  setFriendRequestNotification({
    username,
    isHydrated: true,
  })

  try {
    const response = await fetchReceivedFriendRequests()
    const hasPendingReceivedRequest = response.items.length > 0
    const fetchedAt = new Date().toISOString()

    if (
      !isActiveFriendRequestNotificationUser(username) ||
      friendRequestNotification.username !== username
    ) {
      return
    }

    await saveFriendRequestNotificationState(username, hasPendingReceivedRequest, fetchedAt)
    setFriendRequestNotification({
      username,
      hasPendingReceivedRequest,
      fetchedAt,
    })
  } finally {
    refreshingUsernames.delete(username)
  }
}

/**
 * 前回取得時刻が古い場合だけフレンド申請通知状態を更新する。
 *
 * @param username - 認証ユーザー名。
 * @returns 必要な更新が完了した後に解決される Promise。
 */
export const refreshFriendRequestNotificationIfStale = async (username: string): Promise<void> => {
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
    await refreshFriendRequestNotification(username)
  }
}

/**
 * 既に取得済みのフレンド申請一覧から通知状態を同期する。
 *
 * @param username - 認証ユーザー名。
 * @param receivedRequestCount - 受信済みフレンド申請件数。
 * @returns 保存完了後に解決される Promise。
 */
export const syncFriendRequestNotificationFromReceivedCount = async (
  username: string,
  receivedRequestCount: number
): Promise<void> => {
  if (!isActiveFriendRequestNotificationUser(username)) {
    return
  }

  const hasPendingReceivedRequest = receivedRequestCount > 0
  const fetchedAt = new Date().toISOString()

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
