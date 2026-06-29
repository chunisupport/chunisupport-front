/**
 * 目標一覧で作成できる目標数の上限。
 */
export const GOALS_LIMIT = 100

/**
 * 未達成レコード表示へ遷移できない場合の既定エラーメッセージ。
 */
export const RECORD_NAVIGATION_ERROR_MESSAGE = '未達成レコードの表示に失敗しました。'

/**
 * 目標作成ボタンに表示するラベル。
 */
export const ADD_GOAL_LABEL = '目標を追加'

/**
 * 目標数が上限に達したときに表示するメッセージ。
 */
export const GOALS_LIMIT_REACHED_MESSAGE = `目標は${GOALS_LIMIT}件まで作成できます。不要な目標を削除してください。`

/**
 * 目標が未登録のときに表示するメッセージ。
 */
export const EMPTY_GOALS_MESSAGE = `目標がありません。「${ADD_GOAL_LABEL}」から作成してください。`
