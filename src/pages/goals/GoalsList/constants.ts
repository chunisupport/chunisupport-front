/**
 * 目標一覧で作成できる目標数の上限。
 */
export const GOALS_LIMIT = 100

/**
 * 目標タイトルとして入力できる最大文字数。
 */
export const GOAL_TITLE_MAX_LENGTH = 30

/**
 * 複製した目標タイトルの末尾に付ける文言。
 */
export const GOAL_COPY_TITLE_SUFFIX = '（コピー）'

/**
 * 目標のコピーに失敗したときの既定エラーメッセージ。
 */
export const GOAL_COPY_ERROR_MESSAGE = '目標のコピーに失敗しました。'

/**
 * 目標コピー中のプレースホルダーを説明するアクセシブルラベル。
 */
export const GOAL_COPY_LOADING_LABEL = '目標をコピー中'

/**
 * 未達成レコード表示へ遷移できない場合の既定エラーメッセージ。
 */
export const RECORD_NAVIGATION_ERROR_MESSAGE = '未達成レコードの表示に失敗しました。'

/**
 * 目標の並び順保存に失敗したときの既定エラーメッセージ。
 */
export const GOAL_REORDER_ERROR_MESSAGE = '並び順の保存に失敗しました。'

/**
 * カード全体の並び替え操作を案内するアクセシブルラベルを作る。
 *
 * @param title - 目標タイトル。
 * @param position - 現在の表示位置。
 * @param total - 目標の総数。
 * @returns ドラッグとキーボード操作を案内するラベル。
 */
export const buildGoalDragLabel = (title: string, position: number, total: number): string =>
  `${title}の並び替え、${total}件中${position}番目。ドラッグまたは上下矢印キーで移動`

/**
 * 並び替え結果のスクリーンリーダー通知を作る。
 *
 * @param title - 移動した目標タイトル。
 * @param position - 移動後の表示位置。
 * @param total - 目標の総数。
 * @returns 移動後の位置を伝える通知文。
 */
export const buildGoalReorderAnnouncement = (
  title: string,
  position: number,
  total: number
): string => `${title}を${total}件中${position}番目に移動しました`

/**
 * 目標作成ボタンに表示するラベル。
 */
export const ADD_GOAL_LABEL = '目標を追加'

/**
 * 全目標カードを展開するボタンのラベル。
 */
export const EXPAND_ALL_GOALS_LABEL = 'すべて開く'

/**
 * 全目標カードを折りたたむボタンのラベル。
 */
export const COLLAPSE_ALL_GOALS_LABEL = 'すべて閉じる'

/**
 * 目標カードの開閉ボタンに付与するアクセシブルラベルを作る。
 *
 * @param title - 開閉対象の目標タイトル。
 * @param open - 現在カードが開いているか。
 * @returns 次に実行する開閉操作を表すラベル。
 */
export const buildGoalDisclosureLabel = (title: string, open: boolean): string =>
  `${title}を${open ? '閉じる' : '開く'}`

/**
 * 目標数が上限に達したときに表示するメッセージ。
 */
export const GOALS_LIMIT_REACHED_MESSAGE = `目標は${GOALS_LIMIT}件まで作成できます。不要な目標を削除してください。`

/**
 * 目標が未登録のときに表示するメッセージ。
 */
export const EMPTY_GOALS_MESSAGE = `目標がありません。「${ADD_GOAL_LABEL}」から作成してください。`

/** 目標グループ機能で画面表示する固定文言。 */
export const GOAL_GROUP_COPY = {
  fieldLabel: 'グループ',
  manageButtonLabel: '目標グループを管理',
  previousButtonLabel: '前の目標グループ',
  nextButtonLabel: '次の目標グループ',
  manageDialogTitle: '目標グループを管理',
  newNameLabel: '新しいグループ名',
  nameLabel: 'グループ名',
  sortableRoleDescription: '並び替え可能な目標グループ',
  addAction: '追加',
  emptyMessage: 'グループはありません。',
  editCancelAction: '取消',
  saveAction: '保存',
  closeAction: '閉じる',
  deleteDialogTitle: 'グループを削除しますか？',
  cancelAction: 'キャンセル',
  deleteAction: '削除する',
  createError: 'グループの作成に失敗しました。',
  updateError: 'グループ名の更新に失敗しました。',
  deleteError: 'グループの削除に失敗しました。',
  reorderError: 'グループの並び替えに失敗しました。',
} as const

/** 目標グループ一覧で選択できる表示モード。 */
export type GoalGroupDisplayMode = 'horizontal' | 'all'

/** 目標グループ表示モード切り替えで使う固定文言。 */
export const GOAL_GROUP_DISPLAY_MODE_COPY = {
  label: '目標グループの表示形式',
  horizontal: '横切り替え',
  all: '1画面',
} as const

/**
 * 目標グループ数が上限に達したときの文言を作る。
 *
 * @param limit - 作成可能なグループ数。
 * @returns グループ数の上限を示す文言。
 */
export const buildGoalGroupLimitMessage = (limit: number): string =>
  `グループは${limit}件までです。`

/**
 * 目標グループのドラッグ操作を案内するラベルを作る。
 *
 * @param name - グループ名。
 * @param position - 現在位置。
 * @param total - グループ総数。
 * @returns 並び替え操作用のラベル。
 */
export const buildGoalGroupDragLabel = (name: string, position: number, total: number): string =>
  `${name}を並び替え。${position}/${total}`

/**
 * 目標グループの改名ボタン用ラベルを作る。
 *
 * @param name - グループ名。
 * @returns 改名操作用のラベル。
 */
export const buildGoalGroupEditLabel = (name: string): string => `${name}を改名`

/**
 * 目標グループの削除ボタン用ラベルを作る。
 *
 * @param name - グループ名。
 * @returns 削除操作用のラベル。
 */
export const buildGoalGroupDeleteLabel = (name: string): string => `${name}を削除`

/**
 * 目標グループ削除時の影響を説明する文言を作る。
 *
 * @param name - 削除対象のグループ名。
 * @returns 未分類への移動を示す確認文言。
 */
export const buildGoalGroupDeleteDescription = (name: string): string =>
  `「${name}」内の目標は未分類の末尾へ移動します。`

/**
 * 目標グループ並び替え後の読み上げ文言を作る。
 *
 * @param name - 移動したグループ名。
 * @param position - 移動後の位置。
 * @param total - グループ総数。
 * @returns 移動結果を伝える文言。
 */
export const buildGoalGroupReorderAnnouncement = (
  name: string,
  position: number,
  total: number
): string => `${name}を${total}件中${position}番目に移動しました`
