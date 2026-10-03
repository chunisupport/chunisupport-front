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
import { createRecordViewState } from '../../../hooks/createRecordViewState'
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
import type { FilterState, RecordColumnId, RecordSortKey } from '../../../types/recordFilter'
import { createLockedSongKey } from '../../../usecases/overpower/lockedSongsBatch'
import {
  buildDefaultFilter,
  DEFAULT_FILTER,
  normalizeFilterState,
} from '../../../utils/recordFilterDefaults'
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
import { DEFAULT_RECORD_SORT_CONDITIONS, parseSortParams } from './utils/sorting'

type Props = {
  username: string
  record: UserRecordDTO
  active: boolean
  onReadyChange: (ready: boolean) => void
}

/** 通常レコードフィルターの復元に必要なデータ */
type StandardFilterRestoreSource = {
  masterData: MasterDataDTO
  versions: VersionSummaryDTO[]
}

const useStandardRecordViewState = createRecordViewState<
  FilterState,
  RecordColumnId,
  RecordSortKey,
  StandardFilterRestoreSource
>()

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

  // フィルターダイアログの開閉状態
  const [filterOpen, setFilterOpen] = createSignal(false)
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

  const [searchParams, setSearchParams] = useSearchParams()

  const defaultFilter = createMemo(() => {
    const md = masterData()
    const vs = versionData()?.versions
    return md && vs ? buildDefaultFilter(md, vs) : DEFAULT_FILTER
  })

  const {
    filters,
    setFilters,
    applyFilters,
    overrideFilter,
    visibleColumnIds,
    applyVisibleColumns,
    sortConditions,
    setSortConditions,
    primarySort,
    handleSortChange,
    resetFiltersAndSort,
    filterStatsOpen,
    setFilterStatsOpen,
    ready,
  } = useStandardRecordViewState({
    key: () => props.username,
    initialFilter: { ...DEFAULT_FILTER },
    filterRestoreSource: () => {
      const md = masterData()
      const versions = versionData()
      return md && versions ? { masterData: md, versions: versions.versions } : undefined
    },
    restoreFilter: ({ masterData: md, versions }) =>
      restoreInitialStandardRecordFilter(md, versions),
    defaultFilter,
    saveFilter: saveStandardRecordFilterSetting,
    defaultColumnIds: getDefaultVisibleColumnIds(),
    sanitizeColumnIds: sanitizeVisibleColumnIds,
    readColumns: readStandardRecordColumnsSetting,
    saveColumns: saveStandardRecordColumnsSetting,
    defaultSortConditions: DEFAULT_RECORD_SORT_CONDITIONS,
    parseSortParams,
    searchParams,
    setSearchParams,
  })

  const visibleColumns = createMemo(() => getVisibleColumns(visibleColumnIds()))
  const favoriteSongIds = createMemo<ReadonlySet<string>>(
    () => new Set(favoriteSongs()?.items.map((item) => item.id) ?? [])
  )
  const lockedSongKeys = createMemo<ReadonlySet<string>>(
    () =>
      new Set(
        lockedSongs()?.items.map((item) => createLockedSongKey(item.id, item.is_ultima)) ?? []
      )
  )

  const hasTitleFilterChanges = createMemo(() => filters().title !== defaultFilter().title)
  const hasFilterOptionChanges = createMemo(() =>
    isRecordFilterOptionsChanged(filters(), defaultFilter())
  )
  const filterButtonTone = createMemo(() =>
    isRecordDifficultyFilterOnlyChanged(filters(), defaultFilter()) ? 'difficulty-only' : undefined
  )

  onMount(() => {
    ensureSongsLoaded()
  })

  // forceMount済みの通常レコードへOVER POWER画面から渡されたフィルターを反映する。
  createEffect(() => {
    const pendingFilter = pendingStandardRecordFilter()
    if (!pendingFilter || pendingFilter.username !== props.username) return

    overrideFilter(normalizeFilterState(pendingFilter.filter))
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

  const { sortedRecords, totalCount, filteredCount, stats } = useUserRecordPageModel({
    songs: allSongs,
    versions: versionData,
    sourceRecords: () => props.record.standard,
    filters,
    favoriteSongIds,
    lockedSongKeys,
    sortConditions,
  })

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

    const currentIds = new Set(currentItems.map((item) => item.id))
    const nextIds = new Set(nextDisplayIds)
    const deletedIds = [...currentIds].filter((id) => !nextIds.has(id))
    const addedIds = [...nextIds].filter((id) => !currentIds.has(id))

    try {
      await Promise.all(deletedIds.map(deleteMyFavoriteSong))
      await Promise.all(addedIds.map((id) => addMyFavoriteSong({ id })))
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
              ready() &&
              (!filters().favoriteSongsOnly || (!favoriteSongs.loading && favoriteSongs())) &&
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
                active={props.active}
                onReadyChange={props.onReadyChange}
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
