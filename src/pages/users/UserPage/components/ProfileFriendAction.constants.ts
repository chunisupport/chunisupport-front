import { localizedCopy } from '../../../../i18n'
import type { FriendshipMutationType } from '../../../../queries/friends'

/** プロフィールのフレンド操作の表示文言 */
const FRIEND_ACTION_TEXT = localizedCopy('users.friendAction')

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
  request: FRIEND_ACTION_TEXT.request,
  pending: FRIEND_ACTION_TEXT.pending,
  remove: FRIEND_ACTION_TEXT.remove,
  accept: FRIEND_ACTION_TEXT.accept,
  reject: FRIEND_ACTION_TEXT.reject,
  cancel: FRIEND_ACTION_TEXT.cancel,
  retry: FRIEND_ACTION_TEXT.retry,
  loadingLabel: FRIEND_ACTION_TEXT.loadingLabel,
  failure: FRIEND_ACTION_TEXT.failure,
} as const

/** 操作ごとの確認ダイアログ文言 */
export const PROFILE_FRIEND_DIALOG_COPY: Record<
  ProfileFriendDialogAction,
  ProfileFriendDialogCopy
> = {
  request: {
    title: FRIEND_ACTION_TEXT.requestTitle,
    confirmLabel: FRIEND_ACTION_TEXT.requestConfirm,
    busyLabel: FRIEND_ACTION_TEXT.sending,
    confirmVariant: 'primary',
    successMessage: FRIEND_ACTION_TEXT.requestSuccess,
    operation: 'request',
  },
  cancel: {
    title: FRIEND_ACTION_TEXT.cancelTitle,
    confirmLabel: FRIEND_ACTION_TEXT.cancelConfirm,
    busyLabel: FRIEND_ACTION_TEXT.cancelling,
    confirmVariant: 'danger',
    successMessage: FRIEND_ACTION_TEXT.cancelSuccess,
    operation: 'cancel',
  },
  remove: {
    title: FRIEND_ACTION_TEXT.removeTitle,
    confirmLabel: FRIEND_ACTION_TEXT.remove,
    busyLabel: FRIEND_ACTION_TEXT.removing,
    confirmVariant: 'danger',
    successMessage: FRIEND_ACTION_TEXT.removeSuccess,
    operation: 'remove',
  },
  accept: {
    title: FRIEND_ACTION_TEXT.acceptTitle,
    confirmLabel: FRIEND_ACTION_TEXT.accept,
    busyLabel: FRIEND_ACTION_TEXT.accepting,
    confirmVariant: 'primary',
    successMessage: FRIEND_ACTION_TEXT.acceptSuccess,
    operation: 'accept',
  },
  reject: {
    title: FRIEND_ACTION_TEXT.rejectTitle,
    confirmLabel: FRIEND_ACTION_TEXT.reject,
    busyLabel: FRIEND_ACTION_TEXT.rejecting,
    confirmVariant: 'danger',
    successMessage: FRIEND_ACTION_TEXT.rejectSuccess,
    operation: 'reject',
  },
}
