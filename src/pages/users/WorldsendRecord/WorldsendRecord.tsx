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
import { Loading } from '../../../components'
import type { WorldsendRecordDTO, WorldsendSongDTO } from '../../../types/api'
import {
  RECORD_ALPHANUMERIC_COLUMN_CLASS,
  RECORD_ROW_HOVER_CLASS,
  RecordHeaderButton,
  RecordLampCell,
  RecordScoreCell,
  RecordTitleCell,
  RecordUpdatedAtCell,
} from '../components/SharedRecordTableColumns'
import {
  nextSortState,
  parseSortQuery,
  type SortDirection,
  sanitizeSortQuery,
} from '../recordTable/sortingQuery'
import { buildWorldsendSongDetailPath } from '../UserPage/worldsendNavigation'
import { worldsendTableWrapperClass } from '../UserPage/worldsendTableStyles'
import FilterToolbar from '../UserRecord/components/FilterToolbar'
import { calcJusticeCountForAj } from '../UserRecord/utils/justiceCount'
import {
  compareUpdatedAtWithMissingLast,
  formatUpdatedAt,
  updatedAtTimestamp,
} from '../UserRecord/utils/updatedAt'
import {
  createGridTemplateColumns,
  getDefaultVisibleWorldsendColumnIds,
  getVisibleWorldsendColumns,
  sanitizeVisibleWorldsendColumnIds,
  type WorldsendRecordColumnId,
  type WorldsendRecordSortKey,
} from './utils/columns'
import WorldsendColumnSettingsDialog from './WorldsendColumnSettingsDialog'

type Props = {
  records: WorldsendRecordDTO[]
}

type WorldsendSortKey = WorldsendRecordSortKey

const WE_SORT_COL_MAP: Record<string, WorldsendSortKey> = {
  title: 'title',
  attr: 'attribute',
  level: 'level',
  score: 'score',
  updated_at: 'updatedAt',
  lamp: 'lamp',
  justice_count: 'justiceCount',
}

type WorldsendRecordWithSongMeta = WorldsendRecordDTO & {
  genre: string | null
  release: string | null
}

const worldsendLampOrder: Record<string, number> = {
  'ALL JUSTICE': 0,
  'FULL COMBO': 1,
  NONE: 2,
  UNPLAYED: 3,
}

