import type { PlayerDataDifficulty } from '../../../../types/api'
import type { ChainLamp, Difficulty, HardLamp } from '../../../../types/record'
import type { FilterState } from '../../../../types/recordFilter'
import { createLockedSongKey } from '../../../../usecases/overpower/lockedSongsBatch'
import { getComboLampFilterValue } from '../../../../utils/comboLampFilter'
import { isDateInRange } from '../../../../utils/dateFilter'
import { buildDefaultFilter } from '../../../../utils/recordFilterDefaults'
import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import {
  matchesNormalizedSearchQuery,
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from '../../../../utils/searchUtils'
import { isTheoreticalOverPowerTargetDifficulty } from '../../../../utils/theoreticalOverPowerTarget'
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

/**
 * 通常レコードがフィルター条件に一致するか判定する。
 *
 * @param record - 判定対象の通常レコード。
 * @param filters - 適用する通常レコードフィルター。
 * @param theoreticalTargetDifficultyBySongId - 曲IDごとの理論値OVER POWER対象難易度。
 * @param lockedSongKeys - 未解禁設定に登録された曲・譜面のキー。
 * @returns レコードが全条件に一致する場合はtrue。
 */
export function isRecordMatched(
  record: PlayerRecordWithSongMeta,
  filters: FilterState,
  theoreticalTargetDifficultyBySongId: ReadonlyMap<string, PlayerDataDifficulty> = new Map(),
  lockedSongKeys: ReadonlySet<string> = new Set()
): boolean {
  const matchTitle = createRecordTitleMatcher(filters.title)
  return isRecordMatchedWithTitleMatcher(
    record,
    filters,
    matchTitle,
    new Set(),
    theoreticalTargetDifficultyBySongId,
    lockedSongKeys
  )
}

/**
 * 事前生成した曲名検索マッチャーを使って、通常レコードが全フィルター条件に一致するか判定する。
 *
 * @param record - 判定対象の通常レコード。
 * @param filters - 適用する通常レコードフィルター。
 * @param matchTitle - 曲名・アーティスト・読み検索の判定関数。
 * @param favoriteSongIds - お気に入りに登録されている楽曲ID。
 * @param theoreticalTargetDifficultyBySongId - 曲IDごとの理論値OVER POWER対象難易度。
 * @param lockedSongKeys - 未解禁設定に登録された曲・譜面のキー。
 * @returns レコードが全条件に一致する場合はtrue。
 */
export function isRecordMatchedWithTitleMatcher(
  record: PlayerRecordWithSongMeta,
  filters: FilterState,
  matchTitle: RecordTitleMatcher,
  favoriteSongIds: ReadonlySet<string> = new Set(),
  theoreticalTargetDifficultyBySongId: ReadonlyMap<string, PlayerDataDifficulty> = new Map(),
  lockedSongKeys: ReadonlySet<string> = new Set()
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

  // OVER POWER対象
  if (filters.opTargetOnly) {
    if (filters.opTargetType === 'current' && !record.is_op_target) return false
    if (
      filters.opTargetType === 'theoretical' &&
      !isTheoreticalOverPowerTargetDifficulty(
        theoreticalTargetDifficultyBySongId.get(record.id),
        record.difficulty.toUpperCase() as PlayerDataDifficulty
      )
    ) {
      return false
    }
  }

  // お気に入り楽曲
  if (filters.favoriteSongsOnly && !favoriteSongIds.has(record.id)) {
    return false
  }

  if (
    filters.excludeLockedSongs &&
    (lockedSongKeys.has(createLockedSongKey(record.id, false)) ||
      (record.difficulty === 'ULTIMA' && lockedSongKeys.has(createLockedSongKey(record.id, true))))
  ) {
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
  const comboLamp = record.is_played
    ? getComboLampFilterValue(record.combo_lamp ?? null, record.score)
    : null
  if (!filters.combo_lamp.includes(comboLamp)) return false

  // FULL CHAINランプ
  const chainLamp = record.is_played ? (record.full_chain ?? null) : null
  if (!filters.chain_lamp.includes(chainLamp as ChainLamp)) return false

  // ハードランプ
  const hardLamp = record.is_played ? (record.clear_lamp ?? null) : null
  if (!filters.hard_lamp.includes(hardLamp as HardLamp)) return false

  // 最終更新日
  if (!isDateInRange(record.updated_at, filters.updatedAt)) return false

  return true
}
