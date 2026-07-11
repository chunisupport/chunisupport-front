const POSITIVE_SCORE_DIFFERENCE_CLASS = 'text-success'
const NEGATIVE_SCORE_DIFFERENCE_CLASS = 'text-info'
const EQUAL_SCORE_DIFFERENCE_CLASS = 'text-text-muted'

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
