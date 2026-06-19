import {
  matchesNormalizedSearchQuery,
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from '../../../../utils/searchUtils'
import type { WorldsendFilterState, WorldsendRecordWithSongMeta } from '../types/filterTypes'
import { hasWorldsendJusticeCountFilter } from './filterDialog'

export type WorldsendRecordTitleMatcher = (record: WorldsendRecordWithSongMeta) => boolean

/**
 * WORLD'S END レコード用の曲名検索マッチャーを生成する。
 *
 * @param query - ユーザーが入力した検索文字列。
 * @returns レコードが検索条件に一致するか判定する関数。
 */
export function createWorldsendRecordTitleMatcher(query: string): WorldsendRecordTitleMatcher {
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

/**
 * WORLD'S END レコードがフィルター条件に一致するか判定する。
 *
 * @param record - 判定対象の WORLD'S END レコード。
 * @param filters - 適用する WORLD'S END フィルター。
 * @param matchTitle - 曲名・アーティスト・読み検索の判定関数。
 * @returns レコードが全条件に一致する場合はtrue。
 */
export function isWorldsendRecordMatchedWithTitleMatcher(
  record: WorldsendRecordWithSongMeta,
  filters: WorldsendFilterState,
  matchTitle: WorldsendRecordTitleMatcher
): boolean {
  if (filters.excludeNoPlay && !record.is_played) return false
  if (!matchTitle(record)) return false
  if (!filters.attributes.includes(record.attribute)) return false
  if (record.level_star === null) return false
  if (record.level_star < filters.levelStarRange.min) return false
  if (record.level_star > filters.levelStarRange.max) return false
  if (filters.genres.length > 0 && !record.genre) return false
  if (record.genre && filters.genres.length > 0 && !filters.genres.includes(record.genre))
    return false
  if (filters.versions.length > 0 && !filters.versions.includes(record.release_version))
    return false

  const score = record.is_played ? record.score : 0
  if (score < filters.score.min) return false
  if (score > filters.score.max) return false

  if (hasWorldsendJusticeCountFilter(filters)) {
    if (record.combo_lamp !== 'ALL JUSTICE' || record.justice_count === null) return false
    if (filters.justiceCount.min !== null && record.justice_count < filters.justiceCount.min) {
      return false
    }
    if (filters.justiceCount.max !== null && record.justice_count > filters.justiceCount.max) {
      return false
    }
  }

  const comboLamp = record.is_played ? (record.combo_lamp ?? null) : null
  if (!hasWorldsendJusticeCountFilter(filters) && !filters.combo_lamp.includes(comboLamp)) {
    return false
  }

  const chainLamp = record.is_played ? (record.full_chain ?? null) : null
  if (!filters.chain_lamp.includes(chainLamp)) return false

  const hardLamp = record.is_played ? (record.clear_lamp ?? null) : null
  if (!filters.hard_lamp.includes(hardLamp)) return false

  return true
}
