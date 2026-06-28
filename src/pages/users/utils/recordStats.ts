import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../../types/api.ts'
import type { PlayerRecordWithSongMeta } from '../../../utils/recordMerger.ts'
import { getScoreRank, MAX_SCORE } from '../../../utils/scoreRank.ts'
import {
  COMBO_LAMP_BAR_CLASS,
  HARD_LAMP_BAR_CLASS,
  SCORE_RANK_BAR_CLASS,
} from '../components/recordStyleClasses.ts'

/** 未プレイレコードを分布で表す共通カテゴリ名。 */
export const UNPLAYED_DISTRIBUTION_KEY = '未プレイ'

export const rankOrder = [
  'MAX',
  'SSS+',
  'SSS',
  'SS+',
  'SS',
  'S+',
  'S',
  'OTHERS',
  UNPLAYED_DISTRIBUTION_KEY,
]
export const rankColorMap: Record<string, string> = {
  ...SCORE_RANK_BAR_CLASS,
}

export const comboOrder = [
  'ALL JUSTICE CRITICAL',
  'ALL JUSTICE',
  'FULL COMBO',
  'なし',
  UNPLAYED_DISTRIBUTION_KEY,
]
export const comboColorMap: Record<string, string> = {
  ...COMBO_LAMP_BAR_CLASS,
}

export const clearOrder = [
  'CATASTROPHY',
  'ABSOLUTE',
  'BRAVE',
  'HARD',
  'CLEAR',
  'FAILED',
  UNPLAYED_DISTRIBUTION_KEY,
]
export const clearColorMap: Record<string, string> = {
  ...HARD_LAMP_BAR_CLASS,
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

/**
 * フィルター統計で表示するスコア帯を取得する。
 * @param score 集計対象レコードのスコア。
 * @returns 理論値、S以上のランク、またはその他カテゴリ。
 */
function getRank(score: number): string {
  if (score === MAX_SCORE) return 'MAX'

  const rank = getScoreRank(score)
  if (rank === 'SSS+') return rank
  if (rank === 'SSS') return rank
  if (rank === 'SS+') return rank
  if (rank === 'SS') return rank
  if (rank === 'S+') return rank
  if (rank === 'S') return rank
  return 'OTHERS'
}

/** 集計対象として扱うレコードの最小要素。 */
type RecordStatsSource = Pick<
  PlayerRecordWithSongMeta | PlayerRecordDTO | WorldsendRecordDTO,
  'is_played' | 'score' | 'combo_lamp' | 'clear_lamp'
>

/**
 * コンボランプとスコアから、フィルター統計で表示するコンボカテゴリを取得する。
 * @param record 集計対象レコード。
 * @returns AJC、AJ、FC、なし、未プレイのいずれかのカテゴリ。
 */
function getComboCategory(record: RecordStatsSource): string {
  if (!record.is_played) return UNPLAYED_DISTRIBUTION_KEY
  if (record.combo_lamp === 'ALL JUSTICE' && record.score === MAX_SCORE) {
    return 'ALL JUSTICE CRITICAL'
  }

  return record.combo_lamp ?? 'なし'
}

/**
 * レコード一覧から、RANK・COMBO・HARDの分布とスコア統計を算出する。
 * @param records 集計対象のレコード一覧。
 * @returns フィルター統計に表示する分布とスコア統計。
 */
export function getRecordStats(records: RecordStatsSource[]): RecordStats {
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
    const rank = record.is_played ? getRank(record.score) : UNPLAYED_DISTRIBUTION_KEY
    rankMap[rank] = rankMap[rank] || { count: 0, percent: 0 }
    rankMap[rank].count++
    // コンボ
    const combo = getComboCategory(record)
    comboMap[combo] = comboMap[combo] || { count: 0, percent: 0 }
    comboMap[combo].count++
    // クリア
    const clear = record.is_played ? (record.clear_lamp ?? 'FAILED') : UNPLAYED_DISTRIBUTION_KEY
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
