import type { PlayerRecordDTO } from '../types/api'
import type { ChartScoresResponse } from '../types/chartScores'
import { formatChartConst } from './chartConstFormat'
import { formatInteger } from './numberFormat'
import { formatScoreDifference } from './scoreDifference'

/** 同じレート帯の平均と比較できるプレイ済み譜面 */
export interface OnlineWeakChartEntry {
  record: PlayerRecordDTO
  averageScore: number
  difference: number
}

/**
 * 苦手譜面インスペクター Online のツールチップへ表示する譜面情報を整形する。
 *
 * @param record - 表示する譜面レコード。
 * @param difference - 自分のスコアとレート帯平均の差。
 * @returns 難易度、譜面定数、自分のスコア、差分を含む表示文字列。
 */
export const formatOnlineWeakChartTooltipDetail = (
  record: Pick<PlayerRecordDTO, 'difficulty' | 'const' | 'score'>,
  difference: number
): string =>
  `${record.difficulty} ${formatChartConst(record.const)} / ${formatInteger(record.score)} (${formatScoreDifference(difference)})`

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
