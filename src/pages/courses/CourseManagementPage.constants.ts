/** コース管理画面で使用する表示文言 */
export const COURSE_MANAGEMENT_COPY = {
  createButton: 'コースを追加',
  createDialogTitle: 'コースを追加',
  editDialogTitle: '基本情報を編集',
  createDialogDescription: '公式ID (idx)、コース名、クラスを入力します。',
  editDialogDescription: 'コース名とクラスを更新します。',
  displayIdLabel: '表示ID',
  idxLabel: '公式ID (idx)',
  nameLabel: 'コース名',
  classLabel: 'クラス',
  allClassesOption: 'すべてのクラス',
  classFilterLabel: 'クラスで絞り込む',
  statusFilterLabel: '構成状態で絞り込む',
  statusFilterAll: 'すべて',
  statusFilterUnconfigured: '未登録',
  statusFilterConfigured: '登録済み',
  statusFilterDeleted: '削除済み',
  classPlaceholder: '選択してください',
  searchPlaceholder: 'コース名・idx・idで検索',
  searchLabel: 'コース検索',
  cancelButton: 'キャンセル',
  createSubmit: '追加する',
  saveSubmit: '保存する',
  saving: '保存中...',
  editBasicInfoAction: '基本情報',
  editTracksAction: '構成編集',
  deleteAction: '削除',
  restoreAction: '復元',
  unconfiguredStatus: '構成未登録',
  deletedStatus: '削除済み',
  unconfiguredSummary: '構成未登録',
  totalCountSuffix: '件',
  showingCountPrefix: '表示中',
  emptyState: '登録されているコースがありません。',
  emptySearchState: '条件に一致するコースが見つかりません。',
  resetFiltersButton: '絞り込みを解除',
  createSuccess: 'コースを追加しました。',
  createError: 'コースの追加に失敗しました。',
  editSuccess: 'コースを更新しました。',
  editError: 'コースの更新に失敗しました。',
  deleteSuccess: 'コースを削除しました。',
  deleteError: 'コースの削除に失敗しました。',
  restoreSuccess: 'コースを復元しました。',
  restoreError: 'コースの復元に失敗しました。',
  deleteDialogTitle: 'コースを削除しますか？',
  deleteSubmit: '削除する',
  deleting: '削除中...',
} as const

/** コース入力のAPI制約 */
export const COURSE_INPUT_LIMITS = {
  idx: 32,
  name: 255,
} as const

/**
 * コース基本情報編集ボタンのアクセシブルなラベルを生成する。
 *
 * @param courseName - 対象コース名。
 * @returns スクリーンリーダー向けの編集ラベル。
 */
export const formatCourseEditLabel = (courseName: string): string => `${courseName}の基本情報を編集`

/**
 * コース削除ボタンのアクセシブルなラベルを生成する。
 *
 * @param courseName - 対象コース名。
 * @returns スクリーンリーダー向けの削除ラベル。
 */
export const formatCourseDeleteLabel = (courseName: string): string => `${courseName}を削除`

/**
 * コース削除の確認ダイアログに表示する対象の説明を生成する。
 *
 * @param courseName - 削除対象のコース名。
 * @returns 確認ダイアログの説明文。
 */
export const formatCourseDeleteTargetMessage = (courseName: string): string =>
  `「${courseName}」を削除します。`

/**
 * コース復元ボタンのアクセシブルなラベルを生成する。
 *
 * @param courseName - 対象コース名。
 * @returns スクリーンリーダー向けの復元ラベル。
 */
export const formatCourseRestoreLabel = (courseName: string): string => `${courseName}を復元`
