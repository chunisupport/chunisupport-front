import type { AppTabOption } from '../../components/common/AppTabs'
import { FRIENDS_PATH } from '../../constants/routes'

export { FRIENDS_PAGE_TITLE } from '../../constants/pageTitles'

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
  { value: 'friends', label: 'フレンド' },
  { value: 'received', label: '受付中', hasNotificationDot: hasPendingReceivedRequest },
  { value: 'sent', label: '申請中' },
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
export const FRIENDS_COPY = {
  requestFormTitle: 'フレンド申請',
  usernameLabel: 'ユーザー名',
  usernamePlaceholder: 'username',
  ownUsernameLabel: 'あなたのユーザー名',
  copyOwnUsername: 'ユーザー名をコピー',
  copyOwnUsernameSuccess: 'ユーザー名をコピーしました。',
  copyOwnUsernameFailure: 'ユーザー名のコピーに失敗しました。',
  submitRequest: '申請',
  submittingRequest: '申請中',
  requestSuccess: 'フレンド申請を送信しました。',
  cancelSuccess: 'フレンド申請を取り消しました。',
  requestUserNotFound: 'ユーザーが見つかりません',
  acceptSuccess: 'フレンド申請を承認しました。',
  rejectSuccess: 'フレンド申請を拒否しました。',
  removeSuccess: 'フレンドを解除しました。',
  requestFailure: 'フレンド申請に失敗しました。',
  operationFailure: '操作に失敗しました。',
  loadingLabel: 'フレンド情報を読み込んでいます',
  emptyFriends: 'フレンドはいません。',
  emptyReceived: '受付中のフレンドリクエストはありません。',
  emptySent: '送信済みのフレンドリクエストはありません。',
  retry: '再読み込み',
  openFriendMenu: 'フレンドメニューを開く',
  accept: '承認',
  reject: '拒否',
  cancelRequest: '申請取り消し',
  remove: '解除',
  levelLabel: 'Lv',
  ratingLabel: 'Rating',
  privateAccountLabel: '非公開アカウント',
  playerNotLinked: '未連携',
  noRating: '-',
  rejectConfirm: 'このフレンド申請を拒否しますか？',
  removeConfirm: 'このフレンドを解除しますか？',
  confirmCancel: 'キャンセル',
  confirmRejectTitle: '申請を拒否しますか？',
  confirmRemoveTitle: 'フレンドを解除しますか？',
  confirmRejectDescription: 'この申請を拒否します。この操作は取り消せません。',
  confirmRemoveDescription: 'このフレンド関係を解除します。この操作は取り消せません。',
  confirmingReject: '拒否中',
  confirmingRemove: '解除中',
  emptyValue: '-',
} as const
