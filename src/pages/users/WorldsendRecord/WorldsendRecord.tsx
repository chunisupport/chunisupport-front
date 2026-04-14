import { A, useSearchParams } from '@solidjs/router'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-solid'
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
import { formatRecordAddedDate } from '../UserPage/recordAddedDate'
import { worldsendLampClass, worldsendLampLabel } from '../UserPage/worldsendLampDisplay'
import { buildWorldsendSongDetailPath } from '../UserPage/worldsendNavigation'
import { worldsendGridColumns } from '../UserPage/worldsendRecordTableLayout'
import { worldsendTableWrapperClass } from '../UserPage/worldsendTableStyles'
import FilterToolbar from '../UserRecord/components/FilterToolbar'

type Props = {
  records: WorldsendRecordDTO[]
}

type WorldsendSortKey = 'title' | 'attribute' | 'level' | 'score' | 'lamp' | 'addedDate'
type WorldsendSortDirection = 'asc' | 'desc'

const WE_SORT_COL_MAP: Record<string, WorldsendSortKey> = {
  title: 'title',
  attr: 'attribute',
  level: 'level',
  score: 'score',
  lamp: 'lamp',
  added: 'addedDate',
}

type WorldsendRecordWithSongMeta = WorldsendRecordDTO & {
  genre: string | null
  release: string | null
}

const worldsendLampOrder: Record<string, number> = {
  'ALL JUSTICE': 0,
  'FULL COMBO': 1,
  CATASTROPHY: 2,
  ABSOLUTE: 3,
  BRAVE: 4,
  HARD: 5,
  CLEAR: 6,
  FAILED: 7,
  NONE: 8,
  UNPLAYED: 9,
}

const worldsendHeaderButtonClass =
  'flex min-h-[34px] w-full items-center justify-center gap-1 text-center whitespace-nowrap transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset'
const worldsendSortIconClass = 'h-3 w-3 shrink-0'
const worldsendSortIconWrapperClass = 'inline-flex h-3 w-3 shrink-0 items-center justify-center'

const worldsendSortIndicator = (active: boolean, direction: WorldsendSortDirection | null) => {
  if (!active || !direction) {
    return (
      <span class={worldsendSortIconWrapperClass} aria-hidden="true">
        <ArrowUpDown class={`${worldsendSortIconClass} text-gray-300`} />
      </span>
    )
  }

  return direction === 'asc' ? (
    <span class={worldsendSortIconWrapperClass} aria-hidden="true">
      <ArrowUp class={`${worldsendSortIconClass} text-sky-600`} />
    </span>
  ) : (
    <span class={worldsendSortIconWrapperClass} aria-hidden="true">
      <ArrowDown class={`${worldsendSortIconClass} text-sky-600`} />
    </span>
  )
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
      release: song?.release ?? null,
    }
  })
}

