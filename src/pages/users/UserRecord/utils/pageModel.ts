import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import type { PlayerRecordDTO, SongDTO, VersionDTO } from '../../../../types/api'
import type { FilterState, RecordSortCondition } from '../../../../types/recordFilter'
import {
  attachSongMetaToRecords,
  type PlayerRecordWithSongMeta,
} from '../../../../utils/recordMerger'
import { buildTheoreticalOverPowerTargetDifficultyBySongId } from '../../../../utils/theoreticalOverPowerTarget'
import { getRecordStats, type RecordStats } from '../../utils/recordStats'
import { createRecordTitleMatcher, isRecordMatchedWithTitleMatcher } from './filtering'
import { sortRecordsByConditions } from './sorting'

/** UserRecordページモデルの入力値 */
type UserRecordPageModelParams = {
  songs: Accessor<{ songs: SongDTO[] } | undefined>
  versions: Accessor<{ versions: VersionDTO[] } | undefined>
  sourceRecords: Accessor<PlayerRecordDTO[]>
  filters: Accessor<FilterState>
  favoriteSongIds: Accessor<ReadonlySet<string>>
  lockedSongKeys: Accessor<ReadonlySet<string>>
  sortConditions: Accessor<RecordSortCondition[]>
}

/** UserRecordページモデルが画面へ返す導出値 */
type UserRecordPageModel = {
  recordsWithSongMeta: Accessor<PlayerRecordWithSongMeta[]>
  filteredRecords: Accessor<PlayerRecordWithSongMeta[]>
  sortedRecords: Accessor<PlayerRecordWithSongMeta[]>
  totalCount: Accessor<number>
  filteredCount: Accessor<number>
  stats: Accessor<RecordStats>
}

/**
 * UserRecordページで利用するレコード導出値をまとめて生成する。
 * @param params 楽曲マスタ、レコード、フィルター、ソート状態
 * @returns レコード一覧、件数、統計をまとめたページモデル
 */
export function useUserRecordPageModel(params: UserRecordPageModelParams): UserRecordPageModel {
  /** 未プレイを含む全曲のレコード */
  const recordsWithSongMeta = createMemo(() => {
    const songs = params.songs()
    const versions = params.versions()
    if (!songs || !versions) return []
    return attachSongMetaToRecords(songs.songs, params.sourceRecords(), versions.versions)
  })

  /** 曲IDごとの理論値OVER POWER対象難易度 */
  const theoreticalTargetDifficultyBySongId = createMemo(() =>
    buildTheoreticalOverPowerTargetDifficultyBySongId(params.songs()?.songs ?? [])
  )

  /** フィルター適用後のレコード */
  const filteredRecords = createMemo(() => {
    const records = recordsWithSongMeta()
    const currentFilters = params.filters()
    const matchTitle = createRecordTitleMatcher(currentFilters.title)
    const favoriteSongIds = params.favoriteSongIds()
    const lockedSongKeys = params.lockedSongKeys()
    const targetDifficultyBySongId = theoreticalTargetDifficultyBySongId()
    return records.filter((record) =>
      isRecordMatchedWithTitleMatcher(
        record,
        currentFilters,
        matchTitle,
        favoriteSongIds,
        targetDifficultyBySongId,
        lockedSongKeys
      )
    )
  })

  const sortedRecords = createMemo(() => {
    return sortRecordsByConditions(filteredRecords(), params.sortConditions())
  })

  // 件数表示
  const totalCount = () => recordsWithSongMeta().length
  const filteredCount = () => filteredRecords().length

  /** レコード統計の集計結果 */
  const stats = createMemo(() => getRecordStats(filteredRecords()))

  return {
    recordsWithSongMeta,
    filteredRecords,
    sortedRecords,
    totalCount,
    filteredCount,
    stats,
  }
}
