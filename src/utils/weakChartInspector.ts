import { SCORE_THEORETICAL_MAX, THEORETICAL_OVER_POWER_TARGET_FILTER } from '../constants/chart'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../types/api'
import { truncateChartConst } from './chartConstFormat'
import { compareSongsByReading } from './songTitleSorting'
import { isTheoreticalOverPowerTargetDifficulty } from './theoreticalOverPowerTarget'

/** 苦手譜面インスペクターで理論値OVER POWER対象を表す選択値 */
export const WEAK_CHART_OP_TARGET_FILTER = THEORETICAL_OVER_POWER_TARGET_FILTER

/** 苦手譜面インスペクターで選択できる通常難易度または理論値OVER POWER対象 */
export type WeakChartAggregationDifficulty =
  | PlayerDataDifficulty
  | typeof WEAK_CHART_OP_TARGET_FILTER

/** 苦手譜面インスペクターの集計対象範囲 */
export type WeakChartAggregationRange = {
  /** 集計対象とするスコアの最小値 */
  scoreMin: number
  /** 集計対象とするスコアの最大値 */
  scoreMax: number
  /** 集計対象とする譜面定数の最小値 */
  constMin: number
  /** 集計対象とする譜面定数の最大値 */
  constMax: number
}

/** 箱ひげ図を構成する譜面定数単位の統計値 */
export type ChartScoreDistribution = {
  chartConst: number
  count: number
  lowerWhisker: number
  firstQuartile: number
  median: number
  thirdQuartile: number
  upperWhisker: number
}

/** 外れ値と判定された譜面レコード */
export type WeakChartOutlier = {
  record: PlayerRecordDTO
  direction: 'LOW' | 'HIGH'
  distance: number
}

/** 外れ値表で利用できるソートキー */
export type WeakChartSortKey = 'title' | 'difficulty' | 'const' | 'score'

/** 苦手譜面分析の算出結果 */
export type WeakChartInspection = {
  distributions: ChartScoreDistribution[]
  outliers: WeakChartOutlier[]
}

/**
 * レコードが苦手譜面インスペクターの分析条件を満たすか判定する。
 *
 * @param record - 判定対象の通常譜面レコード。
 * @returns 分析対象の場合はtrue。
 */
export const isWeakChartInspectionTarget = (record: PlayerRecordDTO): boolean =>
  record.is_played && record.score <= SCORE_THEORETICAL_MAX

/**
 * 理論値OVER POWER対象と通常難易度が同時に選ばれない次の選択状態を作る。
 *
 * @param current - 現在選択中の集計対象難易度。
 * @param toggled - 切り替える集計対象難易度。
 * @returns 切り替え後の集計対象難易度。
 */
export const toggleWeakChartAggregationDifficulty = (
  current: readonly WeakChartAggregationDifficulty[],
  toggled: WeakChartAggregationDifficulty
): WeakChartAggregationDifficulty[] => {
  if (toggled === WEAK_CHART_OP_TARGET_FILTER) {
    return current.includes(WEAK_CHART_OP_TARGET_FILTER) ? [] : [WEAK_CHART_OP_TARGET_FILTER]
  }

  const withoutOpTarget = current.filter((difficulty) => difficulty !== WEAK_CHART_OP_TARGET_FILTER)
  return withoutOpTarget.includes(toggled)
    ? withoutOpTarget.filter((difficulty) => difficulty !== toggled)
    : [...withoutOpTarget, toggled]
}

/**
 * レコードを選択難易度と集計範囲で絞り込む。
 *
 * @param records - 絞り込み前の通常譜面レコード。
 * @param targetDifficultyBySongId - 曲IDごとの理論値OVER POWER対象難易度。
 * @param difficulties - 通常難易度または理論値OVER POWER対象の選択値。
 * @param range - スコアと譜面定数の集計対象範囲。
 * @returns 苦手譜面分析の集計対象となるプレイ済みレコード。
 */
export const filterWeakChartAggregationRecords = (
  records: readonly PlayerRecordDTO[],
  targetDifficultyBySongId: ReadonlyMap<string, PlayerDataDifficulty>,
  difficulties: readonly WeakChartAggregationDifficulty[],
  range: WeakChartAggregationRange
): PlayerRecordDTO[] => {
  const opTargetOnly = difficulties.includes(WEAK_CHART_OP_TARGET_FILTER)

  return records.filter((record) => {
    if (!isWeakChartInspectionTarget(record)) return false

    const difficultyMatched = opTargetOnly
      ? isTheoreticalOverPowerTargetDifficulty(
          targetDifficultyBySongId.get(record.id),
          record.difficulty
        )
      : difficulties.includes(record.difficulty)

    return (
      difficultyMatched &&
      record.score >= range.scoreMin &&
      record.score <= range.scoreMax &&
      record.const >= range.constMin &&
      record.const <= range.constMax
    )
  })
}