const WorldsendRecordTable = (props: {
  records: WorldsendRecordWithSongMeta[]
  initialSortKey?: WorldsendSortKey | null
  initialSortDirection?: WorldsendSortDirection | null
}) => {
  const [sortKey, setSortKey] = createSignal<WorldsendSortKey | null>(
    props.initialSortKey !== undefined ? props.initialSortKey : 'score'
  )
  const [sortDirection, setSortDirection] = createSignal<WorldsendSortDirection | null>(
    props.initialSortDirection !== undefined ? props.initialSortDirection : 'desc'
  )

  const sortedRecords = createMemo(() => {
    const currentSortKey = sortKey()
    const currentSortDirection = sortDirection()

    if (!currentSortKey || !currentSortDirection) {
      return props.records
    }

    const direction = currentSortDirection === 'asc' ? 1 : -1

    return props.records
      .map((record, index) => ({ record, index }))
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
          case 'lamp': {
            const leftLampKey = !left.is_played
              ? 'UNPLAYED'
              : left.combo_lamp === 'ALL JUSTICE'
                ? 'ALL JUSTICE'
                : left.combo_lamp === 'FULL COMBO'
                  ? 'FULL COMBO'
                  : (left.clear_lamp ?? 'NONE')
            const rightLampKey = !right.is_played
              ? 'UNPLAYED'
              : right.combo_lamp === 'ALL JUSTICE'
                ? 'ALL JUSTICE'
                : right.combo_lamp === 'FULL COMBO'
                  ? 'FULL COMBO'
                  : (right.clear_lamp ?? 'NONE')

            comparison =
              (worldsendLampOrder[leftLampKey] ?? Number.MAX_SAFE_INTEGER) -
              (worldsendLampOrder[rightLampKey] ?? Number.MAX_SAFE_INTEGER)
            break
          }
          case 'addedDate': {
            const leftNoDate = !left.release
            const rightNoDate = !right.release

            if (leftNoDate && rightNoDate) {
              comparison = 0
            } else if (leftNoDate) {
              return 1
            } else if (rightNoDate) {
              return -1
            } else {
              comparison = left.release.localeCompare(right.release, 'ja')
            }
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

  const handleSortChange = (nextKey: WorldsendSortKey) => {
    const currentSortKey = sortKey()
    const currentSortDirection = sortDirection()

    if (currentSortKey !== nextKey) {
      setSortKey(nextKey)
      setSortDirection('asc')
      return
    }

    if (currentSortDirection === 'asc') {
      setSortDirection('desc')
      return
    }

    if (currentSortDirection === 'desc') {
      setSortKey(null)
      setSortDirection(null)
      return
    }

    setSortDirection('asc')
  }

  return (
    <div class={worldsendTableWrapperClass}>
      <Show
        when={props.records.length > 0}
        fallback={
          <p class="py-6 text-center text-gray-400">WORLD'S END のレコードはありません。</p>
        }
      >
        <div class="overflow-x-auto overflow-y-hidden rounded-md border border-gray-200">
          <div class="min-w-[36.5rem]">
            <div class="border-b border-gray-200 bg-white">
              <div
                class="grid text-xs font-semibold"
                style={{ 'grid-template-columns': worldsendGridColumns }}
              >
                <button
                  type="button"
                  class={`${worldsendHeaderButtonClass} justify-start px-2`}
                  onClick={() => handleSortChange('title')}
                >
                  <span>曲名</span>
                  {worldsendSortIndicator(sortKey() === 'title', sortDirection())}
                </button>
                <button
                  type="button"
                  class={worldsendHeaderButtonClass}
                  onClick={() => handleSortChange('attribute')}
                >
                  <span>属性</span>
                  {worldsendSortIndicator(sortKey() === 'attribute', sortDirection())}
                </button>
                <button
                  type="button"
                  class={worldsendHeaderButtonClass}
                  onClick={() => handleSortChange('level')}
                >
                  <span>レベル</span>
                  {worldsendSortIndicator(sortKey() === 'level', sortDirection())}
                </button>
                <button
                  type="button"
                  class={worldsendHeaderButtonClass}
                  onClick={() => handleSortChange('score')}
                >
                  <span>スコア</span>
                  {worldsendSortIndicator(sortKey() === 'score', sortDirection())}
                </button>
                <button
                  type="button"
                  class={worldsendHeaderButtonClass}
                  onClick={() => handleSortChange('lamp')}
                >
                  <span>ランプ</span>
                  {worldsendSortIndicator(sortKey() === 'lamp', sortDirection())}
                </button>
                <button
                  type="button"
                  class={worldsendHeaderButtonClass}
                  onClick={() => handleSortChange('addedDate')}
                >
                  <span>追加日</span>
                  {worldsendSortIndicator(sortKey() === 'addedDate', sortDirection())}
                </button>
              </div>
            </div>

            <div>
              <For each={sortedRecords()}>
                {(record) => (
                  <div
                    class="grid border-b border-gray-200 text-xs hover:bg-gray-100"
                    style={{ 'grid-template-columns': worldsendGridColumns }}
                  >
                    <div class="flex min-h-[34px] min-w-0 items-center px-2" title={record.title}>
                      <A
                        href={buildWorldsendSongDetailPath(record.id)}
                        class="block w-full truncate text-inherit hover:underline"
                      >
                        {record.title}
                      </A>
                    </div>
                    <div class="flex min-h-[34px] items-center justify-center text-center whitespace-nowrap">
                      <span class="inline-block w-full text-center leading-none">
                        {record.attribute ?? '-'}
                      </span>
                    </div>
                    <div class="flex min-h-[34px] items-center justify-center whitespace-nowrap">
                      <span class="inline-block leading-none">
                        {worldsendLevelLabel(record.level_star)}
                      </span>
                    </div>
                    <div class="flex min-h-[34px] items-center justify-center whitespace-nowrap">
                      <div class="flex w-full justify-center">
                        {!record.is_played ? (
                          <span class="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-400">
                            NoPlay
                          </span>
                        ) : (
                          record.score.toLocaleString('ja-JP')
                        )}
                      </div>
                    </div>
                    <div class="flex min-h-[34px] items-center justify-center whitespace-nowrap">
                      <div class="flex w-full justify-center">
                        {worldsendLampLabel(record) === '-' ? (
                          <span class="px-2 py-1 text-xs">-</span>
                        ) : (
                          <span
                            class={`rounded-lg px-2 py-1 text-xs font-bold ${worldsendLampClass(record)}`}
                          >
                            {worldsendLampLabel(record)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div class="flex min-h-[34px] items-center justify-center text-center whitespace-nowrap">
                      <span class="inline-block w-full text-center leading-none">
                        {formatRecordAddedDate(record.release)}
                      </span>
                    </div>
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

  // クエリパラメータ ?sortcol=<col>&sortorder=asc|desc から初期ソートを取得
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedSortKey = WE_SORT_COL_MAP[searchParams.sortcol ?? ''] ?? null
  const parsedSortOrder =
    searchParams.sortorder === 'asc' || searchParams.sortorder === 'desc'
      ? (searchParams.sortorder as WorldsendSortDirection)
      : null
  const initialSortKey: WorldsendSortKey | null =
    parsedSortKey !== null && parsedSortOrder !== null ? parsedSortKey : 'score'
  const initialSortDirection: WorldsendSortDirection | null =
    parsedSortKey !== null && parsedSortOrder !== null ? parsedSortOrder : 'desc'

  // クエリパラメータが存在した場合にURLをクリーン化（ソート自体は維持）
  onMount(() => {
    if (searchParams.sortcol !== undefined || searchParams.sortorder !== undefined) {
      setSearchParams({ sortcol: undefined, sortorder: undefined }, { replace: true })
    }
  })

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
              filterButtonDisabled
            />

            <p class="mb-2 text-sm text-gray-600">
              全 {recordsWithSongMeta().length} 件中 {filteredRecords().length} 件を表示
            </p>

            <WorldsendRecordTable
              records={filteredRecords()}
              initialSortKey={initialSortKey}
              initialSortDirection={initialSortDirection}
            />
          </div>
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default WorldsendRecord
