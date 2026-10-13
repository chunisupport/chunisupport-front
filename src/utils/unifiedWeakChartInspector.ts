import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import type { PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import { truncateChartConst } from './chartConstFormat'
import { compareRecordsWithRatingBand } from './onlineWeakChartInspector'
import { compareSongsByReading } from './songTitleSorting'
import type { SortDirection } from './sortingQuery'
import { isWeakChartInspectionTarget, quantile } from './weakChartInspector'

/** 自分の普段の点差からのずれで決める判定。 */
export type UnifiedWeakChartCategory =
  | 'weakness'
  | 'mildWeakness'
  | 'normal'
  | 'strength'
  | 'unavailable'

/** 統合分析の譜面別信号。比較平均が欠ける譜面は点差と基準を null にする。 */
export interface UnifiedWeakChartEntry {
  record: PlayerRecordDTO
  averageScore: number | null
  /** 自分のスコアからレート帯平均の整数部を引いた差。 */
  difference: number | null
  /** 近い譜面定数の譜面で求めた、自分の普段の点差（中央値）。 */
  baseline: number | null
  /** 普段の点差からのずれを、近い譜面定数での点差のばらつきで割った値。 */
  deviation: number | null
  category: UnifiedWeakChartCategory
}

/** 見直す優先順位。比較不能な譜面は末尾に置く。 */
export const UNIFIED_WEAK_CHART_CATEGORIES: readonly UnifiedWeakChartCategory[] = [
  'weakness',
  'mildWeakness',
  'normal',
  'strength',
  'unavailable',
]

/** 普段の点差を求める譜面定数の幅（前後それぞれ、0.1刻みの段数）。 */
const CONST_WINDOW_STEPS = 5

/** 定数の近い譜面がこの件数未満の場合は、比較できる全譜面で普段の点差を求める。 */
const MIN_WINDOW_SIZE = 5

/** 中央絶対偏差を正規分布の標準偏差相当へ換算する係数。 */
const MAD_TO_SIGMA = 1.4826

/** ばらつきの下限点数。点差がほぼ揃った定数帯で、数十点のずれを過敏に判定しないようにする。 */
const MIN_SCALE = 100

/** ずれがこの値以下なら「苦手」とする。 */
const WEAKNESS_DEVIATION = -2

/** ずれがこの値以下なら「やや苦手」とする。 */
const MILD_WEAKNESS_DEVIATION = -1

/** ずれがこの値以上なら「得意」とする。 */
const STRENGTH_DEVIATION = 1

/** 普段の点差とばらつき。 */
type DifferenceStats = { baseline: number; scale: number }

/**
 * 点差の中央値と、中央絶対偏差から求めたばらつきを算出する。
 * @param differences - 1件以上の点差。
 * @returns 中央値と標準偏差相当のばらつき。ばらつきは下限点数以上にする。
 */
const calculateDifferenceStats = (differences: readonly number[]): DifferenceStats => {
  const sorted = [...differences].sort((left, right) => left - right)
  const baseline = quantile(sorted, 0.5)
  const deviations = sorted
    .map((difference) => Math.abs(difference - baseline))
    .sort((left, right) => left - right)
  return { baseline, scale: Math.max(quantile(deviations, 0.5) * MAD_TO_SIGMA, MIN_SCALE) }
}

/**
 * 普段の点差からのずれで判定する。
 * @param deviation - ばらつきで割ったずれ。
 * @returns 判定。
 */
const classifyDeviation = (deviation: number): UnifiedWeakChartCategory => {
  if (deviation <= WEAKNESS_DEVIATION) return 'weakness'
  if (deviation <= MILD_WEAKNESS_DEVIATION) return 'mildWeakness'
  if (deviation >= STRENGTH_DEVIATION) return 'strength'
  return 'normal'
}

/**
 * 譜面定数を0.1刻みの整数段へ変換する。
 * @param chartConst - 譜面定数。
 * @returns 小数第1位で切り捨てた定数の10倍。
 */
const toConstStep = (chartConst: number): number => Math.round(truncateChartConst(chartConst) * 10)

/**
 * レート帯平均との点差を、自分の普段の点差と比べて判定する。
 *
 * 近い譜面定数（前後0.5、判定する譜面自身を含む）の譜面で点差の中央値を普段の点差とし、
 * そこからのずれを中央絶対偏差によるばらつきで割って判定する。
 * 自分の地力とレート帯のずれや、定数帯ごとのスコアの伸びにくさを打ち消せる。
 *
 * @param records - 選択した集計条件内の通常譜面レコード。比較平均の有無で絞り込まない。
 * @param snapshots - 難易度別のスコア統計。
 * @param ratingBand - 比較するレート帯。
 * @returns 優先順位順のプレイ済み譜面。平均欠損譜面も含む。
 */
export const inspectUnifiedWeakCharts = (
  records: readonly PlayerRecordDTO[],
  snapshots: readonly ChartScoresResponse[],
  ratingBand: string
): UnifiedWeakChartEntry[] => {
  const played = records.filter(isWeakChartInspectionTarget)
  const comparisons = compareRecordsWithRatingBand(played, snapshots, ratingBand).map((entry) => ({
    ...entry,
    step: toConstStep(entry.record.const),
  }))
  const comparisonByKey = new Map(
    comparisons.map((entry) => [`${entry.record.id}:${entry.record.difficulty}`, entry])
  )
  const statsByStep = new Map<number, DifferenceStats>()

  /**
   * 指定した定数段の近くにある譜面から普段の点差を求める。同じ段は再計算しない。
   * @param step - 0.1刻みの定数段。
   * @returns 普段の点差とばらつき。
   */
  const statsFor = (step: number): DifferenceStats => {
    const cached = statsByStep.get(step)
    if (cached) return cached
    const nearby = comparisons.filter(
      (comparison) => Math.abs(comparison.step - step) <= CONST_WINDOW_STEPS
    )
    const source = nearby.length >= MIN_WINDOW_SIZE ? nearby : comparisons
    const stats = calculateDifferenceStats(source.map(({ difference }) => difference))
    statsByStep.set(step, stats)
    return stats
  }

  return played
    .map((record): UnifiedWeakChartEntry => {
      const comparison = comparisonByKey.get(`${record.id}:${record.difficulty}`)
      if (!comparison) {
        return {
          record,
          averageScore: null,
          difference: null,
          baseline: null,
          deviation: null,
          category: 'unavailable',
        }
      }
      const { baseline, scale } = statsFor(comparison.step)
      const deviation = (comparison.difference - baseline) / scale
      return {
        record,
        averageScore: comparison.averageScore,
        difference: comparison.difference,
        baseline,
        deviation,
        category: classifyDeviation(deviation),
      }
    })
    .sort(
      (left, right) =>
        UNIFIED_WEAK_CHART_CATEGORIES.indexOf(left.category) -
          UNIFIED_WEAK_CHART_CATEGORIES.indexOf(right.category) ||
        (left.deviation ?? 0) - (right.deviation ?? 0) ||
        compareSongsByReading(left.record, right.record)
    )
}

/** 統合分析の比較表で利用できるソートキー。 */
export type UnifiedWeakChartSortKey =
  | 'title'
  | 'difficulty'
  | 'const'
  | 'score'
  | 'averageScore'
  | 'difference'
  | 'baseline'
  | 'category'

/**
 * 統合分析の結果を指定列でソートする。
 *
 * 平均・点差・普段の差がない譜面は、ソート方向にかかわらず末尾に置く。
 * 判定列は判定の優先順で比べ、同じ判定内は入力順（ずれの小さい順）を保つ。
 *
 * @param entries - 優先順位順の統合分析結果。
 * @param sortKey - ソート対象列。未指定時は入力順を維持する。
 * @param sortDirection - ソート方向。未指定時は入力順を維持する。
 * @returns ソート済みの新しい配列。
 */
export const sortUnifiedWeakChartEntries = (
  entries: readonly UnifiedWeakChartEntry[],
  sortKey: UnifiedWeakChartSortKey | null,
  sortDirection: SortDirection | null
): UnifiedWeakChartEntry[] => {
  if (!sortKey || !sortDirection) return [...entries]

  const direction = sortDirection === 'asc' ? 1 : -1
  const nullable = sortKey === 'averageScore' || sortKey === 'difference' || sortKey === 'baseline'

  /**
   * ソート方向を掛ける前の比較値を求める。
   * @param left - 左側の結果。
   * @param right - 右側の結果。
   * @returns 昇順で left が先なら負の値。
   */
  const compare = (left: UnifiedWeakChartEntry, right: UnifiedWeakChartEntry): number => {
    switch (sortKey) {
      case 'title':
        return compareSongsByReading(left.record, right.record)
      case 'difficulty':
        return (
          PLAYER_DATA_DIFFICULTIES.indexOf(left.record.difficulty) -
          PLAYER_DATA_DIFFICULTIES.indexOf(right.record.difficulty)
        )
      case 'const':
        return left.record.const - right.record.const
      case 'score':
        return left.record.score - right.record.score
      case 'category':
        return (
          UNIFIED_WEAK_CHART_CATEGORIES.indexOf(left.category) -
          UNIFIED_WEAK_CHART_CATEGORIES.indexOf(right.category)
        )
      default:
        return (left[sortKey] ?? 0) - (right[sortKey] ?? 0)
    }
  }

  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      if (nullable) {
        // 平均がない譜面は点差・普段の差もないため、平均の有無で末尾へ寄せる。
        const leftMissing = left.entry.averageScore === null
        const rightMissing = right.entry.averageScore === null
        if (leftMissing !== rightMissing) return leftMissing ? 1 : -1
      }
      return compare(left.entry, right.entry) * direction || left.index - right.index
    })
    .map(({ entry }) => entry)
}
