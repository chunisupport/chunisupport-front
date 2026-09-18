/** コース管理画面で使用する表示文言 */
export const COURSE_MANAGEMENT_COPY = {
  pageDescription: 'コース一覧とコース名、クラスを確認・編集します。',
  createButton: 'コースを追加',
  createDialogTitle: 'コースを追加',
  editDialogTitle: 'コースを編集',
  createDialogDescription: '公式ID、コース名、クラスを入力します。',
  editDialogDescription: 'コース名とクラスを更新します。公式IDは変更できません。',
  displayIdLabel: 'display_id',
  idxLabel: 'idx',
  nameLabel: 'コース名',
  classLabel: 'クラス',
  statusLabel: '状態',
  actionsHeading: '操作',
  classPlaceholder: '選択してください',
  searchPlaceholder: 'コース名・idx・display_idで検索',
  searchLabel: 'コース検索',
  cancelButton: 'キャンセル',
  createSubmit: '追加する',
  saveSubmit: '保存する',
  saving: '保存中...',
  editAction: '編集',
  deleteAction: '削除',
  restoreAction: '復元',
  activeStatus: '有効',
  deletedStatus: '削除済み',
  emptyState: '登録されているコースがありません。',
  emptySearchState: '一致するコースが見つかりません。',
  createSuccess: 'コースを追加しました。',
  createError: 'コースの追加に失敗しました。',
  editSuccess: 'コースを更新しました。',
  editError: 'コースの更新に失敗しました。',
  deleteSuccess: 'コースを削除しました。',
  deleteError: 'コースの削除に失敗しました。',
  restoreSuccess: 'コースを復元しました。',
  restoreError: 'コースの復元に失敗しました。',
  deleteConfirm: 'このコースを削除しますか？',
} as const

/** コース入力のAPI制約 */
export const COURSE_INPUT_LIMITS = {
  idx: 32,
  name: 255,
} as const

/**
 * コース編集ボタンのアクセシブルなラベルを生成する。
 *
 * @param courseName - 対象コース名。
 * @returns スクリーンリーダー向けの編集ラベル。
 */
export const formatCourseEditLabel = (courseName: string): string => `${courseName}を編集`

/**
 * コース削除ボタンのアクセシブルなラベルを生成する。
 *
 * @param courseName - 対象コース名。
 * @returns スクリーンリーダー向けの削除ラベル。
 */
export const formatCourseDeleteLabel = (courseName: string): string => `${courseName}を削除`

/**
 * コース復元ボタンのアクセシブルなラベルを生成する。
 *
 * @param courseName - 対象コース名。
 * @returns スクリーンリーダー向けの復元ラベル。
 */
export const formatCourseRestoreLabel = (courseName: string): string => `${courseName}を復元`
