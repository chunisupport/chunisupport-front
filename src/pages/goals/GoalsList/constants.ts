/**
 * 目標一覧で作成できる目標数の上限。
 */
export const GOALS_LIMIT = 100

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
 * 目標カードの一括開閉ボタングループを説明するラベル。
 */
export const GOAL_DISCLOSURE_CONTROLS_LABEL = '目標カードの表示'

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