const isUpdatedAtMissing = (isPlayed: boolean, timestamp: number): boolean =>
  !isPlayed || timestamp === Number.NEGATIVE_INFINITY

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
      release: song?.release ?? null,
    }
  })
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

  const sortedRecords = createMemo(() => {
    const currentSortKey = props.sortKey
    const currentSortDirection = props.sortDirection

    if (!currentSortKey || !currentSortDirection) {
      return props.records
    }

    const direction = currentSortDirection === 'asc' ? 1 : -1

    return props.records
      .map((record, index) => ({
        record,
        index,
        updatedAtTs: updatedAtTimestamp(record.updated_at),
      }))
      .sort((a, b) => {
        const left = a.record
        const right = b.record
        let comparison = 0

        switch (currentSortKey) {
          case 'title':
            comparison = left.title.localeCompare(right.title, 'ja')
            break
          case 'attribute':
            comparison = (left.attribute ?? '').localeCompare(right.attribute ?? '', 'ja')
            break
          case 'level':
            comparison =
              (left.level_star ?? Number.NEGATIVE_INFINITY) -
              (right.level_star ?? Number.NEGATIVE_INFINITY)
            break
          case 'score': {
            const leftUnplayed = !left.is_played
            const rightUnplayed = !right.is_played

            if (leftUnplayed && rightUnplayed) {
              comparison = 0
            } else if (leftUnplayed) {
              return 1
            } else if (rightUnplayed) {
              return -1
            } else {
              comparison = left.score - right.score
            }
            break
          }
          case 'updatedAt': {
            const leftMissing = isUpdatedAtMissing(left.is_played, a.updatedAtTs)
            const rightMissing = isUpdatedAtMissing(right.is_played, b.updatedAtTs)

            comparison = compareUpdatedAtWithMissingLast(
              { isPlayed: left.is_played, updatedAtTimestamp: a.updatedAtTs },
              { isPlayed: right.is_played, updatedAtTimestamp: b.updatedAtTs }
            )

            if (leftMissing || rightMissing) {
              return comparison
            }
            break
          }

          case 'justiceCount': {
            const leftJusticeCount = calcJusticeCountForAj({
              comboLamp: left.combo_lamp,
              score: left.score,
              notes: left.notes,
            })
            const rightJusticeCount = calcJusticeCountForAj({
              comboLamp: right.combo_lamp,
              score: right.score,
              notes: right.notes,
            })

            const leftMissing = leftJusticeCount === '' || leftJusticeCount === '-'
            const rightMissing = rightJusticeCount === '' || rightJusticeCount === '-'

            if (leftMissing && rightMissing) {
              comparison = 0
              break
            }
            if (leftMissing) return 1
            if (rightMissing) return -1

            comparison = leftJusticeCount - rightJusticeCount
            break
          }
          case 'lamp': {
            const leftMissing = !left.is_played
            const rightMissing = !right.is_played

            if (leftMissing && rightMissing) {
              comparison = 0
              break
            }

            if (leftMissing) {
              return 1
            }

            if (rightMissing) {
              return -1
            }

            const leftLampKey = left.combo_lamp ?? 'NONE'
            const rightLampKey = right.combo_lamp ?? 'NONE'

            comparison =
              (worldsendLampOrder[leftLampKey] ?? Number.MAX_SAFE_INTEGER) -
              (worldsendLampOrder[rightLampKey] ?? Number.MAX_SAFE_INTEGER)
            break
          }
        }

        if (comparison !== 0) {
          return comparison * direction
        }

        return a.index - b.index
      })
      .map(({ record }) => record)
  })

  return (
    <div class={worldsendTableWrapperClass}>
      <Show
        when={props.records.length > 0}
        fallback={
          <p class="py-6 text-center text-gray-400">WORLD'S END のレコードはありません。</p>
        }
      >
        <div class="select-none overflow-x-auto overflow-y-hidden rounded-md border border-gray-200">
          <div class="w-fit min-w-full">
            <div class="border-b border-gray-200 bg-gray-50">
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
                      class={
                        column.id === 'title'
                          ? 'justify-start'
                          : column.id === 'updatedAt'
                            ? 'justify-center'
                            : 'justify-center'
                      }
                      onClick={() => props.onSortChange(column.sortKey)}
                    />
                  )}
                </For>
              </div>
            </div>

            <div>
              <For each={sortedRecords()}>
                {(record) => (
                  <div
                    class={`grid border-b border-gray-200 px-2 text-xs ${RECORD_ROW_HOVER_CLASS}`}
                    style={{ 'grid-template-columns': worldsendGridColumns() }}
                  >
                    <For each={visibleColumns()}>
                      {(column) => {
                        if (column.id === 'title') {
                          return (
                            <RecordTitleCell
                              href={buildWorldsendSongDetailPath(record.id)}
                              title={record.title}
                            />
                          )
                        }
                        if (column.id === 'attribute') {
                          return (
                            <div class="flex min-h-[34px] items-center justify-center text-center whitespace-nowrap text-sm">
                              <span class="inline-block w-full text-center leading-none">
                                {record.attribute ?? '-'}
                              </span>
                            </div>
                          )
                        }
                        if (column.id === 'level') {
                          return (
                            <div
                              class={`flex min-h-[34px] items-center justify-center whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
                            >
                              <span class="inline-block leading-none">
                                {worldsendLevelLabel(record.level_star)}
                              </span>
                            </div>
                          )
                        }
                        if (column.id === 'score') return <RecordScoreCell record={record} />
                        if (column.id === 'lamp') return <RecordLampCell record={record} />
                        if (column.id === 'justiceCount') {
                          return (
                            <div
                              class={`flex min-h-[34px] items-center justify-center text-center whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
                            >
                              <span class="inline-block w-full text-center leading-none">
                                {(() => {
                                  const justiceCount = calcJusticeCountForAj({
                                    comboLamp: record.combo_lamp,
                                    score: record.score,
                                    notes: record.notes,
                                  })
                                  return justiceCount === '' ? '' : justiceCount
                                })()}
                              </span>
                            </div>
                          )
                        }
                        return (
                          <RecordUpdatedAtCell record={record} formatUpdatedAt={formatUpdatedAt} />
                        )
                      }}
                    </For>
                  </div>
                )}
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
  const [visibleColumnIds, setVisibleColumnIds] = createSignal<WorldsendRecordColumnId[]>(
    sanitizeVisibleWorldsendColumnIds(getDefaultVisibleWorldsendColumnIds())
  )

  // クエリパラメータ ?sortcol=<col>&sortorder=asc|desc から初期ソートを取得
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSort = parseSortQuery(searchParams, WE_SORT_COL_MAP, {
    sortKey: 'score',
    sortDirection: 'desc',
  })
  const [sortKey, setSortKey] = createSignal<WorldsendSortKey | null>(initialSort.sortKey)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(
    initialSort.sortDirection
  )

  // クエリパラメータが存在した場合にURLをクリーン化（ソート自体は維持）
  onMount(() => sanitizeSortQuery(searchParams, setSearchParams))

  const recordsWithSongMeta = createMemo(() => {
    const songs = worldsendSongs()
    if (!songs) return []

    return attachWorldsendSongMetaToRecords(songs.songs, props.records)
  })

  const filteredRecords = createMemo(() => {
    const keyword = title().trim().toLowerCase()
    const records = recordsWithSongMeta()

    if (!keyword) {
      return records
    }

    return records.filter((record) => record.title.toLowerCase().includes(keyword))
  })

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={worldsendSongs()} fallback={<Loading />}>
          <div class="mx-2 text-sm">
            <FilterToolbar
              title={title()}
              onTitleChange={setTitle}
              onOpenFilter={() => undefined}
              onOpenColumnSettings={() => setColumnSettingsOpen(true)}
              filterButtonDisabled
            />

            <p class="mb-2 text-sm text-gray-600">
              全 {recordsWithSongMeta().length} 件中 {filteredRecords().length} 件を表示
            </p>

            <WorldsendRecordTable
              records={filteredRecords()}
              sortKey={sortKey()}
              sortDirection={sortDirection()}
              onSortChange={(nextKey) => {
                const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
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
      </ErrorBoundary>
    </Suspense>
  )
}

export default WorldsendRecord
