import { useSearchParams } from '@solidjs/router'
import {
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  onMount,
  Show,
  Suspense,
} from 'solid-js'

import { fetchVersions } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import { createRecordViewState } from '../../../hooks/createRecordViewState'
import {
  readWorldsendRecordColumnsSetting,
  saveWorldsendRecordColumnsSetting,
  saveWorldsendRecordFilterSetting,
} from '../../../repositories/viewSettingsRepository'
import { useSongsData } from '../../../stores/songsData'
import type { VersionSummaryDTO, WorldsendRecordDTO, WorldsendSongDTO } from '../../../types/api'
import FilterStats from '../components/FilterStats'
import FilterToolbar from '../components/FilterToolbar'
import { getRecordStats } from '../utils/recordStats'
import WorldsendFilterDialog from './components/WorldsendFilterDialog'
import WorldsendRecordTable from './components/WorldsendRecordTable'
import WorldsendSortDialog from './components/WorldsendSortDialog'
import { buildDefaultWorldsendFilter, DEFAULT_WORLDSEND_FILTER } from './types/filterDefaults'
import type { WorldsendFilterState } from './types/filterTypes'
import {
  getDefaultVisibleWorldsendColumnIds,
  sanitizeVisibleWorldsendColumnIds,
  type WorldsendRecordColumnId,
  type WorldsendRecordSortKey,
} from './utils/columns'
import { isWorldsendFilterOptionsChanged } from './utils/filterDialog'
import {
  createWorldsendRecordTitleMatcher,
  isWorldsendRecordMatchedWithTitleMatcher,
} from './utils/filtering'
import { restoreInitialWorldsendRecordFilter } from './utils/initialFilter'
import { attachWorldsendSongMetaToRecords } from './utils/songMeta'
import { DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS, parseWorldsendSortParams } from './utils/sorting'
import WorldsendColumnSettingsDialog from './WorldsendColumnSettingsDialog'

type Props = {
  records: WorldsendRecordDTO[]
  username: string
  active: boolean
  onReadyChange: (ready: boolean) => void
}

/** WORLD'S END フィルターの復元に必要なデータ */
type WorldsendFilterRestoreSource = {
  songs: WorldsendSongDTO[]
  versions: VersionSummaryDTO[]
}

const useWorldsendRecordViewState = createRecordViewState<
  WorldsendFilterState,
  WorldsendRecordColumnId,
  WorldsendRecordSortKey,
  WorldsendFilterRestoreSource
>()

/**
 * WORLD'S END レコード一覧とフィルター操作 UI を表示する。
 *
 * @param props - WORLD'S END レコード配列。
 * @returns WORLD'S END レコードタブの表示要素。
 */
const WorldsendRecord = (props: Props) => {
  const {
    worldsendSongsResponse: worldsendSongs,
    ensureWorldsendSongsLoaded,
    isWorldsendSongsLoading,
  } = useSongsData()
  const [versionData] = createResource(fetchVersions)
  const [filterOpen, setFilterOpen] = createSignal(false)
  const [sortSettingsOpen, setSortSettingsOpen] = createSignal(false)
  const [columnSettingsOpen, setColumnSettingsOpen] = createSignal(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const defaultFilter = createMemo(() =>
    buildDefaultWorldsendFilter(worldsendSongs()?.songs ?? [], versionData()?.versions ?? [])
  )

  const {
    filters,
    applyFilters,
    visibleColumnIds,
    applyVisibleColumns,
    sortConditions,
    setSortConditions,
    handleSortChange,
    resetFiltersAndSort,
    filterStatsOpen,
    setFilterStatsOpen,
    ready,
  } = useWorldsendRecordViewState({
    key: () => props.username,
    initialFilter: { ...DEFAULT_WORLDSEND_FILTER },
    filterRestoreSource: () => {
      const songs = worldsendSongs()
      const versions = versionData()
      return songs && versions ? { songs: songs.songs, versions: versions.versions } : undefined
    },
    restoreFilter: ({ songs, versions }) => restoreInitialWorldsendRecordFilter(songs, versions),
    defaultFilter,
    saveFilter: saveWorldsendRecordFilterSetting,
    defaultColumnIds: getDefaultVisibleWorldsendColumnIds(),
    sanitizeColumnIds: sanitizeVisibleWorldsendColumnIds,
    readColumns: readWorldsendRecordColumnsSetting,
    saveColumns: saveWorldsendRecordColumnsSetting,
    defaultSortConditions: DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS,
    parseSortParams: parseWorldsendSortParams,
    searchParams,
    setSearchParams,
  })

  onMount(() => {
    ensureWorldsendSongsLoaded()
  })

  const hasTitleFilterChanges = createMemo(() => filters().title !== defaultFilter().title)
  const hasFilterOptionChanges = createMemo(() =>
    isWorldsendFilterOptionsChanged(filters(), defaultFilter())
  )

  const recordsWithSongMeta = createMemo(() => {
    const songs = worldsendSongs()
    const versions = versionData()
    if (!songs || !versions) return []

    return attachWorldsendSongMetaToRecords(songs.songs, props.records, versions.versions)
  })

  const filteredRecords = createMemo(() => {
    const currentFilters = filters()
    const matchTitle = createWorldsendRecordTitleMatcher(currentFilters.title)
    return recordsWithSongMeta().filter((record) =>
      isWorldsendRecordMatchedWithTitleMatcher(record, currentFilters, matchTitle)
    )
  })
  const stats = createMemo(() => getRecordStats(filteredRecords()))

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
        <Show
          when={!worldsendSongs.error && !versionData.error}
          fallback={<LoadError error={worldsendSongs.error ?? versionData.error} />}
        >
          <Show
            when={!isWorldsendSongsLoading() && versionData() && ready()}
            fallback={<Loading />}
          >
            <div class="mx-2 text-sm">
              <FilterToolbar
                title={filters().title}
                onTitleChange={(value) => applyFilters({ ...filters(), title: value })}
                onOpenFilter={() => setFilterOpen(true)}
                onResetFilter={resetFiltersAndSort}
                onOpenSortSettings={() => setSortSettingsOpen(true)}
                onOpenColumnSettings={() => setColumnSettingsOpen(true)}
                titleActive={hasTitleFilterChanges()}
                filterActive={hasFilterOptionChanges()}
              />
              {filteredRecords().length > 0 && (
                <FilterStats
                  stats={stats()}
                  open={filterStatsOpen()}
                  onOpenChange={setFilterStatsOpen}
                />
              )}

              <p class="mb-2 text-sm text-text-muted">
                全 {recordsWithSongMeta().length} 件中 {filteredRecords().length} 件を表示
              </p>

              <WorldsendRecordTable
                records={filteredRecords()}
                active={props.active}
                onReadyChange={props.onReadyChange}
                resetDeps={filterStatsOpen()}
                visibleColumnIds={visibleColumnIds()}
                sortConditions={sortConditions()}
                onSortChange={handleSortChange}
              />

              <WorldsendColumnSettingsDialog
                open={columnSettingsOpen()}
                onOpenChange={setColumnSettingsOpen}
                visibleColumnIds={visibleColumnIds()}
                onApply={applyVisibleColumns}
              />

              <WorldsendFilterDialog
                open={filterOpen()}
                onOpenChange={setFilterOpen}
                filters={filters()}
                onChange={applyFilters}
                defaultFilter={defaultFilter()}
              />

              <WorldsendSortDialog
                open={sortSettingsOpen()}
                onOpenChange={setSortSettingsOpen}
                sortConditions={sortConditions()}
                onApply={setSortConditions}
              />
            </div>
          </Show>
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default WorldsendRecord
