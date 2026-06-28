import { SCORE_THEORETICAL_MAX, WEAK_CHART_INSPECTOR_DISPLAY_SCORE_MIN } from '../constants/chart'
import type { PlayerRecordDTO } from '../types/api'

/** 箱ひげ図を構成する譜面定数単位の統計値。 */
export type ChartScoreDistribution = {
  chartConst: number
  count: number
  lowerWhisker: number
  firstQuartile: number
  median: number
  thirdQuartile: number
  upperWhisker: number
}

/** 外れ値と判定された譜面レコード。 */
export type WeakChartOutlier = {
  record: PlayerRecordDTO
  direction: 'LOW' | 'HIGH'
  distance: number
}

/** 苦手譜面一覧で利用できるソートキー。 */
export type WeakChartSortKey = 'title' | 'difficulty' | 'const' | 'score'

/** 苦手譜面分析の算出結果。 */
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
  record.is_played && record.clear_lamp !== 'FAILED' && record.score <= SCORE_THEORETICAL_MAX

/**
 * 集計対象レコードをグラフと一覧へ表示するか判定する。
 *
 * @param record - 判定対象の通常譜面レコード。
 * @returns 表示下限以上の場合はtrue。
 */
export const isWeakChartDisplayTarget = (record: PlayerRecordDTO): boolean =>
  record.score >= WEAK_CHART_INSPECTOR_DISPLAY_SCORE_MIN

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
    const chartConst = Number(record.const.toFixed(1))
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
      left.record.title.localeCompare(right.record.title, 'ja')
  )

  return { distributions, outliers }
}

/**
 * 苦手譜面一覧を指定列でソートする。
 *
 * @param outliers - 下側外れ値の一覧。
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
          comparison = leftRecord.title.localeCompare(rightRecord.title, 'ja')
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
