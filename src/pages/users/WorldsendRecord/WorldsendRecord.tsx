import { useSearchParams } from '@solidjs/router'
import {
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  onMount,
  Show,
  Suspense,
} from 'solid-js'

import { fetchWorldsendSongs } from '../../../api/songs'
import { LoadError, Loading } from '../../../components'
import type { WorldsendRecordDTO, WorldsendSongDTO } from '../../../types/api'
import {
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from '../../../utils/searchUtils'
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
import { type SortDirection, sanitizeSortQuery } from '../recordTable/sortingQuery'
import { buildWorldsendSongDetailPath } from '../UserPage/worldsendNavigation'
import { worldsendTableWrapperClass } from '../UserPage/worldsendTableStyles'
import FilterToolbar from '../UserRecord/components/FilterToolbar'
import { formatJusticeCountForAj } from '../UserRecord/utils/justiceCountDisplay'
import { formatUpdatedAt } from '../UserRecord/utils/updatedAt'
import { getRecordStats } from '../utils/recordStats'
import {
  createGridTemplateColumns,
  getDefaultVisibleWorldsendColumnIds,
  getVisibleWorldsendColumns,
  sanitizeVisibleWorldsendColumnIds,
  type WorldsendRecordColumnId,
  type WorldsendRecordSortKey,
} from './utils/columns'
import {
  nextWorldsendSortState,
  parseWorldsendSortParams,
  sortWorldsendRecords,
} from './utils/sorting'
import WorldsendColumnSettingsDialog from './WorldsendColumnSettingsDialog'

type Props = {
  records: WorldsendRecordDTO[]
}

type WorldsendSortKey = WorldsendRecordSortKey

type WorldsendRecordWithSongMeta = WorldsendRecordDTO & {
  genre: string | null
  reading: string | null
  release: string | null
}

const worldsendLevelLabel = (levelStar: number | null | undefined) => {
  if (typeof levelStar !== 'number' || levelStar <= 0) {
    return '-'
  }

  return `★${levelStar}`
}

const attachWorldsendSongMetaToRecords = (
  songs: WorldsendSongDTO[],
  records: WorldsendRecordDTO[]
): WorldsendRecordWithSongMeta[] => {
  const songMap = new Map(songs.map((song) => [song.id, song]))

  return records.map((record) => {
    const song = songMap.get(record.id)

    return {
      ...record,
      genre: song?.genre ?? null,
      reading: song?.reading ?? null,
      release: song?.release ?? null,
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
  sortDirection: SortDirection | null
  onSortChange: (nextKey: WorldsendSortKey) => void
  visibleColumnIds: WorldsendRecordColumnId[]
}) => {
  const visibleColumns = createMemo(() => getVisibleWorldsendColumns(props.visibleColumnIds))
  const worldsendGridColumns = createMemo(() => createGridTemplateColumns(visibleColumns()))

  let tableContainerRef: HTMLDivElement | undefined
  let tableBodyRef: HTMLDivElement | undefined

  const sortedRecords = createMemo(() =>
    sortWorldsendRecords(props.records, props.sortKey, props.sortDirection)
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

const WorldsendRecord = (props: Props) => {
  const [worldsendSongs] = createResource(fetchWorldsendSongs)
  const [title, setTitle] = createSignal('')
  const [columnSettingsOpen, setColumnSettingsOpen] = createSignal(false)
  const [filterStatsOpen, setFilterStatsOpen] = createSignal(false)
  const [visibleColumnIds, setVisibleColumnIds] = createSignal<WorldsendRecordColumnId[]>(
    sanitizeVisibleWorldsendColumnIds(getDefaultVisibleWorldsendColumnIds())
  )

  // クエリパラメータ ?sortcol=<col>&sortorder=asc|desc から初期ソートを取得
  const [searchParams, setSearchParams] = useSearchParams()
  const { initialSortKey, initialSortOrder } = parseWorldsendSortParams(searchParams)
  const [sortKey, setSortKey] = createSignal<WorldsendSortKey | null>(initialSortKey)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(initialSortOrder)

  // クエリパラメータが存在した場合にURLをクリーン化（ソート自体は維持）
  onMount(() => sanitizeSortQuery(searchParams, setSearchParams))

  const recordsWithSongMeta = createMemo(() => {
    const songs = worldsendSongs()
    if (!songs) return []

    return attachWorldsendSongMetaToRecords(songs.songs, props.records)
  })

  const searchableRecords = createMemo(() =>
    recordsWithSongMeta().map((record) => ({
      record,
      normalizedTitle: normalizeForSearch(record.title),
      normalizedReading: normalizeForReadingSearch(
        record.reading?.trim() ? record.reading : record.title
      ),
    }))
  )

  const filteredRecords = createMemo(() => {
    const { normalizedQuery: keyword, normalizedReadingQuery: readingKeyword } = normalizeQuery(
      title()
    )

    if (!keyword) {
      return recordsWithSongMeta()
    }

    return searchableRecords()
      .filter(
        ({ normalizedTitle, normalizedReading }) =>
          normalizedTitle.includes(keyword) || normalizedReading.includes(readingKeyword)
      )
      .map(({ record }) => record)
  })
  const stats = createMemo(() => getRecordStats(filteredRecords()))

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
        <Show when={!worldsendSongs.error} fallback={<LoadError error={worldsendSongs.error} />}>
          <Show when={worldsendSongs()} fallback={<Loading />}>
            <div class="mx-2 text-sm">
              <FilterToolbar
                title={title()}
                onTitleChange={setTitle}
                onOpenFilter={() => undefined}
                onOpenColumnSettings={() => setColumnSettingsOpen(true)}
                filterButtonDisabled
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
                sortKey={sortKey()}
                sortDirection={sortDirection()}
                onSortChange={(nextKey) => {
                  const nextSort = nextWorldsendSortState(sortKey(), sortDirection(), nextKey)
                  setSortKey(nextSort.sortKey)
                  setSortDirection(nextSort.sortDirection)
                }}
                visibleColumnIds={visibleColumnIds()}
              />

              <WorldsendColumnSettingsDialog
                open={columnSettingsOpen()}
                onOpenChange={setColumnSettingsOpen}
                visibleColumnIds={visibleColumnIds()}
                onApply={(nextVisibleColumnIds) =>
                  setVisibleColumnIds(sanitizeVisibleWorldsendColumnIds(nextVisibleColumnIds))
                }
              />
            </div>
          </Show>
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default WorldsendRecord
