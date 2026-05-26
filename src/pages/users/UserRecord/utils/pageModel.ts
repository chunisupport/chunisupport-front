import type { Accessor, Setter } from 'solid-js'
import { createMemo } from 'solid-js'
import type { PlayerRecordDTO, SongDTO, VersionDTO } from '../../../../types/api'
import {
  attachSongMetaToRecords,
  type PlayerRecordWithSongMeta,
} from '../../../../utils/recordMerger'
import type { SortDirection } from '../../recordTable/sortingQuery'
import { getRecordStats, type RecordStats } from '../../utils/recordStats'
import type { FilterState, RecordSortKey } from '../types/types'
import { createRecordTitleMatcher, isRecordMatchedWithTitleMatcher } from './filtering'
import { nextSortState, sortRecords } from './sorting'

/** UserRecordページモデルの入力値 */
type UserRecordPageModelParams = {
  songs: Accessor<{ songs: SongDTO[] } | undefined>
  versions: Accessor<{ versions: VersionDTO[] } | undefined>
  sourceRecords: Accessor<PlayerRecordDTO[]>
  filters: Accessor<FilterState>
  sortKey: Accessor<RecordSortKey | null>
  sortDirection: Accessor<SortDirection | null>
  setSortKey: Setter<RecordSortKey | null>
  setSortDirection: Setter<SortDirection | null>
}

/** UserRecordページモデルが画面へ返す導出値と操作 */
type UserRecordPageModel = {
  recordsWithSongMeta: Accessor<PlayerRecordWithSongMeta[]>
  filteredRecords: Accessor<PlayerRecordWithSongMeta[]>
  sortedRecords: Accessor<PlayerRecordWithSongMeta[]>
  totalCount: Accessor<number>
  filteredCount: Accessor<number>
  stats: Accessor<RecordStats>
  handleSortChange: (nextKey: RecordSortKey) => void
}

/**
 * UserRecordページで利用するレコード導出値とソート操作をまとめて生成する。
 * @param params 楽曲マスタ、レコード、フィルター、ソート状態
 * @returns レコード一覧、件数、統計、ソート変更ハンドラをまとめたページモデル
 */
export function useUserRecordPageModel(params: UserRecordPageModelParams): UserRecordPageModel {
  /** 未プレイを含む全曲のレコード */
  const recordsWithSongMeta = createMemo(() => {
    const songs = params.songs()
    const versions = params.versions()
    if (!songs || !versions) return []
    return attachSongMetaToRecords(songs.songs, params.sourceRecords(), versions.versions)
  })

  /** フィルター適用後のレコード */
  const filteredRecords = createMemo(() => {
    const records = recordsWithSongMeta()
    const currentFilters = params.filters()
    const matchTitle = createRecordTitleMatcher(currentFilters.title)
    return records.filter((record) =>
      isRecordMatchedWithTitleMatcher(record, currentFilters, matchTitle)
    )
  })

  const sortedRecords = createMemo(() => {
    return sortRecords(filteredRecords(), params.sortKey(), params.sortDirection())
  })

  // 件数表示
  const totalCount = () => recordsWithSongMeta().length
  const filteredCount = () => filteredRecords().length

  /** レコード統計の集計結果 */
  const stats = createMemo(() => getRecordStats(filteredRecords()))

  /**
   * 指定された列へソート状態を進める。
   * @param nextKey 次にソート対象にする列ID
   */
  const handleSortChange = (nextKey: RecordSortKey) => {
    const nextSort = nextSortState(params.sortKey(), params.sortDirection(), nextKey)
    params.setSortKey(nextSort.sortKey)
    params.setSortDirection(nextSort.sortDirection)
  }

  return {
    recordsWithSongMeta,
    filteredRecords,
    sortedRecords,
    totalCount,
    filteredCount,
    stats,
    handleSortChange,
  }
}
