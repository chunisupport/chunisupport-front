import { getComboLampFilterValue } from '../../../../utils/comboLampFilter'
import { isDateInRange } from '../../../../utils/dateFilter'
import {
  isNullableSelectionMatched,
  matchesRecordVersionFilter,
} from '../../../../utils/filterSelection'
import {
  createSearchTextMatcher,
  type NormalizedSearchText,
  normalizeSearchText,
} from '../../../../utils/searchHelpers'
import { normalizeForSearch } from '../../../../utils/searchUtils'
import type { WorldsendFilterState, WorldsendRecordWithSongMeta } from '../types/filterTypes'
import { hasWorldsendJusticeCountFilter } from './filterDialog'

export type WorldsendRecordTitleMatcher = (record: WorldsendRecordWithSongMeta) => boolean

/**
 * WORLD'S END レコード用の曲名検索マッチャーを生成する。
 *
 * @param query - ユーザーが入力した検索文字列。
 * @param getSearchText - レコードの正規化済み検索用文字列を返す関数。キャッシュを渡すと入力ごとの再正規化を避けられる。
 * @returns 読みが未設定または空欄なら曲名を読みとして使うマッチャー。
 */
export function createWorldsendRecordTitleMatcher(
  query: string,
  getSearchText: (record: WorldsendRecordWithSongMeta) => NormalizedSearchText = normalizeSearchText
): WorldsendRecordTitleMatcher {
  if (!normalizeForSearch(query)) {
    return () => true
  }

  const matches = createSearchTextMatcher(query)
  return (record) => matches(getSearchText(record))
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
  if (!matchesRecordVersionFilter(record.release_version, filters.versions)) return false
  if (!isNullableSelectionMatched(record.name_folder_code, filters.nameFolders)) return false

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

  const comboLamp = record.is_played
    ? getComboLampFilterValue(record.combo_lamp ?? null, record.score)
    : null
  if (!filters.combo_lamp.includes(comboLamp)) return false

  const chainLamp = record.is_played ? (record.full_chain ?? null) : null
  if (!filters.chain_lamp.includes(chainLamp)) return false

  const hardLamp = record.is_played ? (record.clear_lamp ?? null) : null
  if (!filters.hard_lamp.includes(hardLamp)) return false

  // 最終更新日
  if (!isDateInRange(record.updated_at, filters.updatedAt)) return false

  return true
}
