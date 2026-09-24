import type { FriendshipMutationType } from '../../../../queries/friends'

/** プロフィールカードから実行するフレンド操作 */
export type ProfileFriendDialogAction = 'request' | 'cancel' | 'remove' | 'accept' | 'reject'

/** 確認ダイアログと成功通知で使う操作ごとの文言 */
export type ProfileFriendDialogCopy = {
  /** ダイアログの見出し */
  title: string
  /** 確定ボタンの文言 */
  confirmLabel: string
  /** 実行中の確定ボタン文言 */
  busyLabel: string
  /** 確定ボタンの見た目 */
  confirmVariant: 'primary' | 'danger'
  /** 成功時のトースト文言 */
  successMessage: string
  /** 成功後に無効化するqueryの操作種別 */
  operation: FriendshipMutationType
}

/** プロフィールカードのフレンド操作で使う固定文言 */
export const PROFILE_FRIEND_ACTION_COPY = {
  request: 'フレンド申請',
  pending: '申請中',
  remove: '解除',
  accept: '承認',
  reject: '拒否',
  cancel: 'キャンセル',
  retry: '再読み込み',
  loadingLabel: 'フレンド状態を読み込んでいます',
  failure: '操作に失敗しました。',
} as const

/** 操作ごとの確認ダイアログ文言 */
export const PROFILE_FRIEND_DIALOG_COPY: Record<
  ProfileFriendDialogAction,
  ProfileFriendDialogCopy
> = {
  request: {
    title: 'フレンド申請を送信しますか？',
    confirmLabel: '申請',
    busyLabel: '送信中',
    confirmVariant: 'primary',
    successMessage: 'フレンド申請を送信しました。',
    operation: 'request',
  },
  cancel: {
    title: 'フレンド申請を取り消しますか？',
    confirmLabel: '申請取り消し',
    busyLabel: '取り消し中',
    confirmVariant: 'danger',
    successMessage: 'フレンド申請を取り消しました。',
    operation: 'cancel',
  },
  remove: {
    title: 'フレンドを解除しますか？',
    confirmLabel: '解除',
    busyLabel: '解除中',
    confirmVariant: 'danger',
    successMessage: 'フレンドを解除しました。',
    operation: 'remove',
  },
  accept: {
    title: 'フレンド申請を承認しますか？',
    confirmLabel: '承認',
    busyLabel: '承認中',
    confirmVariant: 'primary',
    successMessage: 'フレンド申請を承認しました。',
    operation: 'accept',
  },
  reject: {
    title: 'フレンド申請を拒否しますか？',
    confirmLabel: '拒否',
    busyLabel: '拒否中',
    confirmVariant: 'danger',
    successMessage: 'フレンド申請を拒否しました。',
    operation: 'reject',
  },
}
