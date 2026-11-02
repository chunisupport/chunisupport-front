import { CHART_CONST_MAX, CHART_CONST_MIN } from '../constants/chart'
import { calculateRequiredChartCount, type OverPowerCalculatorBase } from './overPowerCalculator'
import {
  EXCESSIVE_CHART_COUNT_LABEL,
  REQUIRED_CHART_COUNT_RANGE_SEPARATOR,
  UNAVAILABLE_CHART_COUNT_LABEL,
} from './overPowerCalculatorConstants'

/**
 * 共通定数の最大値・最小値で必要譜面数を計算し、同じ結果は単一値にまとめ、範囲は「 〜 」で区切る。
 * @param target - 理論OP、現在OP、目標達成率。
 * @param score - 目標スコア。
 * @param comboLamp - 目標コンボランプ。
 * @param currentScore - 現在の通常ランプのスコア。
 * @param songCount - 現在収録されている通常楽曲数。この件数を超える必要数は×とする。
 * @returns 必要譜面数の表示と、収録曲数超過または範囲の一部で達成不能か。
 */
export const calculateRequiredChartCountResult = (
  target: OverPowerCalculatorBase & { percent: number },
  score: number,
  comboLamp: string | null,
  currentScore: number,
  songCount: number
): { label: string; exceedsLimit: boolean } => {
  const constants = [CHART_CONST_MAX, CHART_CONST_MIN]
  const counts = constants.map((constant) =>
    calculateRequiredChartCount(target, score, constant, comboLamp, currentScore)
  )
  if (counts.every((count) => count === null)) {
    return { label: UNAVAILABLE_CHART_COUNT_LABEL, exceedsLimit: false }
  }
  /**
   * 計算不能な端点、または収録曲数を超える必要数か判定する。
   * @param count - 端点の必要譜面数。増加OPがない場合はnull。
   * @returns ×として表示する場合はtrue。
   */
  const isOverLimit = (count: number | null): boolean => count === null || count > songCount
  const exceedsLimit = counts.some(isOverLimit)
  const labels = counts
    .sort((a, b) => (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY))
    .map((count) => (isOverLimit(count) ? EXCESSIVE_CHART_COUNT_LABEL : String(count)))
  return { label: [...new Set(labels)].join(REQUIRED_CHART_COUNT_RANGE_SEPARATOR), exceedsLimit }
}
