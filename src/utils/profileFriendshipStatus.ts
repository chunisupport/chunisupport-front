/** プロフィール画面で表示するフレンド関係 */
export type ProfileFriendshipStatus = 'none' | 'sent' | 'received' | 'friend'

type FriendshipStatusUser = {
  /** 公開ユーザー名 */
  username: string
}

/**
 * 一覧から、表示中ユーザーとのフレンド関係を決める。
 * 承認済み、送信済み申請、受信済み申請の順に優先する。
 *
 * @param targetUsername - 表示中プロフィールのユーザー名。
 * @param friends - 承認済みフレンド一覧。
 * @param sentRequests - 送信済みフレンド申請一覧。
 * @param receivedRequests - 受信済みフレンド申請一覧。
 * @returns プロフィールカードに出す操作の状態。
 */
export const resolveProfileFriendshipStatus = (
  targetUsername: string,
  friends: readonly FriendshipStatusUser[],
  sentRequests: readonly FriendshipStatusUser[],
  receivedRequests: readonly FriendshipStatusUser[]
): ProfileFriendshipStatus => {
  if (friends.some((user) => user.username === targetUsername)) return 'friend'
  if (sentRequests.some((user) => user.username === targetUsername)) return 'sent'
  if (receivedRequests.some((user) => user.username === targetUsername)) return 'received'
  return 'none'
}
