import { useSearchParams } from '@solidjs/router'
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

import { fetchVersions } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import {
  readWorldsendRecordColumnsSetting,
  saveWorldsendRecordColumnsSetting,
  saveWorldsendRecordFilterSetting,
} from '../../../repositories/viewSettingsRepository'
import { useSongsData } from '../../../stores/songsData'
import type { WorldsendRecordDTO } from '../../../types/api'
import FilterStats from '../components/FilterStats'
import { sanitizeSortQuery } from '../recordTable/sortingQuery'
import FilterToolbar from '../UserRecord/components/FilterToolbar'
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
import {
  createInitialWorldsendRecordSortConditions,
  nextPrimaryWorldsendRecordSortCondition,
  normalizeWorldsendRecordSortConditions,
  parseWorldsendSortParams,
  type WorldsendRecordSortCondition,
} from './utils/sorting'
import WorldsendColumnSettingsDialog from './WorldsendColumnSettingsDialog'

type Props = {
  records: WorldsendRecordDTO[]
}

type WorldsendSortKey = WorldsendRecordSortKey

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
  const [filters, setFilters] = createSignal<WorldsendFilterState>({
    ...DEFAULT_WORLDSEND_FILTER,
  })
  const [filterReady, setFilterReady] = createSignal(false)
  const [filterOpen, setFilterOpen] = createSignal(false)
  const [sortSettingsOpen, setSortSettingsOpen] = createSignal(false)
  const [columnSettingsOpen, setColumnSettingsOpen] = createSignal(false)
  const [filterStatsOpen, setFilterStatsOpen] = createSignal(false)
  const [visibleColumnIds, setVisibleColumnIds] = createSignal<WorldsendRecordColumnId[]>(
    sanitizeVisibleWorldsendColumnIds(getDefaultVisibleWorldsendColumnIds())
  )

  // クエリパラメータ ?sortcol=<col>&sortorder=asc|desc から初期ソートを取得
  const [searchParams, setSearchParams] = useSearchParams()
  const { initialSortKey, initialSortOrder } = parseWorldsendSortParams(searchParams)
  const [sortConditions, setSortConditions] = createSignal<WorldsendRecordSortCondition[]>(
    createInitialWorldsendRecordSortConditions(initialSortKey, initialSortOrder)
  )
  const primarySort = () => sortConditions()[0] ?? null

  // クエリパラメータが存在した場合にURLをクリーン化（ソート自体は維持）
  onMount(() => sanitizeSortQuery(searchParams, setSearchParams))
  onMount(() => {
    ensureWorldsendSongsLoaded()
  })

  const defaultFilter = createMemo(() =>
    buildDefaultWorldsendFilter(worldsendSongs()?.songs ?? [], versionData()?.versions ?? [])
  )
  const hasTitleFilterChanges = createMemo(() => filters().title !== defaultFilter().title)
  const hasFilterOptionChanges = createMemo(() =>
    isWorldsendFilterOptionsChanged(filters(), defaultFilter())
  )

  let filterRestored = false

  createEffect(() => {
    const songs = worldsendSongs()
    const versions = versionData()
    if (filterRestored || !songs || !versions) return
    filterRestored = true
    void restoreInitialWorldsendRecordFilter(songs.songs, versions.versions)
      .then(setFilters)
      .finally(() => setFilterReady(true))
  })

  onMount(() => {
    void readWorldsendRecordColumnsSetting()
      .then((savedColumnIds) => {
        if (Array.isArray(savedColumnIds)) {
          setVisibleColumnIds(
            sanitizeVisibleWorldsendColumnIds(savedColumnIds as WorldsendRecordColumnId[])
          )
        }
      })
      .catch(() => undefined)
  })

  /**
   * WORLD'S END レコードの現在フィルターを画面へ反映し、IndexedDB へ保存する。
   *
   * @param nextFilters - 次に適用するフィルター状態。
   * @returns なし。
   */
  const applyFilters = (nextFilters: WorldsendFilterState) => {
    setFilters(nextFilters)
    void saveWorldsendRecordFilterSetting(nextFilters).catch(() => undefined)
  }

  /**
   * WORLD'S END レコードの表示列設定を画面へ反映し、IndexedDB へ保存する。
   *
   * @param nextVisibleColumnIds - 次に表示する列 ID 配列。
   * @returns なし。
   */
  const applyVisibleColumns = (nextVisibleColumnIds: WorldsendRecordColumnId[]) => {
    const sanitizedColumnIds = sanitizeVisibleWorldsendColumnIds(nextVisibleColumnIds)
    setVisibleColumnIds(sanitizedColumnIds)
    void saveWorldsendRecordColumnsSetting(sanitizedColumnIds).catch(() => undefined)
  }

  /**
   * 指定された列で WORLD'S END レコードの第1ソート状態を進める。
   *
   * @param nextKey - 次に第1ソート対象にする列ID。
   * @returns なし。
   */
  const handleSortChange = (nextKey: WorldsendSortKey): void => {
    const nextPrimarySort = nextPrimaryWorldsendRecordSortCondition(
      sortConditions()[0] ?? null,
      nextKey
    )

    setSortConditions((currentSortConditions) =>
      normalizeWorldsendRecordSortConditions([nextPrimarySort, ...currentSortConditions.slice(1)])
    )
  }

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
            when={!isWorldsendSongsLoading() && versionData() && filterReady()}
            fallback={<Loading />}
          >
            <div class="mx-2 text-sm">
              <FilterToolbar
                title={filters().title}
                onTitleChange={(value) => applyFilters({ ...filters(), title: value })}
                onOpenFilter={() => setFilterOpen(true)}
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
                visibleColumnIds={visibleColumnIds()}
                sortKey={primarySort()?.key ?? null}
                sortDirection={primarySort()?.direction ?? null}
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
