import {
  CLIENT_CACHE_SCHEMA_VERSION,
  db,
  type FriendRequestNotificationState,
} from '../lib/db/cacheDB'

const FRIEND_REQUEST_NOTIFICATION_KEY_PREFIX = 'friendRequestNotification'

/**
 * フレンド申請通知状態の IndexedDB キーを生成する。
 *
 * @param username - 通知状態を保存する認証ユーザー名。
 * @returns ユーザー単位の通知状態キー。
 */
const buildFriendRequestNotificationKey = (username: string): string =>
  `${FRIEND_REQUEST_NOTIFICATION_KEY_PREFIX}:${username}`

/**
 * 保存済みのフレンド申請通知状態を読み込む。
 *
 * @param username - 読み込み対象の認証ユーザー名。
 * @returns 現行スキーマの通知状態。存在しない場合は null。
 */
export const readFriendRequestNotificationState = async (
  username: string
): Promise<FriendRequestNotificationState | null> => {
  const state = await db.friendRequestNotificationStates.get(
    buildFriendRequestNotificationKey(username)
  )

  if (
    !state ||
    state.username !== username ||
    state.schemaVersion !== CLIENT_CACHE_SCHEMA_VERSION
  ) {
    return null
  }

  return state
}

/**
 * フレンド申請通知状態を保存する。
 *
 * @param username - 保存対象の認証ユーザー名。
 * @param hasPendingReceivedRequest - 未処理の受信フレンド申請が存在するか。
 * @param fetchedAt - API取得日時。
 * @returns 保存完了後に解決される Promise。
 */
export const saveFriendRequestNotificationState = async (
  username: string,
  hasPendingReceivedRequest: boolean,
  fetchedAt: string
): Promise<void> => {
  await db.friendRequestNotificationStates.put({
    key: buildFriendRequestNotificationKey(username),
    username,
    schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
    hasPendingReceivedRequest,
    fetchedAt,
  })
}

/**
 * 指定ユーザーのフレンド申請通知状態を削除する。
 *
 * @param username - 削除対象の認証ユーザー名。
 * @returns 削除完了後に解決される Promise。
 */
export const clearFriendRequestNotificationState = async (username: string): Promise<void> => {
  await db.friendRequestNotificationStates.delete(buildFriendRequestNotificationKey(username))
}

/**
 * フレンド申請通知状態を全削除する。
 *
 * @returns 削除完了後に解決される Promise。
 */
export const clearFriendRequestNotificationStates = async (): Promise<void> => {
  await db.friendRequestNotificationStates.clear()
}
