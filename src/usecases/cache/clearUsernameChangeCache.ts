import type { QueryClient } from '@tanstack/solid-query'
import { clearFriendQueriesForUser } from '../../queries/friends'
import { clearFriendRequestNotificationState } from '../../repositories/friendRequestNotificationRepository'
import { clearCachedUserApiResponses } from '../../repositories/userApiCacheRepository'

/**
 * ユーザーネーム変更後に認証ユーザー用APIキャッシュと旧ユーザーネームのフレンド・通知キャッシュを破棄する。
 *
 * キャッシュ削除はユーザーネーム変更の補助処理のため、失敗しても変更成功を取り消さない。
 *
 * @param queryClient - フレンド関連queryを保持するQueryClient。
 * @param previousUsername - 変更前のユーザーネーム。
 * @returns すべてのキャッシュ削除試行が完了した後に解決されるPromise。
 */
export const clearUsernameChangeCache = async (
  queryClient: QueryClient,
  previousUsername: string
): Promise<void> => {
  await Promise.allSettled([
    clearCachedUserApiResponses(),
    clearFriendQueriesForUser(queryClient, previousUsername),
    clearFriendRequestNotificationState(previousUsername),
  ])
}
