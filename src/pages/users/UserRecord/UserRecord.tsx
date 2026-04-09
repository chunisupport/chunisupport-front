import type { Component } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  Show,
  Suspense,
} from 'solid-js'
import { fetchAllSongs, fetchMasterData, fetchVersionSummaries } from '../../../api/songs'
import { Loading, ScrollToTop } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { UserProfileWithRecordsDTO } from '../../../types/api'
import { attachSongMetaToRecords, type PlayerRecordWithSongMeta } from '../../../utils/recordMerger'
import FilterDialog from './components/FilterDialog'
import FilterStats from './components/FilterStats'
import FilterToolbar from './components/FilterToolbar'
import RecordTable from './components/RecordTable'
import TrackingSummary from './components/TrackingSummary'
import { DEFAULT_FILTER, getMasterDataDefaults } from './types/filterDefaults'
import type { ComboLamp, FilterState, RecordSortKey, SortDirection } from './types/types'
import { getDefaultFilter, isRecordMatched } from './utils/filtering'
import { getRecordStats } from './utils/recordStats'
import {
  clearTrackingCondition,
  loadSavedFilters,
  loadTrackingCondition,
  type SavedFilter,
  type TrackingCondition,
} from './utils/storage'

const DIFFICULTY_ORDER: Record<string, number> = {
  BASIC: 0,
  ADVANCED: 1,
  EXPERT: 2,
  MASTER: 3,
  ULTIMA: 4,
}

const LAMP_ORDER: Record<string, number> = {
  'ALL JUSTICE': 0,
  'FULL COMBO': 1,
  NONE: 2,
  UNPLAYED: 3,
}

type Props = {
  profile: UserProfileWithRecordsDTO
}

