import type { Accessor, Setter } from 'solid-js'
import { createMemo } from 'solid-js'
import type { PlayerRecordDTO, SongDTO, VersionDTO } from '../../../../types/api'
import {
  attachSongMetaToRecords,
  type PlayerRecordWithSongMeta,
} from '../../../../utils/recordMerger'
import { getRecordStats, type RecordStats } from '../../utils/recordStats'
import type { FilterState, RecordSortCondition, RecordSortKey } from '../types/types'
import { createRecordTitleMatcher, isRecordMatchedWithTitleMatcher } from './filtering'
import { nextSortState, sortRecordsByConditions } from './sorting'

/** UserRecordページモデルの入力値 */
type UserRecordPageModelParams = {
  songs: Accessor<{ songs: SongDTO[] } | undefined>
  versions: Accessor<{ versions: VersionDTO[] } | undefined>
  sourceRecords: Accessor<PlayerRecordDTO[]>
  filters: Accessor<FilterState>
  sortConditions: Accessor<RecordSortCondition[]>
  setSortConditions: Setter<RecordSortCondition[]>
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
    return sortRecordsByConditions(filteredRecords(), params.sortConditions())
  })

  // 件数表示
  const totalCount = () => recordsWithSongMeta().length
  const filteredCount = () => filteredRecords().length

  /** レコード統計の集計結果 */
  const stats = createMemo(() => getRecordStats(filteredRecords()))

  /**
   * 指定された列で第1ソート状態を進める。
   *
   * @param nextKey - 次に第1ソート対象にする列ID。
   * @returns なし。
   */
  const handleSortChange = (nextKey: RecordSortKey) => {
    const currentPrimarySort = params.sortConditions()[0] ?? null
    const nextSort = nextSortState(
      currentPrimarySort?.key ?? null,
      currentPrimarySort?.direction ?? null,
      nextKey
    )

    if (!nextSort.sortKey || !nextSort.sortDirection) {
      params.setSortConditions([])
      return
    }

    params.setSortConditions((currentSortConditions) => [
      { key: nextSort.sortKey, direction: nextSort.sortDirection },
      ...currentSortConditions.filter((sortCondition) => sortCondition.key !== nextKey).slice(0, 2),
    ])
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
