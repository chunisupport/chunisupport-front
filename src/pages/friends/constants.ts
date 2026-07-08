import type { AppTabOption } from '../../components/common/AppTabs'

/** フレンド画面に表示するタイトル。 */
export const FRIENDS_PAGE_TITLE = 'フレンド'

/** フレンド画面のタブ値。 */
export type FriendsTabValue = 'friends' | 'received' | 'sent'

/** フレンド画面のタブ選択肢。 */
export const FRIENDS_TAB_OPTIONS: readonly AppTabOption<FriendsTabValue>[] = [
  { value: 'friends', label: 'フレンド' },
  { value: 'received', label: '受信申請' },
  { value: 'sent', label: '送信申請' },
]

/** フレンド画面で使う固定文言。 */
export const FRIENDS_COPY = {
  requestFormTitle: 'フレンド申請',
  usernameLabel: 'ユーザー名',
  usernamePlaceholder: 'targetuser',
  submitRequest: '申請',
  submittingRequest: '申請中',
  requestSuccess: 'フレンド申請を送信しました。',
  acceptSuccess: 'フレンド申請を承認しました。',
  rejectSuccess: 'フレンド申請を拒否しました。',
  removeSuccess: 'フレンドを解除しました。',
  requestFailure: 'フレンド申請に失敗しました。',
  operationFailure: '操作に失敗しました。',
  loadingLabel: 'フレンド情報を読み込んでいます',
  emptyFriends: 'フレンドはいません。',
  emptyReceived: '受信申請はありません。',
  emptySent: '送信申請はありません。',
  retry: '再読み込み',
  profile: 'プロフィール',
  accept: '承認',
  reject: '拒否',
  remove: '解除',
  levelLabel: 'Lv',
  ratingLabel: 'Rating',
  requestedAt: '申請',
  acceptedAt: '成立',
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
