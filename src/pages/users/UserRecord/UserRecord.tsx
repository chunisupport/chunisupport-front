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
import { addMyFavoriteSong, deleteMyFavoriteSong, fetchUserFavoriteSongs } from '../../../api/users'
import { LoadError, Loading } from '../../../components'
import {
  RECORD_ROW_HOVER_CLASS,
  RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS,
} from '../../../components/common/record/RecordDisplayParts'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import {
  readStandardRecordColumnsSetting,
  readStandardRecordFilterSetting,
  saveStandardRecordColumnsSetting,
  saveStandardRecordFilterSetting,
} from '../../../repositories/viewSettingsRepository'
import { authSession } from '../../../stores/authSession'
import { useSongsData } from '../../../stores/songsData'
import type { MasterDataDTO, UserRecordDTO, VersionSummaryDTO } from '../../../types/api'
import type { FilterState, RecordColumnId, RecordSortCondition } from '../../../types/recordFilter'
import {
  buildDefaultFilter,
  DEFAULT_FILTER,
  normalizeFilterState,
} from '../../../utils/recordFilterDefaults'
import { sanitizeSortQuery } from '../../../utils/sortingQuery'
import FilterStats from '../components/FilterStats'
import RecordDataTable from '../components/RecordDataTable'
import { isValidSavedStandardFilter } from '../components/savedRecordFilters'
import ColumnSettingsDialog from './components/ColumnSettingsDialog'
import FavoriteSongsDialog from './components/FavoriteSongsDialog'
import FilterDialog from './components/FilterDialog'
import FilterToolbar from './components/FilterToolbar'
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
import { createInitialRecordSortConditions, parseSortParams } from './utils/sorting'

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

  createEffect(() => {
    if (!favoriteSongsUnavailable() || !filters().favoriteSongsOnly) return
    setFilters((current) => ({ ...current, favoriteSongsOnly: false }))
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
      favoriteSongIds,
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
            when={!isSongsLoading() && masterData() && versionData() && filterReady()}
            fallback={<Loading />}
          >
            <div class="mx-2 text-sm">
              {/* フィルター関連UI */}
              <FilterToolbar
                title={filters().title}
                onTitleChange={(value) => applyFilters({ ...filters(), title: value })}
                onOpenFilter={() => setFilterOpen(true)}
                onOpenSortSettings={() => setSortSettingsOpen(true)}
                onOpenColumnSettings={() => setColumnSettingsOpen(true)}
                onOpenFavoriteSongs={() => setFavoriteSongsOpen(true)}
                titleActive={hasTitleFilterChanges()}
                filterActive={hasFilterOptionChanges()}
                filterButtonTone={filterButtonTone()}
                favoriteSongsDisabled={
                  !canManageFavoriteSongs() || favoriteSongs.loading || favoriteSongsUnavailable()
                }
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
                getRowClass={(rowIndex) =>
                  rowIndex === 0 ? RECORD_ROW_HOVER_CLASS : RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS
                }
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
