import { formatChartConst } from '../../../../utils/chartConstFormat'
import { formatRecordRating } from '../../../../utils/ratingFormat'

export type ConstDisplay = {
  valueText: string
  markerText: string | null
  className: string
}

export type RatingDisplay = {
  text: string
  className: string
}

const UNKNOWN_STYLE = 'text-danger italic'
const NORMAL_STYLE = 'text-text'

/**
 * 譜面定数の表示値と未知定数用の補助表示を組み立てる。
 *
 * @param value - 表示する譜面定数。
 * @param isConstUnknown - 推定定数として表示する場合はtrue。
 * @returns 表示文字列、補助マーカー、適用するクラス。
 */
export const getConstDisplay = (value: number, isConstUnknown: boolean): ConstDisplay => {
  const valueText = formatChartConst(value)

  if (isConstUnknown) {
    return {
      valueText,
      markerText: '?',
      className: UNKNOWN_STYLE,
    }
  }

  return {
    valueText,
    markerText: null,
    className: NORMAL_STYLE,
  }
}

/**
 * 譜面レーティングの表示値と未知定数用の表示スタイルを組み立てる。
 *
 * @param value - 表示する譜面レーティング。
 * @param isPlayed - プレイ済みの場合はtrue。
 * @param isConstUnknown - 推定定数のレーティングとして表示する場合はtrue。
 * @returns 表示文字列と適用するクラス。
 */
export const getRatingDisplay = (
  value: number,
  isPlayed: boolean,
  isConstUnknown: boolean
): RatingDisplay => {
  if (!isPlayed) {
    return {
      text: '',
      className: NORMAL_STYLE,
    }
  }

  return {
    text: formatRecordRating(value),
    className: isConstUnknown ? UNKNOWN_STYLE : NORMAL_STYLE,
  }
}
