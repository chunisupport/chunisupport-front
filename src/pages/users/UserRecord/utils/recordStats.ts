import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import { getScoreRank } from '../../../../utils/scoreRank'

export const rankOrder = ['SSS+', 'SSS', 'SS+', 'SS', 'S+', 'S', 'OTHERS', '未プレイ']
export const rankColorMap: Record<string, string> = {
  'SSS+': 'bg-lime-300',
  SSS: 'bg-yellow-300',
  'SS+': 'bg-amber-300',
  SS: 'bg-orange-300',
  'S+': 'bg-blue-300',
  S: 'bg-cyan-300',
  OTHERS: 'bg-gray-300',
  未プレイ: 'bg-gray-200',
}

export const comboOrder = ['ALL JUSTICE', 'FULL COMBO', 'なし', '未プレイ']
export const comboColorMap: Record<string, string> = {
  'ALL JUSTICE': 'bg-yellow-300',
  'FULL COMBO': 'bg-orange-300',
  なし: 'bg-gray-300',
  未プレイ: 'bg-gray-200',
}

export const clearOrder = [
  'CATASTROPHY',
  'ABSOLUTE',
  'BRAVE',
  'HARD',
  'CLEAR',
  'FAILED',
  '未プレイ',
]
export const clearColorMap: Record<string, string> = {
  CATASTROPHY: 'bg-red-300',
  ABSOLUTE: 'bg-lime-300',
  BRAVE: 'bg-yellow-300',
  HARD: 'bg-amber-300',
  CLEAR: 'bg-blue-300',
  FAILED: 'bg-gray-300',
  未プレイ: 'bg-gray-200',
}

/** 統計情報の型定義 */
export type DistributionMap = Record<string, { count: number; percent: number }>

/** スコア統計情報の型定義 */
export type ScoreStats = {
  min: number
  max: number
  avg: number
  median: number
  q1: number
  q3: number
}

/** レコード統計情報の型定義 */
export type RecordStats = {
  rankDist: DistributionMap
  comboDist: DistributionMap
  clearDist: DistributionMap
  scoreStats: ScoreStats
}

/** スコアからランクを取得する */
function getRank(score: number): string {
  const rank = getScoreRank(score)
  if (rank === 'SSS+') return rank
  if (rank === 'SSS') return rank
  if (rank === 'SS+') return rank
  if (rank === 'SS') return rank
  if (rank === 'S+') return rank
  if (rank === 'S') return rank
  return 'OTHERS'
}

/** レコードから統計情報を取得する */
export function getRecordStats(records: PlayerRecordWithSongMeta[]): RecordStats {
  const total = records.length
  // ランク分布
  const rankMap: DistributionMap = {}
  // コンボ分布
  const comboMap: DistributionMap = {}
  // クリア分布
  const clearMap: DistributionMap = {}
  // スコア配列（プレイ済みのみ）
  const scores = records
    .filter((record) => record.is_played)
    .map((record) => record.score)
    .sort((a, b) => a - b)

  for (const record of records) {
    // ランク
    const rank = record.is_played ? getRank(record.score) : '未プレイ'
    rankMap[rank] = rankMap[rank] || { count: 0, percent: 0 }
    rankMap[rank].count++
    // コンボ
    const combo = record.is_played ? (record.combo_lamp ?? 'なし') : '未プレイ'
    comboMap[combo] = comboMap[combo] || { count: 0, percent: 0 }
    comboMap[combo].count++
    // クリア
    const clear = record.is_played ? (record.clear_lamp ?? 'FAILED') : '未プレイ'
    clearMap[clear] = clearMap[clear] || { count: 0, percent: 0 }
    clearMap[clear].count++
  }

  // 割合計算
  Object.values(rankMap).forEach((obj) => {
    obj.percent = total ? (obj.count / total) * 100 : 0
  })
  Object.values(comboMap).forEach((obj) => {
    obj.percent = total ? (obj.count / total) * 100 : 0
  })
  Object.values(clearMap).forEach((obj) => {
    obj.percent = total ? (obj.count / total) * 100 : 0
  })

  // スコア統計（プレイ済みのみ）
  const min = scores[0] ?? 0
  const max = scores[scores.length - 1] ?? 0
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const median = scores.length
    ? scores.length % 2 === 1
      ? scores[(scores.length - 1) / 2]
      : Math.round((scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2)
    : 0
  const q1 = scores.length ? scores[Math.floor((scores.length - 1) * 0.25)] : 0
  const q3 = scores.length ? scores[Math.floor((scores.length - 1) * 0.75)] : 0

  return {
    rankDist: rankMap,
    comboDist: comboMap,
    clearDist: clearMap,
    scoreStats: { min, max, avg, median, q1, q3 },
  }
}
