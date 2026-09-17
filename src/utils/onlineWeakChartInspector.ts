import { ONLINE_WEAK_CHART_MAX_DIFFERENCE_RANGE } from '../constants/chart'
import type { PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'

/** 同じレート帯の平均と比較できるプレイ済み譜面 */
export interface OnlineWeakChartEntry {
  record: PlayerRecordDTO
  averageScore: number
  difference: number
}

/**
 * プレイ済み譜面と選択レート帯の平均スコアを照合する。
 *
 * @param records - ログインユーザーの通常譜面レコード。
 * @param scoreSnapshots - 難易度別の公開スコア統計。
 * @param ratingBand - 比較するベスト枠平均レート帯。
 * @returns 比較先の平均があるプレイ済み譜面とスコア差。
 */
export const compareRecordsWithRatingBand = (
  records: readonly PlayerRecordDTO[],
  scoreSnapshots: readonly ChartScoresResponse[],
  ratingBand: string
): OnlineWeakChartEntry[] => {
  const averages = new Map<string, number>()

  for (const snapshot of scoreSnapshots) {
    for (const chart of snapshot.charts) {
      const average = chart.scores.find((score) => score.rating_band === ratingBand)?.average_score
      if (average !== null && average !== undefined) {
        averages.set(`${chart.song_id}:${snapshot.difficulty}`, average)
      }
    }
  }

  return records.flatMap((record) => {
    if (!record.is_played) return []
    const averageScore = averages.get(`${record.id}:${record.difficulty.toUpperCase()}`)
    if (averageScore === undefined) return []
    return [{ record, averageScore, difference: record.score - Math.trunc(averageScore) }]
  })
}

/**
 * 自分のスコアを中央に置くグラフの上下表示範囲を求める。
 *
 * @param entries - 平均スコアと照合できる譜面。
 * @returns 最大平均との差と表示上限の小さい方。
 */
export const getSymmetricDifferenceLimit = (entries: readonly OnlineWeakChartEntry[]): number =>
  Math.min(
    ONLINE_WEAK_CHART_MAX_DIFFERENCE_RANGE,
    entries.reduce(
      (maximum, entry) => Math.max(maximum, Math.abs(entry.averageScore - entry.record.score)),
      0
    )
  )
