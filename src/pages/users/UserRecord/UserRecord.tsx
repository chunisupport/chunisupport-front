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
import { fetchMasterData, fetchVersions } from '../../../api/songs'
import {
  addMyFavoriteSong,
  deleteMyFavoriteSong,
  fetchUserFavoriteSongs,
  fetchUserLockedSongs,
} from '../../../api/users'
import { LoadError, Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import {
  readStandardRecordColumnsSetting,
  readStandardRecordFilterSetting,
  saveStandardRecordColumnsSetting,
  saveStandardRecordFilterSetting,
} from '../../../repositories/viewSettingsRepository'
import { authSession } from '../../../stores/authSession'
import { useSongsData } from '../../../stores/songsData'
import {
  consumeStandardRecordFilter,
  pendingStandardRecordFilter,
} from '../../../stores/standardRecordNavigation'
import type { MasterDataDTO, UserRecordDTO, VersionSummaryDTO } from '../../../types/api'
import type { FilterState, RecordColumnId, RecordSortCondition } from '../../../types/recordFilter'
import { createLockedSongKey } from '../../../usecases/overpower/lockedSongsBatch'
import {
  buildDefaultFilter,
  DEFAULT_FILTER,
  normalizeFilterState,
} from '../../../utils/recordFilterDefaults'
import { sanitizeSortQuery } from '../../../utils/sortingQuery'
import FilterStats from '../components/FilterStats'
import FilterToolbar from '../components/FilterToolbar'
import RecordDataTable from '../components/RecordDataTable'
import { isValidSavedStandardFilter } from '../components/savedRecordFilters'
import ColumnSettingsDialog from './components/ColumnSettingsDialog'
import FavoriteSongsDialog from './components/FavoriteSongsDialog'
import FilterDialog from './components/FilterDialog'
import SortDialog from './components/SortDialog'
import { getRecordColumnRenderer } from './utils/columnRenderers'
import {
  getDefaultVisibleColumnIds,
  getVisibleColumns,
  sanitizeVisibleColumnIds,
} from './utils/columns'
import {
  isRecordDifficultyFilterOnlyChanged,
  isRecordFilterOptionsChanged,
} from './utils/filterDialog'
import { useUserRecordPageModel } from './utils/pageModel'
import {
  createInitialRecordSortConditions,
  DEFAULT_RECORD_SORT_CONDITIONS,
  parseSortParams,
} from './utils/sorting'

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
  const [sortSettingsOpen, setSortSettingsOpen] = createSignal(false)
  const [columnSettingsOpen, setColumnSettingsOpen] = createSignal(false)
  const [favoriteSongsOpen, setFavoriteSongsOpen] = createSignal(false)
  const [favoriteSongsUnavailable, setFavoriteSongsUnavailable] = createSignal(false)
  const [lockedSongsUnavailable, setLockedSongsUnavailable] = createSignal(false)
  const canManageFavoriteSongs = createMemo(
    () => authSession.status === 'authenticated' && authSession.user?.username === props.username
  )
  const [favoriteSongs, { refetch: refetchFavoriteSongs }] = createResource(
    () => props.username,
    async (username) => {
      try {
        const response = await fetchUserFavoriteSongs(username)
        setFavoriteSongsUnavailable(false)
        return response
      } catch {
        setFavoriteSongsUnavailable(true)
        return { items: [] }
      }
    }
  )
  const [lockedSongs] = createResource(
    () => props.username,
    async (username) => {
      try {
        const response = await fetchUserLockedSongs(username)
        setLockedSongsUnavailable(false)
        return response
      } catch {
        setLockedSongsUnavailable(true)
        return { items: [] }
      }
    }
  )

  // クエリパラメータ ?sortcol=<col>&sortorder=asc|desc から初期ソートを取得
  const [searchParams, setSearchParams] = useSearchParams()
  const { initialSortKey, initialSortOrder } = parseSortParams(searchParams)

  const [sortConditions, setSortConditions] = createSignal<RecordSortCondition[]>(
    createInitialRecordSortConditions(initialSortKey, initialSortOrder)
  )
  const primarySort = () => sortConditions()[0] ?? null
  const [visibleColumnIds, setVisibleColumnIds] = createSignal<RecordColumnId[]>(
    sanitizeVisibleColumnIds(getDefaultVisibleColumnIds())
  )
  const visibleColumns = createMemo(() => getVisibleColumns(visibleColumnIds()))
  const favoriteSongIds = createMemo<ReadonlySet<string>>(
    () => new Set(favoriteSongs()?.items.map((item) => item.display_id) ?? [])
  )
  const lockedSongKeys = createMemo<ReadonlySet<string>>(
    () =>
      new Set(
        lockedSongs()?.items.map((item) => createLockedSongKey(item.display_id, item.is_ultima)) ??
          []
      )
  )

  const defaultFilter = createMemo(() => {
    const md = masterData()
    const vs = versionData()?.versions
    return md && vs ? buildDefaultFilter(md, vs) : DEFAULT_FILTER
  })
  const hasTitleFilterChanges = createMemo(() => filters().title !== defaultFilter().title)
  const hasFilterOptionChanges = createMemo(() =>
    isRecordFilterOptionsChanged(filters(), defaultFilter())
  )
  const filterButtonTone = createMemo(() =>
    isRecordDifficultyFilterOnlyChanged(filters(), defaultFilter()) ? 'difficulty-only' : undefined
  )

  // クエリパラメータのソートを反映してからURLをクリーン化する。
  createEffect(() => {
    const sortColumn = searchParams.sortcol
    const sortOrder = searchParams.sortorder
    if (!sortColumn && !sortOrder) return

    const { initialSortKey: nextSortKey, initialSortOrder: nextSortOrder } =
      parseSortParams(searchParams)
    setSortConditions(createInitialRecordSortConditions(nextSortKey, nextSortOrder))
    sanitizeSortQuery(searchParams, setSearchParams)
  })
  onMount(() => {
    ensureSongsLoaded()
  })

  let filterRestored = false
  let transferredFilterApplied = false

  // マスタデータ取得後に保存済みフィルター、またはデフォルトフィルターを反映する。
  createEffect(() => {
    const md = masterData()
    const versions = versionData()
    if (filterRestored || !md || !versions) return
    filterRestored = true
    void restoreInitialStandardRecordFilter(md, versions.versions)
      .then((restoredFilter) => {
        if (!transferredFilterApplied) setFilters(restoredFilter)
      })
      .finally(() => setFilterReady(true))
  })

  // forceMount済みの通常レコードへOVER POWER画面から渡されたフィルターを反映する。
  createEffect(() => {
    const pendingFilter = pendingStandardRecordFilter()
    if (!pendingFilter || pendingFilter.username !== props.username) return

    transferredFilterApplied = true
    setFilters(normalizeFilterState(pendingFilter.filter))
    setFilterReady(true)
    consumeStandardRecordFilter(pendingFilter)
  })

  createEffect(() => {
    if (!favoriteSongsUnavailable() || !filters().favoriteSongsOnly) return
    setFilters((current) => ({ ...current, favoriteSongsOnly: false }))
  })

  createEffect(() => {
    if (!lockedSongsUnavailable() || !filters().excludeLockedSongs) return
    setFilters((current) => ({ ...current, excludeLockedSongs: false }))
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
   * 通常レコードのフィルターとソート条件を既定値へ戻し、保存済み設定へ反映する。
   *
   * @returns なし。
   */
  const resetFiltersAndSort = () => {
    applyFilters(defaultFilter())
    setSortConditions(DEFAULT_RECORD_SORT_CONDITIONS.map((condition) => ({ ...condition })))
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
      favoriteSongIds,
      lockedSongKeys,
      sortConditions,
      setSortConditions,
    })

  useDocumentTitle(() => `${props.username}さんのレコード`)

  /**
   * お気に入り楽曲の差分を解除、追加の順に保存する。
   *
   * @param nextDisplayIds - 保存後のお気に入り楽曲ID。
   * @returns 保存と再取得の完了時に解決されるPromise。
   */
  const handleSaveFavoriteSongs = async (nextDisplayIds: string[]): Promise<void> => {
    const currentItems = favoriteSongs()?.items
    if (!currentItems) {
      throw new Error('お気に入り楽曲の読み込みが完了していません。')
    }

    const currentIds = new Set(currentItems.map((item) => item.display_id))
    const nextIds = new Set(nextDisplayIds)
    const deletedIds = [...currentIds].filter((id) => !nextIds.has(id))
    const addedIds = [...nextIds].filter((id) => !currentIds.has(id))

    try {
      await Promise.all(deletedIds.map(deleteMyFavoriteSong))
      await Promise.all(addedIds.map((displayId) => addMyFavoriteSong({ display_id: displayId })))
    } finally {
      await Promise.resolve(refetchFavoriteSongs()).catch(() => undefined)
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
        <Show
          when={!allSongs.error && !masterData.error && !versionData.error}
          fallback={<LoadError error={allSongs.error ?? masterData.error ?? versionData.error} />}
        >
          <Show
            when={
              !isSongsLoading() &&
              masterData() &&
              versionData() &&
              filterReady() &&
              (!filters().excludeLockedSongs || (!lockedSongs.loading && lockedSongs()))
            }
            fallback={<Loading />}
          >
            <div class="mx-2 text-sm">
              {/* フィルター関連UI */}
              <FilterToolbar
                title={filters().title}
                onTitleChange={(value) => applyFilters({ ...filters(), title: value })}
                onOpenFilter={() => setFilterOpen(true)}
                onResetFilter={resetFiltersAndSort}
                onOpenSortSettings={() => setSortSettingsOpen(true)}
                onOpenColumnSettings={() => setColumnSettingsOpen(true)}
                titleActive={hasTitleFilterChanges()}
                filterActive={hasFilterOptionChanges()}
                filterButtonTone={filterButtonTone()}
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
              <RecordDataTable
                records={sortedRecords()}
                columns={visibleColumns()}
                sortKey={primarySort()?.key ?? null}
                sortDirection={primarySort()?.direction ?? null}
                emptyMessage="データがありません"
                resetDeps={filterStatsOpen()}
                getColumnRenderer={getRecordColumnRenderer}
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
                defaultFilter={defaultFilter()}
                onOpenFavoriteSongs={() => setFavoriteSongsOpen(true)}
                favoriteSongsDisabled={
                  !canManageFavoriteSongs() || favoriteSongs.loading || favoriteSongsUnavailable()
                }
                lockedSongsDisabled={lockedSongs.loading || lockedSongsUnavailable()}
              />

              <SortDialog
                open={sortSettingsOpen()}
                onOpenChange={setSortSettingsOpen}
                sortConditions={sortConditions()}
                onApply={setSortConditions}
              />

              <ColumnSettingsDialog
                open={columnSettingsOpen()}
                onOpenChange={setColumnSettingsOpen}
                visibleColumnIds={visibleColumnIds()}
                onApply={applyVisibleColumns}
              />

              <Show when={canManageFavoriteSongs() && allSongs() && favoriteSongs()}>
                <FavoriteSongsDialog
                  open={favoriteSongsOpen()}
                  songs={allSongs()?.songs ?? []}
                  genres={masterData()?.genres ?? []}
                  versions={versionData()?.versions ?? []}
                  favoriteSongs={favoriteSongs()?.items ?? []}
                  onOpenChange={setFavoriteSongsOpen}
                  onSave={handleSaveFavoriteSongs}
                />
              </Show>
            </div>
          </Show>
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserRecord
