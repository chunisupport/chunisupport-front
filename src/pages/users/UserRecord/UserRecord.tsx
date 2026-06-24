import { useSearchParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import {
  createEffect,
  createResource,
  createSignal,
  ErrorBoundary,
  onMount,
  Show,
  Suspense,
} from 'solid-js'
import { fetchMasterData, fetchVersions } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import {
  readStandardRecordColumnsSetting,
  readStandardRecordFilterSetting,
  saveStandardRecordColumnsSetting,
  saveStandardRecordFilterSetting,
} from '../../../repositories/viewSettingsRepository'
import { useSongsData } from '../../../stores/songsData'
import type { MasterDataDTO, UserRecordDTO, VersionSummaryDTO } from '../../../types/api'
import FilterStats from '../components/FilterStats'
import { isValidSavedStandardFilter } from '../components/savedRecordFilters'
import { type SortDirection, sanitizeSortQuery } from '../recordTable/sortingQuery'
import ColumnSettingsDialog from './components/ColumnSettingsDialog'
import FilterDialog from './components/FilterDialog'
import FilterToolbar from './components/FilterToolbar'
import RecordTable from './components/RecordTable'
import { buildDefaultFilter, DEFAULT_FILTER, normalizeFilterState } from './types/filterDefaults'
import type { FilterState, RecordColumnId, RecordSortKey } from './types/types'
import { getDefaultVisibleColumnIds, sanitizeVisibleColumnIds } from './utils/columns'
import { getDefaultFilter } from './utils/filtering'
import { useUserRecordPageModel } from './utils/pageModel'
import { parseSortParams } from './utils/sorting'

type Props = {
  username: string
  record: UserRecordDTO
}

/**
 * 通常レコードの初期フィルターを保存済み設定、または既定値から決定する。
 *
 * @param masterData - フィルター既定値の構築に使うマスターデータ。
 * @param versions - フィルター既定値の構築に使うバージョン一覧。
 * @returns 初回表示に適用するフィルター状態。
 */
const restoreInitialStandardRecordFilter = async (
  masterData: MasterDataDTO,
  versions: VersionSummaryDTO[]
): Promise<FilterState> => {
  const defaultFilter = buildDefaultFilter(masterData, versions)

  try {
    const savedFilter = await readStandardRecordFilterSetting()
    return isValidSavedStandardFilter(savedFilter)
      ? normalizeFilterState(savedFilter)
      : defaultFilter
  } catch {
    return defaultFilter
  }
}

/**
 * 通常レコード一覧とフィルター操作 UI を表示する。
 *
 * @param props - 表示対象ユーザー名と通常レコードを含むレスポンス。
 * @returns 通常レコードタブの表示要素。
 */
const UserRecord: Component<Props> = (props) => {
  const { songsResponse: allSongs, ensureSongsLoaded, isSongsLoading } = useSongsData()
  const [masterData] = createResource(fetchMasterData)
  const [versionData] = createResource(fetchVersions)

  // フィルターの状態
  const [filters, setFilters] = createSignal<FilterState>({
    // createEffect内で初期化されるので、ここでは仮の値をセット
    ...DEFAULT_FILTER,
  })
  const [filterReady, setFilterReady] = createSignal(false)

  // フィルターダイアログの開閉状態
  const [filterOpen, setFilterOpen] = createSignal(false)
  const [filterStatsOpen, setFilterStatsOpen] = createSignal(false)
  const [columnSettingsOpen, setColumnSettingsOpen] = createSignal(false)

  // クエリパラメータ ?sortcol=<col>&sortorder=asc|desc から初期ソートを取得
  const [searchParams, setSearchParams] = useSearchParams()
  const { initialSortKey, initialSortOrder } = parseSortParams(searchParams)

  const [sortKey, setSortKey] = createSignal<RecordSortKey | null>(initialSortKey)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(initialSortOrder)
  const [visibleColumnIds, setVisibleColumnIds] = createSignal<RecordColumnId[]>(
    sanitizeVisibleColumnIds(getDefaultVisibleColumnIds())
  )

  // クエリパラメータが存在した場合にURLをクリーン化（ソート自体は維持）
  onMount(() => sanitizeSortQuery(searchParams, setSearchParams))
  onMount(() => {
    ensureSongsLoaded()
  })

  let filterRestored = false

  // マスタデータ取得後に保存済みフィルター、またはデフォルトフィルターを反映する。
  createEffect(() => {
    const md = masterData()
    const versions = versionData()
    if (filterRestored || !md || !versions) return
    filterRestored = true
    void restoreInitialStandardRecordFilter(md, versions.versions)
      .then(setFilters)
      .finally(() => setFilterReady(true))
  })

  onMount(() => {
    void readStandardRecordColumnsSetting()
      .then((savedColumnIds) => {
        if (Array.isArray(savedColumnIds)) {
          setVisibleColumnIds(sanitizeVisibleColumnIds(savedColumnIds as RecordColumnId[]))
        }
      })
      .catch(() => undefined)
  })

  /**
   * 通常レコードの現在フィルターを画面へ反映し、保存可能な場合は IndexedDB へ保存する。
   *
   * @param nextFilters - 次に適用するフィルター状態。
   * @returns なし。
   */
  const applyFilters = (nextFilters: FilterState) => {
    setFilters(nextFilters)
    void saveStandardRecordFilterSetting(nextFilters).catch(() => undefined)
  }

  /**
   * 通常レコードの表示列設定を画面へ反映し、IndexedDB へ保存する。
   *
   * @param nextVisibleColumnIds - 次に表示する列 ID 配列。
   * @returns なし。
   */
  const applyVisibleColumns = (nextVisibleColumnIds: RecordColumnId[]) => {
    const sanitizedColumnIds = sanitizeVisibleColumnIds(nextVisibleColumnIds)
    setVisibleColumnIds(sanitizedColumnIds)
    void saveStandardRecordColumnsSetting(sanitizedColumnIds).catch(() => undefined)
  }

  const { sortedRecords, totalCount, filteredCount, stats, handleSortChange } =
    useUserRecordPageModel({
      songs: allSongs,
      versions: versionData,
      sourceRecords: () => props.record.standard,
      filters,
      sortKey,
      sortDirection,
      setSortKey,
      setSortDirection,
    })

  useDocumentTitle(() => `${props.username}さんのレコード`)

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
        <Show
          when={!allSongs.error && !masterData.error && !versionData.error}
          fallback={<LoadError error={allSongs.error ?? masterData.error ?? versionData.error} />}
        >
          <Show
            when={!isSongsLoading() && masterData() && versionData() && filterReady()}
            fallback={<Loading />}
          >
            <div class="mx-2 text-sm">
              {/* フィルター関連UI */}
              <FilterToolbar
                title={filters().title}
                onTitleChange={(value) => setFilters({ ...filters(), title: value })}
                onOpenFilter={() => setFilterOpen(true)}
                onOpenColumnSettings={() => setColumnSettingsOpen(true)}
              />

              {/* フィルター統計 */}
              {filteredCount() > 0 && (
                <FilterStats
                  stats={stats()}
                  open={filterStatsOpen()}
                  onOpenChange={setFilterStatsOpen}
                />
              )}

              <p class="mb-2 text-sm text-text-muted">
                全 {totalCount()} 件中 {filteredCount()} 件を表示
              </p>

              {/* レコード一覧 */}
              <RecordTable
                records={sortedRecords()}
                statsOpen={filterStatsOpen()}
                sortKey={sortKey()}
                sortDirection={sortDirection()}
                visibleColumnIds={visibleColumnIds()}
                onSortChange={handleSortChange}
              />

              {/* フィルターダイアログ */}
              <FilterDialog
                open={filterOpen()}
                onOpenChange={setFilterOpen}
                filters={filters()}
                onChange={applyFilters}
                masterData={masterData()}
                versions={versionData()?.versions}
                defaultFilter={getDefaultFilter(masterData(), versionData()?.versions)}
              />

              <ColumnSettingsDialog
                open={columnSettingsOpen()}
                onOpenChange={setColumnSettingsOpen}
                visibleColumnIds={visibleColumnIds()}
                onApply={applyVisibleColumns}
              />
            </div>
          </Show>
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserRecord
