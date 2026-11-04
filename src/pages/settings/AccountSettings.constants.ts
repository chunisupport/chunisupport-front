import type { ErrorCode } from '../../types/api'

/** アカウント設定のユーザーネーム変更欄で使用する表示文言。 */
export const USERNAME_CHANGE_COPY = {
  title: 'ユーザーネームを変更',
  label: '新しいユーザーネーム',
  placeholder: '新しいユーザーネームを入力',
  formatHint: '5〜50文字の小文字英数字',
  submit: '変更する',
  submitting: '変更中...',
  invalid: '5〜50文字の小文字英数字で入力してください。',
  unchanged: '現在と異なるユーザーネームを入力してください。',
  success: 'ユーザーネームを変更しました。',
  failure: 'ユーザーネームの変更に失敗しました。',
  userMismatch: 'ログイン中のアカウントと異なるアカウントで再認証されました。',
  recentSignInExpired: '再認証の有効期限が切れています。もう一度お試しください。',
} as const

/** アカウント設定のログイン方法欄で使用する表示文言。 */
export const LOGIN_METHOD_COPY = {
  title: 'ログイン方法',
  notLinked: '未連携',
  link: '連携する',
  linking: '連携中...',
  unlink: '連携を解除',
  unlinking: '解除中...',
  linkFailure: '連携に失敗しました。',
  unlinkFailure: '連携の解除に失敗しました。',
  signedOut: 'ログインしていません。再度ログインしてください。',
  /** 連携が完了した認証プロバイダを名指しする。 */
  linkSuccess: (label: string) => `${label}を連携しました。`,
  /** 連携を解除した認証プロバイダを名指しする。 */
  unlinkSuccess: (label: string) => `${label}の連携を解除しました。`,
  /** 別のユーザーが使っているアカウントを選んだ場合に、選び直してもらう。 */
  alreadyInUse: (label: string) => `この${label}アカウントはすでに別のユーザーで使用されています。`,
} as const

/** 連携先のアカウントが別のユーザーで使われていることを表すFirebaseのエラーコード。 */
export const LOGIN_METHOD_IN_USE_ERROR_CODE = 'auth/credential-already-in-use'

/** アカウント設定のGoogleアカウント変更欄で使用する表示文言。 */
export const GOOGLE_ACCOUNT_CHANGE_COPY = {
  title: 'Googleアカウントを変更',
  stepsLabel: '変更の手順',
  steps: { select: '変更先を選択', confirm: '本人確認', done: '完了' },
  stepCompleted: '（完了済み）',
  currentLabel: '現在',
  open: '変更する',
  select: '変更先を選択',
  selecting: '選択中...',
  reselect: '選び直す',
  proceed: '本人確認へ進む',
  reauthTitle: '本人確認',
  reauthSubmit: 'このアカウントで本人確認',
  submitting: '変更中...',
  close: '閉じる',
  success: 'Googleアカウントを変更しました。',
  failure: 'Googleアカウントの変更に失敗しました。',
  /** 本人確認に使うアカウントを名指しして、選び直してもらう。 */
  userMismatch: (email: string) => `${email} を選択してください。`,
  recentSignInExpired: '有効期限が切れました。変更先をもう一度選択してください。',
  /** 旧アカウントが削除されるため、連携していたXでのログインも使えなくなる。 */
  xLinkRemoved: 'X連携は解除されます',
} as const

/** Googleアカウント変更で、変更先を選び直す必要があるAPIエラーコード。 */
export const GOOGLE_ACCOUNT_CHANGE_RESELECT_ERROR_CODES: ReadonlySet<string> = new Set<ErrorCode>([
  'recent_sign_in_required',
  'firebase_uid_already_linked',
  'firebase_account_unchanged',
])

/** 退会確認ダイアログで使用する表示文言。 */
export const ACCOUNT_DELETE_COPY = {
  title: '本当に退会しますか？',
  description:
    'ユーザー情報、プレイヤーデータ、目標、APIトークンがすべて削除されます。本人確認のため再認証が必要です。',
  cancel: 'キャンセル',
  confirm: '退会する',
  deleting: '処理中...',
  userMismatch: 'ログイン中のアカウントと異なるアカウントで再認証されました。',
  recentSignInExpired: '再認証の有効期限が切れています。もう一度お試しください。',
  failure: '退会処理に失敗しました。',
} as const
