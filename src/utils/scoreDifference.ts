import { truncateDecimal } from './numberFormat'

/** 正のスコア差へ適用する文字色クラス */
export const POSITIVE_SCORE_DIFFERENCE_CLASS = 'text-success'
/** 負のスコア差へ適用する専用の文字色クラス */
export const NEGATIVE_SCORE_DIFFERENCE_CLASS = 'text-score-difference-negative'
/** 差がないときに適用する文字色クラス */
export const EQUAL_SCORE_DIFFERENCE_CLASS = 'text-text-muted'

/**
 * スコア差を符号付きの整数表示へ変換する。
 *
 * @param difference - 表示するスコア差。
 * @returns 桁区切りと符号を付けた差分文字列。
 */
export const formatScoreDifference = (difference: number): string =>
  difference.toLocaleString('ja-JP', {
    signDisplay: 'always',
  })

/**
 * 画面表示に使う平均スコアと自分のスコアとの差分を算出する。
 * 平均スコアは表示と同じ桁数で切り捨ててから差を取り、表示値どうしの差と一致させる。
 *
 * @param ownScore - ログインユーザーの譜面スコア。未プレイの場合は未定義。
 * @param averageScore - 集計された平均スコア。集計対象がない場合はnull。
 * @param decimalPlaces - 平均スコアを表示する小数点以下桁数。既定値は0（整数表示）。
 * @returns 自分のスコアから切り捨て後の平均スコアを引いた値。算出できない場合は未定義。
 */
export const calculateDisplayedScoreDifference = (
  ownScore: number | undefined,
  averageScore: number | null,
  decimalPlaces = 0
): number | undefined => {
  if (ownScore === undefined || averageScore === null) return undefined
  const factor = 10 ** decimalPlaces
  // 浮動小数点の誤差を表示桁数で丸めて除去する。
  return Math.round((ownScore - truncateDecimal(averageScore, decimalPlaces)) * factor) / factor
}

/**
 * スコア差に応じた共通の文字色クラスを返す。
 *
 * @param difference - 基準スコアとの差。
 * @returns 正数は緑、負数は青、同値は補助テキスト色のクラス。
 */
export const getScoreDifferenceClass = (difference: number): string => {
  if (difference > 0) return POSITIVE_SCORE_DIFFERENCE_CLASS
  if (difference < 0) return NEGATIVE_SCORE_DIFFERENCE_CLASS
  return EQUAL_SCORE_DIFFERENCE_CLASS
}
