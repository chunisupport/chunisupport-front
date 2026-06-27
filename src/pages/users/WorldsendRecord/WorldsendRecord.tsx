import { useSearchParams } from '@solidjs/router'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  onMount,
  Show,
  Suspense,
} from 'solid-js'

import { fetchVersions } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import {
  readWorldsendRecordColumnsSetting,
  readWorldsendRecordFilterSetting,
  saveWorldsendRecordColumnsSetting,
  saveWorldsendRecordFilterSetting,
} from '../../../repositories/viewSettingsRepository'
import { useSongsData } from '../../../stores/songsData'
import type { VersionSummaryDTO, WorldsendRecordDTO, WorldsendSongDTO } from '../../../types/api'
import {
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../../utils/versionConverter'
import { createRecordTableVirtualizer } from '../components/createRecordTableVirtualizer'
import FilterStats from '../components/FilterStats'
import {
  type ColumnRenderer,
  RECORD_ALPHANUMERIC_COLUMN_CLASS,
  RECORD_CELL_BASE_CLASS,
  RECORD_CELL_CENTER_TEXT_CLASS,
  RECORD_ROW_HEIGHT,
  RECORD_ROW_HOVER_CLASS,
  RecordFullChainCell,
  RecordHardLampCell,
  RecordHeaderButton,
  RecordJusticeCountCell,
  RecordLampCell,
  RecordScoreCell,
  RecordTitleCell,
  RecordUpdatedAtCell,
} from '../components/SharedRecordTableColumns'
import { isValidSavedWorldsendFilter } from '../components/savedRecordFilters'
import { sanitizeSortQuery } from '../recordTable/sortingQuery'
import { buildWorldsendSongDetailPath } from '../UserPage/worldsendNavigation'
import { worldsendTableWrapperClass } from '../UserPage/worldsendTableStyles'
import FilterToolbar from '../UserRecord/components/FilterToolbar'
import { formatJusticeCountForAj } from '../UserRecord/utils/justiceCountDisplay'
import { formatUpdatedAt } from '../UserRecord/utils/updatedAt'
import { getRecordStats } from '../utils/recordStats'
import WorldsendFilterDialog from './components/WorldsendFilterDialog'
import WorldsendSortDialog from './components/WorldsendSortDialog'
import { buildDefaultWorldsendFilter, DEFAULT_WORLDSEND_FILTER } from './types/filterDefaults'
import type { WorldsendFilterState, WorldsendRecordWithSongMeta } from './types/filterTypes'
import {
  createGridTemplateColumns,
  getDefaultVisibleWorldsendColumnIds,
  getVisibleWorldsendColumns,
  sanitizeVisibleWorldsendColumnIds,
  type WorldsendRecordColumnId,
  type WorldsendRecordSortKey,
} from './utils/columns'
import { isWorldsendFilterOptionsChanged } from './utils/filterDialog'
import {
  createWorldsendRecordTitleMatcher,
  isWorldsendRecordMatchedWithTitleMatcher,
} from './utils/filtering'
import {
  createInitialWorldsendRecordSortConditions,
  nextPrimaryWorldsendRecordSortCondition,
  normalizeWorldsendRecordSortConditions,
  parseWorldsendSortParams,
  sortWorldsendRecordsByConditions,
  type WorldsendRecordSortCondition,
} from './utils/sorting'
import WorldsendColumnSettingsDialog from './WorldsendColumnSettingsDialog'

type Props = {
  records: WorldsendRecordDTO[]
}

type WorldsendSortKey = WorldsendRecordSortKey

/**
 * WORLD'S END レコードの初期フィルターを保存済み設定、または既定値から決定する。
 *
 * @param songs - フィルター既定値の構築に使う WORLD'S END 楽曲一覧。
 * @param versions - フィルター既定値の構築に使うバージョン一覧。
 * @returns 初回表示に適用する WORLD'S END フィルター状態。
 */
const restoreInitialWorldsendRecordFilter = async (
  songs: WorldsendSongDTO[],
  versions: VersionSummaryDTO[]
): Promise<WorldsendFilterState> => {
  const defaultFilter = buildDefaultWorldsendFilter(songs, versions)

  try {
    const savedFilter = await readWorldsendRecordFilterSetting()
    return isValidSavedWorldsendFilter(savedFilter) ? savedFilter : defaultFilter
  } catch {
    return defaultFilter
  }
}

const worldsendLevelLabel = (levelStar: number | null | undefined) => {
  if (typeof levelStar !== 'number' || levelStar <= 0) {
    return '-'
  }

  return `★${levelStar}`
}

const attachWorldsendSongMetaToRecords = (
  songs: WorldsendSongDTO[],
  records: WorldsendRecordDTO[],
  versions: VersionSummaryDTO[]
): WorldsendRecordWithSongMeta[] => {
  const songMap = new Map(songs.map((song) => [song.id, song]))

  return records.map((record) => {
    const song = songMap.get(record.id)

    return {
      ...record,
      genre: song?.genre ?? null,
      reading: song?.reading ?? null,
      release: song?.release ?? null,
      release_version: getShortVersionName(
        resolveVersionNameByReleaseDate(song?.release ?? null, versions)
      ),
    }
  })
}

const worldsendColumnRenderers: Record<
  WorldsendRecordColumnId,
  ColumnRenderer<WorldsendRecordWithSongMeta>
> = {
  title: (record) => (
    <RecordTitleCell href={buildWorldsendSongDetailPath(record.id)} title={record.title} />
  ),
  attribute: (record) => (
    <div class={RECORD_CELL_CENTER_TEXT_CLASS}>
      <span class="inline-block w-full text-center leading-none">{record.attribute ?? '-'}</span>
    </div>
  ),
  level: (record) => (
    <div class={`${RECORD_CELL_BASE_CLASS} ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}>
      <span class="inline-block leading-none">{worldsendLevelLabel(record.level_star)}</span>
    </div>
  ),
  score: (record) => <RecordScoreCell record={record} />,
  lamp: (record) => <RecordLampCell record={record} />,
  hardLamp: (record) => <RecordHardLampCell record={record} />,
  fullChain: (record) => <RecordFullChainCell record={record} />,
  justiceCount: (record) => (
    <RecordJusticeCountCell
      record={record}
      calcJusticeCount={(target) =>
        formatJusticeCountForAj({
          comboLamp: target.combo_lamp,
          justiceCount: target.justice_count,
        })
      }
    />
  ),
  updatedAt: (record) => <RecordUpdatedAtCell record={record} formatUpdatedAt={formatUpdatedAt} />,
}

const getWorldsendColumnRenderer = (
  columnId: WorldsendRecordColumnId
): ColumnRenderer<WorldsendRecordWithSongMeta> => {
  const renderer = worldsendColumnRenderers[columnId]
  if (!renderer) throw new Error(`Unknown worldsend column renderer: ${columnId}`)
  return renderer
}

const WorldsendRecordTable = (props: {
  records: WorldsendRecordWithSongMeta[]
  sortKey: WorldsendSortKey | null
  sortDirection: WorldsendRecordSortCondition['direction'] | null
  sortConditions: WorldsendRecordSortCondition[]
  onSortChange: (nextKey: WorldsendSortKey) => void
  visibleColumnIds: WorldsendRecordColumnId[]
}) => {
  const visibleColumns = createMemo(() => getVisibleWorldsendColumns(props.visibleColumnIds))
  const worldsendGridColumns = createMemo(() => createGridTemplateColumns(visibleColumns()))

  let tableContainerRef: HTMLDivElement | undefined
  let tableBodyRef: HTMLDivElement | undefined

  const sortedRecords = createMemo(() =>
    sortWorldsendRecordsByConditions(props.records, props.sortConditions)
  )

  const virtualizedTable = createRecordTableVirtualizer({
    rowHeight: RECORD_ROW_HEIGHT,
    rowCount: () => sortedRecords().length,
    containerRef: () => tableContainerRef,
    bodyRef: () => tableBodyRef,
  })

  return (
    <div class={worldsendTableWrapperClass}>
      <Show
        when={props.records.length > 0}
        fallback={
          <p class="py-6 text-center text-text-subtle">WORLD'S END のレコードはありません。</p>
        }
      >
        <div
          ref={tableContainerRef}
          class="select-none overflow-x-auto overflow-y-hidden rounded-md border border-border"
        >
          <div class="w-fit min-w-full">
            <div class="border-b border-border bg-surface-muted">
              <div
                class="grid px-2 text-xs font-semibold"
                style={{ 'grid-template-columns': worldsendGridColumns() }}
              >
                <For each={visibleColumns()}>
                  {(column) => (
                    <RecordHeaderButton
                      label={column.label}
                      active={props.sortKey === column.sortKey}
                      direction={props.sortDirection}
                      align={column.align}
                      class={column.id === 'title' ? 'justify-start' : 'justify-center'}
                      onClick={() => props.onSortChange(column.sortKey)}
                    />
                  )}
                </For>
              </div>
            </div>

            <div
              ref={tableBodyRef}
              class="relative"
              style={{ height: `${virtualizedTable.getTotalSize()}px` }}
            >
              <For each={virtualizedTable.virtualRows()}>
                {(virtualRow) => {
                  const record = createMemo(() => sortedRecords()[virtualRow.index])

                  return (
                    <Show when={record()} keyed>
                      {(currentRecord) => (
                        <div
                          class={`absolute left-0 top-0 grid w-full border-b border-border px-2 text-xs ${RECORD_ROW_HOVER_CLASS}`}
                          style={{
                            'grid-template-columns': worldsendGridColumns(),
                            transform: `translateY(${virtualRow.start - virtualizedTable.scrollMargin()}px)`,
                          }}
                        >
                          <For each={visibleColumns()}>
                            {(column) => {
                              const renderer = getWorldsendColumnRenderer(column.id)
                              return renderer(currentRecord)
                            }}
                          </For>
                        </div>
                      )}
                    </Show>
                  )
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

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
      normalizeWorldsendRecordSortConditions([
        nextPrimarySort,
        ...currentSortConditions.slice(1, 4),
      ])
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
                sortKey={primarySort()?.key ?? null}
                sortDirection={primarySort()?.direction ?? null}
                sortConditions={sortConditions()}
                onSortChange={handleSortChange}
                visibleColumnIds={visibleColumnIds()}
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
