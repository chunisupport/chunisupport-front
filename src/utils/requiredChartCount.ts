import { CHART_CONST_MAX, CHART_CONST_MIN } from '../constants/chart'
import { calculateRequiredChartCount, type OverPowerCalculatorBase } from './overPowerCalculator'
import {
  EXCESSIVE_CHART_COUNT_LABEL,
  UNAVAILABLE_CHART_COUNT_LABEL,
} from './overPowerCalculatorConstants'

/**
 * 定数16.0〜1.0の必要譜面数を計算し、同じ結果は単一値にまとめる。
 * @param target - 理論OP、現在OP、目標達成率。
 * @param score - 目標スコア。
 * @param comboLamp - 目標コンボランプ。
 * @param currentScore - 現在の通常ランプのスコア。
 * @param songCount - 現在収録されている通常楽曲数。以上の必要数は×とする。
 * @returns 必要譜面数の表示と、収録曲数以上または範囲の一部で達成不能か。
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
  const exceedsLimit = counts.some((count) => count === null || (count > 0 && count >= songCount))
  const labels = counts
    .sort((a, b) => (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY))
    .map((count) =>
      count === null || (count > 0 && count >= songCount)
        ? EXCESSIVE_CHART_COUNT_LABEL
        : String(count)
    )
  return { label: [...new Set(labels)].join('-'), exceedsLimit }
}
