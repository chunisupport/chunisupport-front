import type { ChainLamp, ComboLamp, Difficulty, HardLamp } from '../../../../types/record'
import type { FilterState } from '../../../../types/recordFilter'
import { buildDefaultFilter } from '../../../../utils/recordFilterDefaults'
import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import {
  matchesNormalizedSearchQuery,
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from '../../../../utils/searchUtils'
import { hasJusticeCountFilter, hasOverPowerFilter } from './filterDialog'

/** フィルターのデフォルト値を取得する */
export const getDefaultFilter = buildDefaultFilter

export type RecordTitleMatcher = (record: PlayerRecordWithSongMeta) => boolean

export function createRecordTitleMatcher(query: string): RecordTitleMatcher {
  const { normalizedQuery, normalizedReadingQuery } = normalizeQuery(query)
  if (!normalizedQuery) {
    return () => true
  }

  return (record) => {
    const normalizedTitle = normalizeForSearch(record.title)
    const normalizedArtist = normalizeForSearch(record.artist)
    const normalizedReading = normalizeForReadingSearch(record.reading ?? record.title)
    return matchesNormalizedSearchQuery(
      normalizedTitle,
      normalizedArtist,
      normalizedReading,
      normalizedQuery,
      normalizedReadingQuery
    )
  }
}

/** レコードがフィルター条件にマッチするか判定する */
export function isRecordMatched(record: PlayerRecordWithSongMeta, filters: FilterState): boolean {
  const matchTitle = createRecordTitleMatcher(filters.title)
  return isRecordMatchedWithTitleMatcher(record, filters, matchTitle)
}

export function isRecordMatchedWithTitleMatcher(
  record: PlayerRecordWithSongMeta,
  filters: FilterState,
  matchTitle: RecordTitleMatcher
): boolean {
  // 未プレイ除外
  if (filters.excludeNoPlay && !record.is_played) {
    return false
  }

  // 曲名
  if (!matchTitle(record)) {
    return false
  }

  // 難易度
  if (!filters.difficulties.includes(record.difficulty as Difficulty)) {
    return false
  }

  // 現在のOVER POWER集計対象
  if (filters.currentOpTargetOnly && !record.is_op_target) {
    return false
  }

  // ジャンル
  if (filters.genres.length > 0 && !filters.genres.includes(record.genre)) {
    return false
  }

  // バージョン
  if (filters.versions.length > 0 && !filters.versions.includes(record.release_version)) {
    return false
  }

  // 定数
  if (record.const < filters.const.min) return false
  if (record.const > filters.const.max) return false

  // スコア
  const score = record.is_played ? record.score : 0
  if (score < filters.score.min) return false
  if (score > filters.score.max) return false

  // JUSTICE数
  if (hasJusticeCountFilter(filters)) {
    if (record.combo_lamp !== 'ALL JUSTICE' || record.justice_count === null) return false
    if (filters.justiceCount.min !== null && record.justice_count < filters.justiceCount.min)
      return false
    if (filters.justiceCount.max !== null && record.justice_count > filters.justiceCount.max)
      return false
  }

  // OVER POWER
  if (hasOverPowerFilter(filters)) {
    if (!record.is_played) return false
    if (filters.overPower.min !== null && record.overpower < filters.overPower.min) return false
    if (filters.overPower.max !== null && record.overpower > filters.overPower.max) return false
  }

  // コンボランプ
  const comboLamp = record.is_played ? (record.combo_lamp ?? null) : null
  if (!hasJusticeCountFilter(filters) && !filters.combo_lamp.includes(comboLamp as ComboLamp))
    return false

  // FULL CHAINランプ
  const chainLamp = record.is_played ? (record.full_chain ?? null) : null
  if (!filters.chain_lamp.includes(chainLamp as ChainLamp)) return false

  // ハードランプ
  const hardLamp = record.is_played ? (record.clear_lamp ?? null) : null
  if (!filters.hard_lamp.includes(hardLamp as HardLamp)) return false

  return true
}
