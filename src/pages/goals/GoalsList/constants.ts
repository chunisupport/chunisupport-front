import { formatMessage, localizedCopy } from '../../../i18n'

/** 目標一覧の表示文言 */
export const GOALS_LIST_COPY = localizedCopy('goals.list')
/**
 * 目標一覧で作成できる目標数の上限。
 * APIの `goal_limit_exceeded` 判定と揃える。
 */
export const GOALS_LIMIT = 300

/**
 * 目標タイトルとして入力できる最大文字数。
 */
export const GOAL_TITLE_MAX_LENGTH = 30

/**
 * 複製した目標タイトルの末尾に付ける文言。
 */
/**
 * 目標のコピーに失敗したときの既定エラーメッセージ。
 */
/**
 * 目標コピー中のプレースホルダーを説明するアクセシブルラベル。
 */
/**
 * 未達成レコード表示へ遷移できない場合の既定エラーメッセージ。
 */
/**
 * 目標の並び順保存に失敗したときの既定エラーメッセージ。
 */
/**
 * カード全体の並び替え操作を案内するアクセシブルラベルを作る。
 *
 * @param title - 目標タイトル。
 * @param position - 現在の表示位置。
 * @param total - 目標の総数。
 * @returns ドラッグとキーボード操作を案内するラベル。
 */
export const buildGoalDragLabel = (title: string, position: number, total: number): string =>
  formatMessage(GOALS_LIST_COPY.dragLabel, { title, total, position })

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
): string => formatMessage(GOALS_LIST_COPY.reorderAnnouncement, { title, total, position })

/**
 * 目標作成ボタンに表示するラベル。
 */
/**
 * 全目標カードを展開するボタンのラベル。
 */
/**
 * 全目標カードを折りたたむボタンのラベル。
 */
/**
 * 目標カードの開閉ボタンに付与するアクセシブルラベルを作る。
 *
 * @param title - 開閉対象の目標タイトル。
 * @param open - 現在カードが開いているか。
 * @returns 次に実行する開閉操作を表すラベル。
 */
export const buildGoalDisclosureLabel = (title: string, open: boolean): string =>
  formatMessage(open ? GOALS_LIST_COPY.close : GOALS_LIST_COPY.open, { title })

/**
 * 目標数が上限に達したときに表示するメッセージ。
 */
export const GOALS_LIMIT_REACHED_MESSAGE = formatMessage(GOALS_LIST_COPY.limitReached, {
  limit: GOALS_LIMIT,
})

/**
 * 目標が未登録のときに表示するメッセージ。
 */
export const EMPTY_GOALS_MESSAGE = formatMessage(GOALS_LIST_COPY.empty, {
  addGoal: GOALS_LIST_COPY.addGoal,
})

/** 目標グループ機能で画面表示する固定文言 */
export const GOAL_GROUP_COPY = localizedCopy('goals.groups')

/** 目標グループ一覧で選択できる表示モード */
export type GoalGroupDisplayMode = 'horizontal' | 'all'

/** 目標グループ表示モード切り替えで使う固定文言 */
export const GOAL_GROUP_DISPLAY_MODE_COPY = localizedCopy('goals.groupDisplayMode')

/**
 * 目標グループ数が上限に達したときの文言を作る。
 *
 * @param limit - 作成可能なグループ数。
 * @returns グループ数の上限を示す文言。
 */
export const buildGoalGroupLimitMessage = (limit: number): string =>
  formatMessage(GOAL_GROUP_COPY.limit, { limit })

/**
 * 目標グループのドラッグ操作を案内するラベルを作る。
 *
 * @param name - グループ名。
 * @param position - 現在位置。
 * @param total - グループ総数。
 * @returns 並び替え操作用のラベル。
 */
export const buildGoalGroupDragLabel = (name: string, position: number, total: number): string =>
  formatMessage(GOAL_GROUP_COPY.dragLabel, { name, position, total })

/**
 * 目標グループの改名ボタン用ラベルを作る。
 *
 * @param name - グループ名。
 * @returns 改名操作用のラベル。
 */
export const buildGoalGroupEditLabel = (name: string): string =>
  formatMessage(GOAL_GROUP_COPY.editLabel, { name })

/**
 * 目標グループの削除ボタン用ラベルを作る。
 *
 * @param name - グループ名。
 * @returns 削除操作用のラベル。
 */
export const buildGoalGroupDeleteLabel = (name: string): string =>
  formatMessage(GOAL_GROUP_COPY.deleteLabel, { name })

/**
 * 目標グループ削除時の影響を説明する文言を作る。
 *
 * @param name - 削除対象のグループ名。
 * @returns 未分類への移動を示す確認文言。
 */
export const buildGoalGroupDeleteDescription = (name: string): string =>
  formatMessage(GOAL_GROUP_COPY.deleteDescription, { name })

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
): string => formatMessage(GOAL_GROUP_COPY.reorderAnnouncement, { name, total, position })
