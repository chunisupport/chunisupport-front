/** バージョン管理画面で使用する表示文言 */
export const ADMIN_VERSIONS_COPY = {
  pageTitle: 'バージョン管理',
  pageDescription: 'バージョン名と稼働日を管理します。',
  createButton: 'バージョンを追加',
  createDialogTitle: 'バージョンを追加',
  createDialogDescription: 'バージョン名と稼働日を入力します。',
  editDialogTitle: 'バージョン名を編集',
  editDialogDescription: '稼働日は変更せず、バージョン名だけを更新します。',
  nameLabel: 'バージョン名',
  releasedAtLabel: '稼働日',
  cancelButton: 'キャンセル',
  createSubmit: '追加する',
  saveSubmit: '保存する',
  saving: '保存中...',
  actionsHeading: '操作',
  latestLabel: '最新版',
  editAction: '編集',
  deleteAction: '削除',
  emptyState: '登録されているバージョンがありません。',
  createSuccess: 'バージョンを追加しました。',
  createError: 'バージョンの追加に失敗しました。',
  editSuccess: 'バージョン名を更新しました。',
  editError: 'バージョン名の更新に失敗しました。',
  deleteSuccess: 'バージョンを削除しました。',
  deleteError: 'バージョンの削除に失敗しました。',
  deleteDialogTitle: '最新版を削除しますか？',
  deleteDialogDescription: 'この操作は取り消せません。対象期間に楽曲がある場合は削除されません。',
  deleting: '削除中...',
  deleteSubmit: '削除する',
} as const

/** バージョン入力のAPI制約 */
export const VERSION_INPUT_CONSTRAINTS = {
  nameMaxLength: 50,
  namePattern: 'CHUNITHM .+',
} as const

/**
 * バージョン編集ボタンのアクセシブルなラベルを生成する。
 *
 * @param versionName - 対象バージョン名。
 * @returns スクリーンリーダー向けの編集ラベル。
 */
export const formatVersionEditLabel = (versionName: string): string => `${versionName}を編集`

/**
 * バージョン削除ボタンのアクセシブルなラベルを生成する。
 *
 * @param versionName - 対象バージョン名。
 * @returns スクリーンリーダー向けの削除ラベル。
 */
export const formatVersionDeleteLabel = (versionName: string): string => `${versionName}を削除`

/**
 * 削除確認ダイアログで対象バージョン名を示す文面を生成する。
 *
 * @param versionName - 削除対象のバージョン名。
 * @returns 対象名を含む削除確認の前文。
 */
export const formatVersionDeleteTargetMessage = (versionName: string): string =>
  `「${versionName}」を削除します。`