/**
 * ソート済み数列の分位点を線形補間で算出する。
 *
 * @param sortedValues - 昇順に並んだ数列。
 * @param percentile - 0から1までの分位。
 * @returns 指定した分位点。
 */
const quantile = (sortedValues: number[], percentile: number): number => {
  const position = (sortedValues.length - 1) * percentile
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const ratio = position - lowerIndex

  return sortedValues[lowerIndex] + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * ratio
}

/**
 * プレイ済みレコードを譜面定数ごとに集計し、Tukey法で外れ値を抽出する。
 *
 * @param records - 通常譜面のユーザーレコード。
 * @returns 箱ひげ図の統計値と外れ値一覧。
 */
export const inspectWeakCharts = (records: PlayerRecordDTO[]): WeakChartInspection => {
  const playedRecords = records.filter(isWeakChartInspectionTarget)
  const groupedRecords = new Map<number, PlayerRecordDTO[]>()

  for (const record of playedRecords) {
    const chartConst = truncateChartConst(record.const)
    const group = groupedRecords.get(chartConst) ?? []
    group.push(record)
    groupedRecords.set(chartConst, group)
  }

  const distributions: ChartScoreDistribution[] = []
  const outliers: WeakChartOutlier[] = []

  for (const [chartConst, group] of [...groupedRecords].sort(([left], [right]) => left - right)) {
    const scores = group.map((record) => record.score).sort((left, right) => left - right)
    const firstQuartile = quantile(scores, 0.25)
    const median = quantile(scores, 0.5)
    const thirdQuartile = quantile(scores, 0.75)
    const interquartileRange = thirdQuartile - firstQuartile
    const lowerFence = firstQuartile - interquartileRange * 1.5
    const upperFence = thirdQuartile + interquartileRange * 1.5
    const inlierScores = scores.filter((score) => score >= lowerFence && score <= upperFence)

    distributions.push({
      chartConst,
      count: scores.length,
      lowerWhisker: inlierScores[0],
      firstQuartile,
      median,
      thirdQuartile,
      upperWhisker: inlierScores[inlierScores.length - 1] ?? scores[scores.length - 1] ?? 0,
    })

    for (const record of group) {
      if (record.score < lowerFence) {
        outliers.push({ record, direction: 'LOW', distance: lowerFence - record.score })
      } else if (record.score > upperFence) {
        outliers.push({ record, direction: 'HIGH', distance: record.score - upperFence })
      }
    }
  }

  outliers.sort(
    (left, right) =>
      right.distance - left.distance ||
      left.record.const - right.record.const ||
      compareSongsByReading(left.record, right.record)
  )

  return { distributions, outliers }
}

/**
 * 外れ値表を指定列でソートする。
 *
 * @param outliers - 外れ値の一覧。
 * @param sortKey - ソート対象列。
 * @param sortDirection - ソート方向。
 * @returns ソート済みの新しい外れ値配列。ソート未指定時は元の配列。
 */
export const sortWeakChartOutliers = (
  outliers: WeakChartOutlier[],
  sortKey: WeakChartSortKey | null,
  sortDirection: 'asc' | 'desc' | null
): WeakChartOutlier[] => {
  if (!sortKey || !sortDirection) return outliers

  const direction = sortDirection === 'asc' ? 1 : -1

  return outliers
    .map((outlier, index) => ({ outlier, index }))
    .sort((left, right) => {
      const leftRecord = left.outlier.record
      const rightRecord = right.outlier.record
      let comparison = 0

      switch (sortKey) {
        case 'title':
          comparison = compareSongsByReading(leftRecord, rightRecord)
          break
        case 'difficulty':
          comparison = leftRecord.difficulty.localeCompare(rightRecord.difficulty)
          break
        case 'const':
          comparison = leftRecord.const - rightRecord.const
          break
        case 'score':
          comparison = leftRecord.score - rightRecord.score
          break
      }

      return comparison === 0 ? left.index - right.index : comparison * direction
    })
    .map(({ outlier }) => outlier)
}
