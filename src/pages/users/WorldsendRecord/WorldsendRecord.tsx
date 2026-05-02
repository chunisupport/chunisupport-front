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
import { buildWorldsendSongDetailPath } from '../UserPage/worldsendNavigation'
import { worldsendTableWrapperClass } from '../UserPage/worldsendTableStyles'
import FilterToolbar from '../UserRecord/components/FilterToolbar'
import {
  compareUpdatedAtWithMissingLast,
  formatUpdatedAt,
  updatedAtTimestamp,
} from '../UserRecord/utils/updatedAt'
import { worldsendGridColumns } from './utils/columns'

type Props = {
  records: WorldsendRecordDTO[]
}

type WorldsendSortKey = 'title' | 'attribute' | 'level' | 'score' | 'updatedAt' | 'lamp'
type WorldsendSortDirection = 'asc' | 'desc'

const WE_SORT_COL_MAP: Record<string, WorldsendSortKey> = {
  title: 'title',
  attr: 'attribute',
  level: 'level',
  score: 'score',
  updated_at: 'updatedAt',
  lamp: 'lamp',
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
        <div class="select-none overflow-x-auto overflow-y-hidden rounded-md border border-gray-200">
          <div class="min-w-[36.5rem]">
            <div class="border-b border-gray-200 bg-white">
              <div
                class="grid text-xs font-semibold"
                style={{ 'grid-template-columns': worldsendGridColumns }}
              >
                <RecordHeaderButton
                  label="曲名"
                  active={sortKey() === 'title'}
                  direction={sortDirection()}
                  align="start"
                  class="justify-start pl-2"
                  onClick={() => handleSortChange('title')}
                />
                <RecordHeaderButton
                  label="属性"
                  active={sortKey() === 'attribute'}
                  direction={sortDirection()}
                  align="center"
                  class="justify-center"
                  onClick={() => handleSortChange('attribute')}
                />
                <RecordHeaderButton
                  label="レベル"
                  active={sortKey() === 'level'}
                  direction={sortDirection()}
                  align="center"
                  class="justify-center"
                  onClick={() => handleSortChange('level')}
                />
                <RecordHeaderButton
                  label="スコア"
                  active={sortKey() === 'score'}
                  direction={sortDirection()}
                  align="center"
                  class="justify-center"
                  onClick={() => handleSortChange('score')}
                />
                <RecordHeaderButton
                  label="AJ"
                  active={sortKey() === 'lamp'}
                  direction={sortDirection()}
                  align="center"
                  class="justify-center"
                  onClick={() => handleSortChange('lamp')}
                />
                <RecordHeaderButton
                  label="更新日"
                  active={sortKey() === 'updatedAt'}
                  direction={sortDirection()}
                  align="center"
                  class="justify-center pr-2"
                  onClick={() => handleSortChange('updatedAt')}
                />
              </div>
            </div>

            <div>
              <For each={sortedRecords()}>
                {(record) => (
                  <div
                    class={`grid border-b border-gray-200 text-xs ${RECORD_ROW_HOVER_CLASS}`}
                    style={{ 'grid-template-columns': worldsendGridColumns }}
                  >
                    <RecordTitleCell
                      href={buildWorldsendSongDetailPath(record.id)}
                      title={record.title}
                    />
                    <div class="flex min-h-[34px] items-center justify-center text-center whitespace-nowrap text-sm">
                      <span class="inline-block w-full text-center leading-none">
                        {record.attribute ?? '-'}
                      </span>
                    </div>
                    <div
                      class={`flex min-h-[34px] items-center justify-center whitespace-nowrap text-sm ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
                    >
                      <span class="inline-block leading-none">
                        {worldsendLevelLabel(record.level_star)}
                      </span>
                    </div>
                    <RecordScoreCell record={record} />
                    <RecordLampCell record={record} />
                    <RecordUpdatedAtCell record={record} formatUpdatedAt={formatUpdatedAt} />
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
  const sortColParam = typeof searchParams.sortcol === 'string' ? searchParams.sortcol : ''
  const sortOrderParam = typeof searchParams.sortorder === 'string' ? searchParams.sortorder : null
  const parsedSortKey = WE_SORT_COL_MAP[sortColParam] ?? null
  const parsedSortOrder =
    sortOrderParam === 'asc' || sortOrderParam === 'desc'
      ? (sortOrderParam as WorldsendSortDirection)
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
