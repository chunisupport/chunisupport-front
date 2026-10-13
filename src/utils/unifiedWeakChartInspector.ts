import type { PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import { compareRecordsWithRatingBand } from './onlineWeakChartInspector'
import { compareSongsByReading } from './songTitleSorting'
import { inspectWeakCharts, isWeakChartInspectionTarget } from './weakChartInspector'

/** 自分のスコア分布での外れ値とレート帯平均を組み合わせた判定。 */
export type UnifiedWeakChartCategory =
  | 'confirmedWeakness'
  | 'hiddenWeakness'
  | 'personalWeakness'
  | 'normal'
  | 'strength'
  | 'unavailable'

/** 統合分析の譜面別信号。比較平均が欠ける場合も外れ値の判定を保持する。 */
export interface UnifiedWeakChartEntry {
  record: PlayerRecordDTO
  averageScore: number | null
  difference: number | null
  personalOutlier: 'LOW' | 'HIGH' | null
  category: UnifiedWeakChartCategory
}

/** 見直す優先順位。比較不能な譜面は末尾に置く。 */
export const UNIFIED_WEAK_CHART_CATEGORIES: readonly UnifiedWeakChartCategory[] = [
  'confirmedWeakness',
  'hiddenWeakness',
  'personalWeakness',
  'normal',
  'strength',
  'unavailable',
]

/**
 * 自分のスコア分布での外れ値とレート帯平均との差から判定する。
 * @param personalOutlier - 同定数帯での外れ値方向。
 * @param difference - 自分のスコアからレート帯平均の整数部を引いた差。
 * @param threshold - 帯でも低いと判断する点差の絶対値。
 * @returns 見直し対象または強みの分類。
 */
const classifyEntry = (
  personalOutlier: UnifiedWeakChartEntry['personalOutlier'],
  difference: number | null,
  threshold: number
): UnifiedWeakChartCategory => {
  if (difference === null) return 'unavailable'
  const bandUnder = difference < 0 && difference <= -threshold
  if (personalOutlier === 'LOW') return bandUnder ? 'confirmedWeakness' : 'personalWeakness'
  if (bandUnder) return 'hiddenWeakness'
  if (personalOutlier === 'HIGH' || difference > 0) return 'strength'
  return 'normal'
}

/**
 * 通常版とOnline版の信号を統合し、分類と点差で優先順を付ける。
 * @param records - 選択した集計条件内の通常譜面レコード。比較平均の有無で絞り込まない。
 * @param snapshots - 難易度別のスコア統計。
 * @param ratingBand - 比較するレート帯。
 * @param threshold - レート帯平均より低いと判断する点差の絶対値。
 * @returns 優先順位順のプレイ済み譜面。平均欠損譜面も含む。
 */
export const inspectUnifiedWeakCharts = (
  records: readonly PlayerRecordDTO[],
  snapshots: readonly ChartScoresResponse[],
  ratingBand: string,
  threshold: number
): UnifiedWeakChartEntry[] => {
  const played = records.filter(isWeakChartInspectionTarget)
  const outliers = new Map(
    inspectWeakCharts(played).outliers.map(({ record, direction }) => [
      `${record.id}:${record.difficulty}`,
      direction,
    ])
  )
  const comparisons = new Map(
    compareRecordsWithRatingBand(played, snapshots, ratingBand).map((entry) => [
      `${entry.record.id}:${entry.record.difficulty}`,
      entry,
    ])
  )
  return played
    .map((record): UnifiedWeakChartEntry => {
      const key = `${record.id}:${record.difficulty}`
      const comparison = comparisons.get(key)
      const personalOutlier = outliers.get(key) ?? null
      const difference = comparison?.difference ?? null
      return {
        record,
        averageScore: comparison?.averageScore ?? null,
        difference,
        personalOutlier,
        category: classifyEntry(personalOutlier, difference, threshold),
      }
    })
    .sort(
      (left, right) =>
        UNIFIED_WEAK_CHART_CATEGORIES.indexOf(left.category) -
          UNIFIED_WEAK_CHART_CATEGORIES.indexOf(right.category) ||
        (left.difference ?? 0) - (right.difference ?? 0) ||
        compareSongsByReading(left.record, right.record)
    )
}
