import { useSearchParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  onMount,
  Show,
  Suspense,
} from 'solid-js'
import { fetchAllSongs, fetchMasterData, fetchVersionSummaries } from '../../../api/songs'
import { Loading, ScrollToTop } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { UserRecordDTO } from '../../../types/api'
import { attachSongMetaToRecords } from '../../../utils/recordMerger'
import FilterDialog from './components/FilterDialog'
import FilterStats from './components/FilterStats'
import FilterToolbar from './components/FilterToolbar'
import RecordTable from './components/RecordTable'
import { DEFAULT_FILTER, getMasterDataDefaults } from './types/filterDefaults'
import type { FilterState, RecordSortKey, SortDirection } from './types/types'
import { getDefaultFilter, isRecordMatched } from './utils/filtering'
import { getRecordStats } from './utils/recordStats'
import { nextSortState, parseSortParams, sortRecords } from './utils/sorting'
import { loadSavedFilters, type SavedFilter } from './utils/storage'

type Props = {
  username: string
  record: UserRecordDTO
}

const UserRecord: Component<Props> = (props) => {
  const [allSongs] = createResource(fetchAllSongs)
  const [masterData] = createResource(fetchMasterData)
  const [versionSummaries] = createResource(fetchVersionSummaries)

  // 保存済みフィルター一覧
  const [, setSavedFilters] = createSignal<SavedFilter[]>(loadSavedFilters())

  // フィルターの状態
  const [filters, setFilters] = createSignal<FilterState>({
    // createEffect内で初期化されるので、ここでは仮の値をセット
    ...DEFAULT_FILTER,
  })

  // フィルターダイアログの開閉状態
  const [filterOpen, setFilterOpen] = createSignal(false)
  const [filterStatsOpen, setFilterStatsOpen] = createSignal(false)

  // クエリパラメータ ?sortcol=<col>&sortorder=asc|desc から初期ソートを取得
  const [searchParams, setSearchParams] = useSearchParams()
  const { initialSortKey, initialSortOrder } = parseSortParams(searchParams)

  const [sortKey, setSortKey] = createSignal<RecordSortKey | null>(initialSortKey)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(initialSortOrder)

  // クエリパラメータが存在した場合にURLをクリーン化（ソート自体は維持）
  onMount(() => {
    if (searchParams.sortcol !== undefined || searchParams.sortorder !== undefined) {
      setSearchParams({ sortcol: undefined, sortorder: undefined }, { replace: true })
    }
  })

  // フィルターを初期化
  // マスタデータ取得後にgenres/versionsを全選択
  createEffect(() => {
    const md = masterData()
    const versions = versionSummaries()
    if (!md || !versions) return
    setFilters((prev) => ({
      ...prev,
      ...getMasterDataDefaults(md, versions.versions),
    }))
  })

  /** 未プレイを含む全曲のレコード */
  const recordsWithSongMeta = createMemo(() => {
    const songs = allSongs()
    const versions = versionSummaries()
    if (!songs || !versions) return []
    return attachSongMetaToRecords(songs.songs, props.record.all, versions.versions)
  })

  /** フィルター適用後のレコード */
  const filteredRecords = createMemo(() => {
    const records = recordsWithSongMeta()
    const currentFilters = filters()
    return records.filter((record) => isRecordMatched(record, currentFilters))
  })

  const sortedRecords = createMemo(() => {
    return sortRecords(filteredRecords(), sortKey(), sortDirection())
  })

  const handleSortChange = (nextKey: RecordSortKey) => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
  }

  // 件数表示
  const totalCount = () => recordsWithSongMeta().length
  const filteredCount = () => filteredRecords().length

  /** レコード統計の集計結果 */
  const stats = createMemo(() => getRecordStats(filteredRecords()))

  useDocumentTitle(() => `${props.username}さんのレコード`)

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={allSongs() && masterData() && versionSummaries()} fallback={<Loading />}>
          <div class="mx-2 text-sm">
            {/* フィルター関連UI */}
            <FilterToolbar
              title={filters().title}
              onTitleChange={(value) => setFilters({ ...filters(), title: value })}
              onOpenFilter={() => setFilterOpen(true)}
            />

            {/* フィルター統計 */}
            {filteredCount() > 0 && (
              <FilterStats
                stats={stats()}
                open={filterStatsOpen()}
                onOpenChange={setFilterStatsOpen}
              />
            )}

            <p class="mb-2 text-sm text-gray-600">
              全 {totalCount()} 件中 {filteredCount()} 件を表示
            </p>

            {/* レコード一覧 */}
            <RecordTable
              records={sortedRecords()}
              statsOpen={filterStatsOpen()}
              sortKey={sortKey()}
              sortDirection={sortDirection()}
              onSortChange={handleSortChange}
            />

            {/* フィルターダイアログ */}
            <FilterDialog
              open={filterOpen()}
              onOpenChange={setFilterOpen}
              filters={filters()}
              onChange={setFilters}
              masterData={masterData()}
              versions={versionSummaries()?.versions}
              defaultFilter={getDefaultFilter(masterData(), versionSummaries()?.versions)}
              setSavedFilters={setSavedFilters}
            />
          </div>
        </Show>
        <ScrollToTop />
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserRecord
