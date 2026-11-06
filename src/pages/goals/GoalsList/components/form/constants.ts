/**
 * 件数目標の保存前検証で、変換後の目標件数が不正な場合に表示するエラーメッセージ。
 */
export const ERROR_MESSAGE_INVALID_COUNT_TARGET =
  '件数目標の変換結果が0以下です。条件または入力値を見直してください。'

/**
 * 達成条件ステップで、ユーザーに入力対象を案内する説明文。
 */
export const STEP3_DESCRIPTION = '目標の種別と値を設定します。'

/**
 * 進捗プレビューで現在値ではなく達成までの残量を表示するチェックボックスのラベル。
 */
export const LABEL_INVERT_VALUE = '達成までの残数を表示'

/**
 * 進捗プレビューで達成率ではなく達成までの残り割合を表示するチェックボックスのラベル。
 */
export const LABEL_INVERT_PERCENTAGE = '達成までの残り割合を表示'

/**
 * 達成率表示もゲージのスタート位置から計算するチェックボックスのラベル。
 */
export const LABEL_APPLY_GAUGE_START_TO_PERCENTAGE = '達成率もスタート位置から計算'

/** ゲージを0から描く選択肢のラベル。 */
export const LABEL_GAUGE_START_MODE_ZERO = '最初から'

/** 保存時点の現在値からゲージを描く選択肢のラベル。 */
export const LABEL_GAUGE_START_MODE_CURRENT = '現在値から'

/** 入力した数値からゲージを描く選択肢のラベル。 */
export const LABEL_GAUGE_START_MODE_CUSTOM = '任意の数値から'

/**
 * 「現在値から」を選んだ後に目標値を下げ、現在値が目標値に達した場合に表示するエラーメッセージ。
 */
export const ERROR_MESSAGE_GAUGE_START_CURRENT_REACHED_TARGET =
  '現在値が目標値に達しているため、現在値からは始められません。'

/**
 * ゲージのスタート位置が整数でない、または負の場合に表示するエラーメッセージ。
 */
export const ERROR_MESSAGE_GAUGE_START_INTEGER =
  'ゲージのスタート位置は0以上の整数で入力してください。'

/**
 * ゲージのスタート位置が許可する小数桁数を超える、または負の場合に表示するエラーメッセージを作る。
 *
 * @param decimalPlaces - 許可する小数桁数。
 * @returns 入力欄の下に表示するエラーメッセージ。
 */
export const buildGaugeStartDecimalErrorMessage = (decimalPlaces: number): string =>
  `ゲージのスタート位置は0以上、小数第${decimalPlaces}位以内で入力してください。`

/**
 * ゲージのスタート位置が目標値以上の場合に表示するエラーメッセージ。
 */
export const ERROR_MESSAGE_GAUGE_START_NOT_BELOW_TARGET =
  'ゲージのスタート位置は目標値より小さくしてください。'

/** 単曲レート目標の初期入力値 */
export const DEFAULT_RATING_GOAL_VALUE = '18'

/** 単曲レート目標の入力欄ラベル */
export const RATING_GOAL_FIELD_LABEL = '単曲レート'

/** 単曲レート目標で許可する最小値 */
export const RATING_GOAL_MIN_VALUE = 0.01

/** 単曲レート目標で許可する小数点以下桁数 */
export const RATING_GOAL_DECIMAL_PLACES = 2

/** OVER POWER目標で許可する小数点以下桁数。APIの total 精度に合わせる */
export const OVERPOWER_TARGET_DECIMAL_PLACES = 3