const UserRecord: Component<Props> = (props) => {
  const [allSongs] = createResource(fetchAllSongs)
  const [masterData] = createResource(fetchMasterData)
  const [versionSummaries] = createResource(fetchVersionSummaries)

  // 保存済みフィルター一覧
  const [savedFilters, setSavedFilters] = createSignal<SavedFilter[]>(loadSavedFilters())

  // フィルター・追跡の状態
  const [filters, setFilters] = createSignal<FilterState>({
    // createEffect内で初期化されるので、ここでは仮の値をセット
    ...DEFAULT_FILTER,
  })
  const [trackingCondition, setTrackingCondition] = createSignal<TrackingCondition | null>(
    loadTrackingCondition()
  )

  // フィルターダイアログの開閉状態
  const [filterOpen, setFilterOpen] = createSignal(false)
  const [filterStatsOpen, setFilterStatsOpen] = createSignal(false)
  const [sortKey, setSortKey] = createSignal<RecordSortKey | null>('rating')
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>('desc')

  // フィルターを初期化
  // マスタデータ取得後にgenres/versionsを全選択
  createEffect(() => {
    const md = masterData()
    const versions = versionSummaries()
    if (!md || !versions) return
    setFilters((prev) => ({
      ...prev,
      ...getMasterDataDefaults(md, versions.versions),
    }))
  })

  /** 未プレイを含む全曲のレコード */
  const recordsWithSongMeta = createMemo(() => {
    const songs = allSongs()
    const versions = versionSummaries()
    if (!songs || !versions) return []
    return attachSongMetaToRecords(songs.songs, props.profile.records.all, versions.versions)
  })

  /** フィルター適用後のレコード */
  const filteredRecords = createMemo(() => {
    const records = recordsWithSongMeta()
    const currentFilters = filters()
    return records.filter((record) => isRecordMatched(record, currentFilters))
  })

  const sortedRecords = createMemo(() => {
    const records = filteredRecords()
    const currentSortKey = sortKey()
    const currentSortDirection = sortDirection()

    if (!currentSortKey || !currentSortDirection) {
      return records
    }

    const direction = currentSortDirection === 'asc' ? 1 : -1

    return records
      .map((record, index) => ({ record, index }))
      .sort((a, b) => {
        const left = a.record
        const right = b.record
        let comparison = 0

        switch (currentSortKey) {
          case 'title':
            comparison = left.title.localeCompare(right.title, 'ja')
            break
          case 'difficulty':
            comparison =
              (DIFFICULTY_ORDER[left.difficulty] ?? Number.MAX_SAFE_INTEGER) -
              (DIFFICULTY_ORDER[right.difficulty] ?? Number.MAX_SAFE_INTEGER)
            break
          case 'const':
            comparison = left.const - right.const
            break
          case 'rating': {
            const leftUnplayed = !left.is_played
            const rightUnplayed = !right.is_played

            if (leftUnplayed && rightUnplayed) {
              comparison = 0
            } else if (leftUnplayed) {
              return 1
            } else if (rightUnplayed) {
              return -1
            } else {
              comparison = left.rating - right.rating
            }
            break
          }
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
              : left.combo_lamp === null
                ? 'NONE'
                : left.combo_lamp
            const rightLampKey = !right.is_played
              ? 'UNPLAYED'
              : right.combo_lamp === null
                ? 'NONE'
                : right.combo_lamp

            comparison =
              (LAMP_ORDER[leftLampKey] ?? Number.MAX_SAFE_INTEGER) -
              (LAMP_ORDER[rightLampKey] ?? Number.MAX_SAFE_INTEGER)
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

  const handleSortChange = (nextKey: RecordSortKey) => {
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

  /** 追跡中のフィルター情報 */
  const trackingTargetFilter = createMemo(() => {
    const condition = trackingCondition()
    if (!condition) return null
    const saved = savedFilters()
    return saved.find((item) => item.id === condition.filterId) ?? null
  })

  /** 追跡中のフィルターに該当するレコード(未達成・達成済みすべて) */
  const trackingTargetRecords = createMemo(() => {
    const records = recordsWithSongMeta()
    const target = trackingTargetFilter()
    if (!target) return []
    return records.filter((record) => isRecordMatched(record, target.filter))
  })

  /** 追跡の条件達成判定 */
  const isRecordAchieved = (record: PlayerRecordWithSongMeta, condition: TrackingCondition) => {
    const hasScore = typeof condition.scoreMin !== 'undefined'
    const hasLamp = (condition.lamps ?? []).length > 0
    if (!hasScore && !hasLamp) return false
    if (!record.is_played) return false

    if (hasScore) {
      const minScore = condition.scoreMin ?? 0
      if (record.score < minScore) return false
    }

    if (hasLamp) {
      const lamp = record.combo_lamp ?? null
      if (!condition.lamps?.includes(lamp as ComboLamp)) return false
    }

    return true
  }

  /** 追跡中の統計情報 */
  const trackingStats = createMemo(() => {
    const condition = trackingCondition()
    const baseRecords = trackingTargetRecords()
    if (!condition || baseRecords.length === 0) {
      return {
        achieved: 0,
        total: baseRecords.length,
        remaining: baseRecords.length,
        percent: 0,
      }
    }
    const achieved = baseRecords.filter((record) => isRecordAchieved(record, condition)).length
    const total = baseRecords.length
    const percent = total ? (achieved / total) * 100 : 0
    return {
      achieved,
      total,
      remaining: total - achieved,
      percent,
    }
  })

  /** 追跡中の目標を読めるようにしたもの */
  const trackingGoalLabel = createMemo(() => {
    const condition = trackingCondition()
    if (!condition) return ''
    const parts: string[] = []
    if (typeof condition.scoreMin !== 'undefined') {
      parts.push(`${condition.scoreMin.toLocaleString()}点以上`)
    }
    if (condition.lamps) {
      const lamps = condition.lamps
      if (lamps.includes('ALL JUSTICE') && lamps.includes('FULL COMBO')) {
        parts.push('FULL COMBO')
      } else if (lamps.includes('ALL JUSTICE')) {
        parts.push('ALL JUSTICE')
      }
    }
    return parts.join(' & ')
  })

  // 件数表示
  const totalCount = () => recordsWithSongMeta().length
  const filteredCount = () => filteredRecords().length

  /** レコード統計の集計結果 */
  const stats = createMemo(() => getRecordStats(filteredRecords()))

  useDocumentTitle(() => `${props.profile.username}さんのレコード`)

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={allSongs() && masterData() && versionSummaries()} fallback={<Loading />}>
          <div class="mx-2 text-sm">
            {/* 追跡表示 */}
            {trackingCondition() && trackingTargetFilter() && (
              <TrackingSummary
                condition={trackingCondition() as TrackingCondition}
                targetName={trackingTargetFilter()?.name ?? ''}
                goalLabel={trackingGoalLabel()}
                stats={trackingStats()}
                onClear={() => {
                  clearTrackingCondition()
                  setTrackingCondition(null)
                }}
              />
            )}

            {/* フィルター関連UI */}
            <FilterToolbar
              title={filters().title}
              onTitleChange={(value) => setFilters({ ...filters(), title: value })}
              onOpenFilter={() => setFilterOpen(true)}
            />

            {/* フィルター統計 */}
            {filteredCount() > 0 && (
              <FilterStats
                stats={stats()}
                open={filterStatsOpen()}
                onOpenChange={setFilterStatsOpen}
              />
            )}

            <p class="mb-2 text-sm text-gray-600">
              全 {totalCount()} 件中 {filteredCount()} 件を表示
            </p>

            {/* レコード一覧 */}
            <RecordTable
              records={sortedRecords()}
              statsOpen={filterStatsOpen()}
              sortKey={sortKey()}
              sortDirection={sortDirection()}
              onSortChange={handleSortChange}
            />

            {/* フィルターダイアログ */}
            <FilterDialog
              open={filterOpen()}
              onOpenChange={setFilterOpen}
              filters={filters()}
              onChange={setFilters}
              masterData={masterData()}
              versions={versionSummaries()?.versions}
              defaultFilter={getDefaultFilter(masterData(), versionSummaries()?.versions)}
              onTrackingChange={() => setTrackingCondition(loadTrackingCondition())}
              setSavedFilters={setSavedFilters}
            />
          </div>
        </Show>
        <ScrollToTop />
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserRecord
