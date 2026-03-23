import * as Tabs from '@kobalte/core/tabs'
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
import { worldsendLampClass, worldsendLampLabel } from './worldsendLampDisplay'
import { worldsendTableWrapperClass } from './worldsendTableStyles'

const UserRecord = lazy(() => import('../UserRecord'))

type Props = {
  profile: UserProfileWithRecordsDTO
  recordProfile: Accessor<UserProfileWithRecordsDTO | undefined>
  onShowRecords: () => void
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

export const worldsendGridColumns = 'minmax(0,1fr) 3rem 3.5rem 4.5rem 3rem'
const worldsendHeaderButtonClass =
  'flex min-h-[34px] w-full items-center justify-center gap-1 px-2 py-1 text-center whitespace-nowrap transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset'

const RecordList: Component<{ records: PlayerRecordDTO[] }> = (props) => (
  <div class="mx-4 flex flex-col gap-2">
    <For each={props.records}>{(record, i) => <UserRecordCard record={record} index={i()} />}</For>
  </div>
)

const worldsendSortIndicator = (active: boolean, direction: WorldsendSortDirection | null) => {
  if (!active || !direction) {
    return <ArrowUpDown class="h-3 w-3 text-gray-300" aria-hidden="true" />
  }

  return direction === 'asc' ? (
    <ArrowUp class="h-3 w-3 text-sky-600" aria-hidden="true" />
  ) : (
    <ArrowDown class="h-3 w-3 text-sky-600" aria-hidden="true" />
  )
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
          <div class="min-w-[28rem]">
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
                      <span class="block w-full truncate font-medium text-gray-900">
                        {record.title}
                      </span>
                    </div>
                    <div class="flex min-h-[34px] items-center justify-center px-2 py-1 text-center whitespace-nowrap">
                      <span class="inline-block w-full text-center leading-none text-gray-700">
                        {record.attribute ?? '-'}
                      </span>
                    </div>
                    <div class="flex min-h-[34px] items-center justify-center px-2 py-1 text-center whitespace-nowrap">
                      <span class="inline-block w-full text-center leading-none text-gray-700">
                        {typeof record.level_star === 'number' ? `${record.level_star}*` : '-'}
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
  const newRecords = (): PlayerRecordDTO[] => props.profile.records.new
  const recordProfile = () => props.recordProfile()
  const worldsendRecords = (): WorldsendRecordDTO[] => recordProfile()?.records.worldsend ?? []
  const [selectedPageTab, setSelectedPageTab] = createSignal<'rating' | 'records'>('rating')

  // ネームプレートの高さ+マージン(タブ切り替え時の自動スクロール用)
  const NAMEPLATE_SCROLL_OFFSET = 183
  const tabTriggerClass =
    'px-3 py-1 rounded-t data-selected:bg-white data-selected:border-b-2 data-selected:border-primary-500'
  const ratingTabTriggerClass =
    'rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors data-selected:bg-primary-600 data-selected:text-white data-selected:shadow-sm'
  const forceMountedTabContentClass = 'hidden data-selected:block'

  const scrollToRecordList = () => {
    const scrollTarget = document.getElementById('app-main')
    if (scrollTarget && scrollTarget.scrollTop > NAMEPLATE_SCROLL_OFFSET) {
      scrollTarget.scrollTo({
        top: NAMEPLATE_SCROLL_OFFSET,
        behavior: 'smooth',
      })
    }
  }

  const handlePageTabChange = (value: string) => {
    if (value !== 'rating' && value !== 'records') return
    setSelectedPageTab(value)
    if (value === 'records') {
      props.onShowRecords()
    }
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
          <div class="flex-1"></div>
        </Tabs.List>

        <Tabs.Content value="rating" forceMount class={forceMountedTabContentClass}>
          <Tabs.Root defaultValue="best" onChange={scrollToRecordList}>
            <Tabs.List class="mb-4 mx-4 inline-flex gap-1 rounded-xl bg-gray-100 p-1">
              <Tabs.Trigger value="best" class={ratingTabTriggerClass}>
                ベスト枠
              </Tabs.Trigger>
              <Tabs.Trigger value="new" class={ratingTabTriggerClass}>
                新曲枠
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="best">
              <RecordList records={bestRecords()} />
            </Tabs.Content>
            <Tabs.Content value="new">
              <RecordList records={newRecords()} />
            </Tabs.Content>
          </Tabs.Root>
        </Tabs.Content>

        <Tabs.Content value="records" forceMount class={forceMountedTabContentClass}>
          <Tabs.Root defaultValue="standard" onChange={scrollToRecordList}>
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
      </Tabs.Root>

      {/* スクロールトップボタン（モバイル用） */}
      <div class="md:hidden">
        <ScrollToTop />
      </div>
    </div>
  )
}
