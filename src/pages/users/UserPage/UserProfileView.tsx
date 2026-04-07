import * as Tabs from '@kobalte/core/tabs'
import { A, useLocation, useNavigate } from '@solidjs/router'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-solid'
import type { Accessor, Component } from 'solid-js'
import { createMemo, createSignal, For, lazy, Show, Suspense } from 'solid-js'
import { Loading, ScrollToTop } from '../../../components'
import type {
  HonorDTO,
  PlayerDTO,
  PlayerRecordDTO,
  UserProfileWithRecordsDTO,
  WorldsendRecordDTO,
} from '../../../types/api'
import { UserNameplate } from './components/UserNameplate'
import { UserRecordCard } from './components/UserRecordCard'
import { buildUserProfilePagePath, type ProfilePageQuery } from './profilePageQuery'
import { worldsendLampClass, worldsendLampLabel } from './worldsendLampDisplay'
import { buildWorldsendSongDetailPath } from './worldsendNavigation'
import { worldsendGridColumns } from './worldsendRecordTableLayout'
import { worldsendTableWrapperClass } from './worldsendTableStyles'

const UserRecord = lazy(() => import('../UserRecord'))

type Props = {
  profile: UserProfileWithRecordsDTO
  recordProfile: Accessor<UserProfileWithRecordsDTO | undefined>
  onShowRecords: () => void
  selectedPage: ProfilePageQuery
  username: string
}

type WorldsendSortKey = 'title' | 'attribute' | 'level' | 'score' | 'lamp'
type WorldsendSortDirection = 'asc' | 'desc'

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
  'flex min-h-[34px] w-full items-center justify-center gap-1 px-2 py-1 text-center whitespace-nowrap transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset'
const worldsendSortIconClass = 'h-3 w-3 shrink-0'
const worldsendSortIconWrapperClass = 'inline-flex h-3 w-3 shrink-0 items-center justify-center'

const RecordList: Component<{ records: PlayerRecordDTO[]; candidates?: PlayerRecordDTO[] }> = (
  props
) => (
  <div class="mx-4 flex flex-col gap-2">
    <For each={props.records}>{(record, i) => <UserRecordCard record={record} index={i()} />}</For>
    <Show when={(props.candidates?.length ?? 0) > 0}>
      <div class="border-t-2 border-gray-300 pt-2">
        <div class="flex flex-col gap-2">
          <For each={props.candidates}>
            {(record, i) => <UserRecordCard record={record} index={props.records.length + i()} />}
          </For>
        </div>
      </div>
    </Show>
  </div>
)

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

  return '★'.repeat(levelStar)
}

