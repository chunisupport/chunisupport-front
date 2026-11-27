import type { AppAnnouncementKind } from '../../types/api'
import type { AppAnnouncementStatus } from './adminAppAnnouncement'

/** お知らせ管理画面で使用する表示文言 */
export const ADMIN_APP_ANNOUNCEMENTS_COPY = {
  pageTitle: 'お知らせ管理',
  pageDescription: 'プロフィールカード上部に表示するお知らせを管理します。',
  createButton: 'お知らせを追加',
  createDialogTitle: 'お知らせを追加',
  editDialogTitle: 'お知らせを編集',
  kindLabel: '種別',
  titleLabel: 'タイトル',
  bodyLabel: '本文',
  targetUrlLabel: '遷移先',
  targetUrlPlaceholder: '/tools/... または https://...',
  startsAtLabel: '開始（JST）',
  expiresAtLabel: '終了（JST）',
  periodLabel: '期間（JST）',
  statusLabel: '状態',
  revisionLabel: 'バージョン',
  bumpRevisionLabel: '閉じた人にも再表示する',
  targetUrlInvalid: '/ で始まるパスか、http(s):// で始まるURLを入力してください。',
  periodInvalid: '終了は開始より後にしてください。',
  cancelButton: 'キャンセル',
  createSubmit: '追加する',
  saveSubmit: '保存する',
  saving: '保存中...',
  actionsHeading: '操作',
  editAction: '編集',
  deleteAction: '削除',
  emptyState: '登録されているお知らせがありません。',
  createSuccess: 'お知らせを追加しました。',
  createError: 'お知らせの追加に失敗しました。',
  editSuccess: 'お知らせを更新しました。',
  editError: 'お知らせの更新に失敗しました。',
  deleteSuccess: 'お知らせを削除しました。',
  deleteError: 'お知らせの削除に失敗しました。',
  deleteDialogTitle: 'お知らせを削除しますか？',
  deleteDialogDescription: '配信中の場合は即時に表示されなくなります。この操作は取り消せません。',
  deleting: '削除中...',
  deleteSubmit: '削除する',
} as const

/** お知らせ入力のAPI制約 */
export const APP_ANNOUNCEMENT_INPUT_LIMITS = {
  titleMaxLength: 200,
  targetUrlMaxLength: 2048,
  /** TEXT列の65,535バイトに、全角文字（3バイト）だけでも収まる文字数 */
  bodyMaxLength: 21845,
  bodyRows: 6,
} as const

/** 種別の選択肢 */
export const APP_ANNOUNCEMENT_KIND_OPTIONS: readonly {
  value: AppAnnouncementKind
  label: string
}[] = [
  { value: 'message', label: '本文' },
  { value: 'link', label: 'リンク' },
]

/** 配信状態の表示名 */
export const APP_ANNOUNCEMENT_STATUS_LABELS: Record<AppAnnouncementStatus, string> = {
  scheduled: '予定',
  active: '配信中',
  ended: '終了',
}

/** 配信状態のバッジのクラス */
export const APP_ANNOUNCEMENT_STATUS_CLASSES: Record<AppAnnouncementStatus, string> = {
  scheduled: 'border-info-border bg-info-bg text-info',
  active: 'border-success-border bg-success-bg text-success',
  ended: 'border-border bg-surface-muted text-text-muted',
}

/**
 * お知らせ編集ボタンのアクセシブルなラベルを生成する。
 *
 * @param title - 対象のタイトル。
 * @returns スクリーンリーダー向けの編集ラベル。
 */
export const formatAppAnnouncementEditLabel = (title: string): string => `「${title}」を編集`

/**
 * お知らせ削除ボタンのアクセシブルなラベルを生成する。
 *
 * @param title - 対象のタイトル。
 * @returns スクリーンリーダー向けの削除ラベル。
 */
export const formatAppAnnouncementDeleteLabel = (title: string): string => `「${title}」を削除`

/**
 * 削除確認ダイアログで対象を示す文面を生成する。
 *
 * @param title - 削除対象のタイトル。
 * @returns 対象名を含む削除確認の前文。
 */
export const formatAppAnnouncementDeleteTargetMessage = (title: string): string =>
  `「${title}」を削除します。`
