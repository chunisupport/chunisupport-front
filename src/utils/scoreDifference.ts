const POSITIVE_SCORE_DIFFERENCE_CLASS = 'text-success'
/** 負のスコア差へ適用する専用の文字色クラス。 */
const NEGATIVE_SCORE_DIFFERENCE_CLASS = 'text-score-difference-negative'
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
 * 画面表示に使う整数の平均スコアと自分のスコアとの差分を算出する。
 *
 * @param ownScore - ログインユーザーの譜面スコア。未プレイの場合は未定義。
 * @param averageScore - 集計された平均スコア。集計対象がない場合はnull。
 * @returns 自分のスコアから切り捨て後の平均スコアを引いた値。算出できない場合は未定義。
 */
export const calculateDisplayedScoreDifference = (
  ownScore: number | undefined,
  averageScore: number | null
): number | undefined =>
  ownScore === undefined || averageScore === null ? undefined : ownScore - Math.trunc(averageScore)

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