const WorldsendRecordTable: Component<{ records: WorldsendRecordDTO[] }> = (props) => {
  const [sortKey, setSortKey] = createSignal<WorldsendSortKey | null>('score')
  const [sortDirection, setSortDirection] = createSignal<WorldsendSortDirection | null>('desc')

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
          <div class="min-w-[33.25rem]">
            <div class="border-b border-gray-200 bg-white">
              <div
                class="grid text-xs font-semibold"
                style={{ 'grid-template-columns': worldsendGridColumns }}
              >
                <button
                  type="button"
                  class={`${worldsendHeaderButtonClass} justify-start`}
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
              </div>
            </div>

            <div>
              <For each={sortedRecords()}>
                {(record) => (
                  <div
                    class="grid border-b border-gray-200 text-xs hover:bg-gray-100"
                    style={{ 'grid-template-columns': worldsendGridColumns }}
                  >
                    <div
                      class="flex min-h-[34px] min-w-0 items-center px-2 py-1"
                      title={record.title}
                    >
                      <A
                        href={buildWorldsendSongDetailPath(record.id)}
                        class="block w-full truncate font-medium text-gray-900 hover:underline"
                      >
                        {record.title}
                      </A>
                    </div>
                    <div class="flex min-h-[34px] items-center justify-center px-2 py-1 text-center whitespace-nowrap">
                      <span class="inline-block w-full text-center leading-none text-gray-700">
                        {record.attribute ?? '-'}
                      </span>
                    </div>
                    <div class="flex min-h-[34px] items-center px-2 py-1 text-left whitespace-nowrap">
                      <span class="inline-block w-full leading-none text-gray-700">
                        {worldsendLevelLabel(record.level_star)}
                      </span>
                    </div>
                    <div class="flex min-h-[34px] items-center justify-center px-2 py-1 whitespace-nowrap">
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
                    <div class="flex min-h-[34px] items-center justify-center px-2 py-1 whitespace-nowrap">
                      <div class="flex w-full justify-center">
                        <span
                          class={`inline-flex rounded-lg px-2 py-1 text-xs font-bold ${worldsendLampClass(record)}`}
                        >
                          {worldsendLampLabel(record)}
                        </span>
                      </div>
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

export const UserProfileView: Component<Props> = (props) => {
  const playerInfo = (): PlayerDTO => props.profile.player
  const honors = (): HonorDTO[] => playerInfo().honors
  const bestRecords = (): PlayerRecordDTO[] => props.profile.records.best
  const bestCandidateRecords = (): PlayerRecordDTO[] => props.profile.records.best_candidate
  const newRecords = (): PlayerRecordDTO[] => props.profile.records.new
  const newCandidateRecords = (): PlayerRecordDTO[] => props.profile.records.new_candidate
  const recordProfile = () => props.recordProfile()
  const worldsendRecords = (): WorldsendRecordDTO[] => recordProfile()?.records.worldsend ?? []
  const navigate = useNavigate()
  const location = useLocation()
  const selectedPageTab = createMemo<'rating' | 'records' | 'overpower'>(() => {
    if (props.selectedPage === 'record_normal' || props.selectedPage === 'record_we') {
      return 'records'
    }

    if (props.selectedPage === 'overpower') {
      return 'overpower'
    }

    return 'rating'
  })
  const selectedRatingTab = createMemo<'best' | 'new'>(() =>
    props.selectedPage === 'rating_new' ? 'new' : 'best'
  )
  const selectedRecordTab = createMemo<'standard' | 'worldsend'>(() =>
    props.selectedPage === 'record_we' ? 'worldsend' : 'standard'
  )

  // ネームプレートの高さ+マージン(タブ切り替え時の自動スクロール用)
  const NAMEPLATE_SCROLL_OFFSET = 183
  const tabTriggerClass =
    'px-3 py-1 rounded-t data-selected:bg-white data-selected:border-b-2 data-selected:border-primary-500'
  const ratingTabTriggerClass =
    'rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors data-selected:bg-primary-600 data-selected:text-white data-selected:shadow-sm'
  const forceMountedTabContentClass = 'hidden data-selected:block'

  const scrollToRecordList = () => {
    if (window.scrollY > NAMEPLATE_SCROLL_OFFSET) {
      window.scrollTo({
        top: NAMEPLATE_SCROLL_OFFSET,
        behavior: 'smooth',
      })
    }
  }

  const buildProfileNavigationTarget = (page: ProfilePageQuery) => {
    const normalizedPath = buildUserProfilePagePath(props.username, page)
    const queryParams = new URLSearchParams(location.search)
    queryParams.delete('page')
    const queryString = queryParams.toString()
    return `${normalizedPath}${queryString ? `?${queryString}` : ''}${location.hash}`
  }

  const handlePageTabChange = (value: string) => {
    if (value !== 'rating' && value !== 'records' && value !== 'overpower') return

    if (value === 'rating') {
      navigate(
        buildProfileNavigationTarget(selectedRatingTab() === 'new' ? 'rating_new' : 'rating_best')
      )
    } else if (value === 'records') {
      navigate(
        buildProfileNavigationTarget(
          selectedRecordTab() === 'worldsend' ? 'record_we' : 'record_normal'
        )
      )
      props.onShowRecords()
    } else {
      navigate(buildProfileNavigationTarget('overpower'))
    }

    scrollToRecordList()
  }

  const handleRatingTabChange = (value: string) => {
    if (value !== 'best' && value !== 'new') return
    navigate(buildProfileNavigationTarget(value === 'new' ? 'rating_new' : 'rating_best'))
    scrollToRecordList()
  }

  const handleRecordTabChange = (value: string) => {
    if (value !== 'standard' && value !== 'worldsend') return
    navigate(buildProfileNavigationTarget(value === 'worldsend' ? 'record_we' : 'record_normal'))
    props.onShowRecords()
    scrollToRecordList()
  }

  return (
    <div class="mb-4 mx-auto w-full max-w-3xl">
      {/* ↑と↓について: stickyScrollの関係でmy-4を使わず、mb-4とmt-4を別の箇所で指定しています */}
      <div class="mt-4">
        {/* ネームプレート */}
        <UserNameplate
          playerInfo={playerInfo()}
          honors={honors()}
          bestRecords={bestRecords()}
          newRecords={newRecords()}
        />
      </div>

      <Tabs.Root value={selectedPageTab()} class="mb-4" onChange={handlePageTabChange}>
        <Tabs.List class="sticky top-0 z-10 bg-white flex gap-2 mb-4 px-4 pt-2 border-b border-gray-300">
          <Tabs.Trigger value="rating" class={tabTriggerClass}>
            レーティング
          </Tabs.Trigger>
          <Tabs.Trigger value="records" class={tabTriggerClass}>
            レコード
          </Tabs.Trigger>
          <Tabs.Trigger value="overpower" class={tabTriggerClass}>
            OVER POWER
          </Tabs.Trigger>
          <div class="flex-1"></div>
        </Tabs.List>

        <Tabs.Content value="rating" forceMount class={forceMountedTabContentClass}>
          <Tabs.Root value={selectedRatingTab()} onChange={handleRatingTabChange}>
            <Tabs.List class="mb-4 mx-4 inline-flex gap-1 rounded-xl bg-gray-100 p-1">
              <Tabs.Trigger value="best" class={ratingTabTriggerClass}>
                ベスト枠
              </Tabs.Trigger>
              <Tabs.Trigger value="new" class={ratingTabTriggerClass}>
                新曲枠
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="best">
              <RecordList records={bestRecords()} candidates={bestCandidateRecords()} />
            </Tabs.Content>
            <Tabs.Content value="new">
              <RecordList records={newRecords()} candidates={newCandidateRecords()} />
            </Tabs.Content>
          </Tabs.Root>
        </Tabs.Content>

        <Tabs.Content value="records" forceMount class={forceMountedTabContentClass}>
          <Tabs.Root value={selectedRecordTab()} onChange={handleRecordTabChange}>
            <Tabs.List class="mb-4 mx-4 inline-flex gap-1 rounded-xl bg-gray-100 p-1">
              <Tabs.Trigger value="standard" class={ratingTabTriggerClass}>
                通常譜面
              </Tabs.Trigger>
              <Tabs.Trigger value="worldsend" class={ratingTabTriggerClass}>
                WORLD'S END
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="standard" forceMount class={forceMountedTabContentClass}>
              <Suspense fallback={<Loading />}>
                <Show when={recordProfile()} fallback={<Loading />}>
                  {(profile) => <UserRecord profile={profile()} />}
                </Show>
              </Suspense>
            </Tabs.Content>
            <Tabs.Content value="worldsend">
              <WorldsendRecordTable records={worldsendRecords()} />
            </Tabs.Content>
          </Tabs.Root>
        </Tabs.Content>

        <Tabs.Content value="overpower" forceMount class={forceMountedTabContentClass}>
          <div class="mx-4 min-h-24 rounded-md border border-dashed border-gray-200 bg-gray-50">
            工事中
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* スクロールトップボタン（モバイル用） */}
      <div class="md:hidden">
        <ScrollToTop />
      </div>
    </div>
  )
}
