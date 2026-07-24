import type { PlayerRecordDTO } from '../../../../types/api'
import type { OverPowerChartEntry } from '../../../../usecases/overpower/types'
import { getScoreRank, MAX_SCORE } from '../../../../utils/scoreRank'
import { OVER_POWER_COMBO_BANDS, OVER_POWER_SCORE_BANDS } from '../constants'
import type { OverPowerComboBand, OverPowerGraphRow, OverPowerScoreBand } from '../types'

export type RecordsBySummaryTab = Record<
  'all' | 'genres' | 'difficulties' | 'levels' | 'versions',
  Map<string, (PlayerRecordDTO | null)[]>
>

/**
 * Map内のレコード配列へ対象レコードを追加する。
 *
 * @param groups - 追加先の分類Map。
 * @param key - 分類キー。
 * @param record - 追加するプレイヤーレコード。
 * @returns なし。
 */
const addRecordToGroup = (
  groups: Map<string, (PlayerRecordDTO | null)[]>,
  key: string,
  record: PlayerRecordDTO | null
): void => {
  const group = groups.get(key) ?? []
  group.push(record)
  groups.set(key, group)
}

/**
 * 未プレイを含む譜面エントリを表示軸ごとに分類する。
 *
 * @param entries - フィルター適用済みの譜面エントリ。
 * @returns 集計軸ごとのレコード分類Map。未プレイ譜面はnullで保持する。
 */
export const buildChartRecordsBySummaryTab = (
  entries: OverPowerChartEntry[]
): RecordsBySummaryTab => {
  const groups: RecordsBySummaryTab = {
    all: new Map(),
    genres: new Map(),
    difficulties: new Map(),
    levels: new Map(),
    versions: new Map(),
  }
  for (const entry of entries) {
    addRecordToGroup(groups.all, 'all', entry.record)
    addRecordToGroup(groups.difficulties, entry.difficulty, entry.record)
    addRecordToGroup(groups.levels, entry.level, entry.record)
    if (entry.song.genre && entry.song.genre !== '不明') {
      addRecordToGroup(groups.genres, entry.song.genre, entry.record)
    }
    if (entry.versionName) {
      addRecordToGroup(groups.versions, entry.versionName, entry.record)
    }
  }
  return groups
}

/**
 * スコアからグラフ表示用のランク帯を取得する。
 *
 * @param record - 判定対象のプレイヤーレコード。
 * @returns グラフで利用するスコア帯。
 */
const getScoreBand = (record: PlayerRecordDTO | null): OverPowerScoreBand => {
  if (!record) return 'OTHER'
  if (!record.is_played) return 'OTHER'
  if (record.score >= MAX_SCORE) return 'MAX'

  const rank = getScoreRank(record.score)
  if (
    rank === 'SSS+' ||
    rank === 'SSS' ||
    rank === 'SS+' ||
    rank === 'SS' ||
    rank === 'S+' ||
    rank === 'S'
  ) {
    return rank
  }

  return 'OTHER'
}

/**
 * コンボランプからグラフ表示用のランプ帯を取得する。
 *
 * @param record - 判定対象のプレイヤーレコード。
 * @returns グラフで利用するコンボ帯。
 */
const getComboBand = (record: PlayerRecordDTO | null): OverPowerComboBand => {
  if (!record) return 'OTHER'
  if (record.combo_lamp === 'ALL JUSTICE') return 'ALL JUSTICE'
  if (record.combo_lamp === 'FULL COMBO') return 'FULL COMBO'
  return 'OTHER'
}

/**
 * グラフ表示に必要なランク・コンボ分布をサマリー行へ付与する。
 *
 * @param rows - グラフ表示対象のサマリー行。
 * @param recordsByLabel - サマリー行IDまたはラベルに紐づくレコード分類Map。
 * @returns ランク・コンボ分布を付与したグラフ行。
 */
export const buildGraphRows = (
  rows: OverPowerGraphRow['summary'][],
  recordsByLabel: Map<string, (PlayerRecordDTO | null)[]>
): OverPowerGraphRow[] =>
  rows.map((summary) => {
    const records = recordsByLabel.get(summary.id) ?? recordsByLabel.get(summary.label) ?? []
    return {
      summary,
      scoreBands: OVER_POWER_SCORE_BANDS.map((label) => ({
        label,
        count: records.filter((record) => getScoreBand(record) === label).length,
      })),
      comboBands: OVER_POWER_COMBO_BANDS.map((label) => ({
        label,
        count: records.filter((record) => getComboBand(record) === label).length,
      })),
    }
  })
