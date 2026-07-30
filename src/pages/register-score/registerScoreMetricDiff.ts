import { formatOverPowerValue } from '../../utils/overPowerFormat'
import { formatPlayerRating } from '../../utils/ratingFormat'

/**
 * 数値差分を指定フォーマットの符号付き文字列へ変換する。
 *
 * @param delta - APIが返した更新前後の差分。
 * @param formatter - 差分の絶対値を表示文字列へ変換する関数。
 * @returns 符号付き差分。表示桁未満または差分がない場合はnull。
 */
const formatSignedMetricDelta = (
  delta: number | null,
  formatter: (value: number) => string
): string | null => {
  if (delta === null) return null

  const magnitude = formatter(Math.abs(delta))
  if (Number(magnitude) === 0) return null

  return `${delta > 0 ? '+' : '-'}${magnitude}`
}

/**
 * レート差分をプレイヤーレートと同じ精度で表示する。
 *
 * @param delta - APIが返したレート差分。
 * @returns 小数点以下4桁の符号付き差分。表示対象外の場合はnull。
 */
export const formatRegisterScoreRatingDelta = (delta: number | null): string | null =>
  formatSignedMetricDelta(delta, formatPlayerRating)

/**
 * OVER POWER差分を現在値と同じ精度で表示する。
 *
 * @param delta - APIが返したOVER POWER値差分。
 * @returns 小数点以下3桁の符号付き差分。表示対象外の場合はnull。
 */
export const formatRegisterScoreOverPowerDelta = (delta: number | null): string | null =>
  formatSignedMetricDelta(delta, formatOverPowerValue)

/**
 * メトリクス差分の増減に応じたデザイントークン由来の文字色を返す。
 *
 * @param delta - APIが返した更新前後の差分。
 * @returns 増加時は青、減少時は危険色、差分なしは通常文字色のクラス。
 */
export const getRegisterScoreMetricDeltaClass = (delta: number | null): string => {
  if (delta === null || delta === 0) return 'text-text'
  return delta > 0 ? 'text-blue-700' : 'text-danger'
}
