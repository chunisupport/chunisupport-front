import { localizedCopy } from '../../i18n'
import type { AppTabOption } from '../../components/common/AppTabs'
import { FRIENDS_PATH } from '../../constants/routes'

/** フレンド画面の表示文言 */
const FRIENDS_TEXT = localizedCopy('friends')

export { PAGE_TITLES } from '../../constants/pageTitles'

/** ユーザー名コピー成功表示を維持する時間(ms) */
export const FRIENDS_COPY_FEEDBACK_DURATION_MS = 1200

/** フレンド申請 username 入力のエラー表示ID */
export const FRIEND_REQUEST_USERNAME_ERROR_ID = 'friend-request-username-error'

/** フレンド画面のタブ値 */
export type FriendsTabValue = 'friends' | 'received' | 'sent'

/**
 * フレンド画面のタブ選択肢を通知状態つきで生成する。
 *
 * @param hasPendingReceivedRequest - 受付中タブへ通知ドットを表示するか。
 * @returns フレンド画面のタブ選択肢。
 */
export const buildFriendsTabOptions = (
  hasPendingReceivedRequest: boolean
): readonly AppTabOption<FriendsTabValue>[] => [
  { value: 'friends', label: FRIENDS_TEXT.friendsLabel },
  { value: 'received', label: FRIENDS_TEXT.receivedLabel, hasNotificationDot: hasPendingReceivedRequest },
  { value: 'sent', label: FRIENDS_TEXT.sentLabel },
]

/** フレンド画面タブに対応するURLパスセグメント */
const FRIENDS_TAB_PATH_SEGMENTS: Record<FriendsTabValue, string> = {
  friends: '',
  received: 'receive',
  sent: 'request',
}

/**
 * フレンド画面タブのURLパスを生成する。
 *
 * @param tab - URLへ反映するタブ値。
 * @returns 対象タブを表示するURLパス。
 */
export const buildFriendsTabPath = (tab: FriendsTabValue): string => {
  const segment = FRIENDS_TAB_PATH_SEGMENTS[tab]
  return segment ? `${FRIENDS_PATH}/${segment}` : FRIENDS_PATH
}

/**
 * URLパスセグメントからフレンド画面タブ値を復元する。
 *
 * @param segment - URLパスのタブ部分。
 * @returns 対応するタブ値。未対応の場合は null。
 */
export const resolveFriendsTabValue = (segment: string | undefined): FriendsTabValue | null => {
  switch (segment) {
    case undefined:
      return 'friends'
    case FRIENDS_TAB_PATH_SEGMENTS.friends:
      return 'friends'
    case FRIENDS_TAB_PATH_SEGMENTS.received:
      return 'received'
    case FRIENDS_TAB_PATH_SEGMENTS.sent:
      return 'sent'
    default:
      return null
  }
}

/** フレンド画面で使う固定文言 */
export const FRIENDS_COPY = localizedCopy('friends.friendsCopy')
