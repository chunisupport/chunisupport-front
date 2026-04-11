import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import { buildDefaultFilter } from '../types/filterDefaults'
import type { ChainLamp, ComboLamp, Difficulty, FilterState, HardLamp } from '../types/types'

/** フィルターのデフォルト値を取得する */
export const getDefaultFilter = buildDefaultFilter

/** レコードがフィルター条件にマッチするか判定する */
export function isRecordMatched(record: PlayerRecordWithSongMeta, filters: FilterState): boolean {
  // 未プレイ除外
  if (filters.excludeNoPlay && !record.is_played) {
    return false
  }

  // 曲名
  if (filters.title) {
    const title = record.title.toLowerCase()
    if (!title.includes(filters.title.toLowerCase())) {
      return false
    }
  }

  // 難易度
  if (!filters.difficulties.includes(record.difficulty as Difficulty)) {
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
  if (record.const < filters.constMin) return false
  if (record.const > filters.constMax) return false

  // スコア
  const score = record.is_played ? record.score : 0
  if (score < filters.scoreMin) return false
  if (score > filters.scoreMax) return false

  // コンボランプ
  const comboLamp = record.is_played ? (record.combo_lamp ?? null) : null
  if (!filters.combo_lamp.includes(comboLamp as ComboLamp)) return false

  // FULL CHAINランプ
  const chainLamp = record.is_played ? (record.full_chain ?? null) : null
  if (!filters.chain_lamp.includes(chainLamp as ChainLamp)) return false

  // ハードランプ
  const hardLamp = record.is_played ? (record.clear_lamp ?? null) : null
  if (!filters.hard_lamp.includes(hardLamp as HardLamp)) return false

  return true
}
