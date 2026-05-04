import * as Tabs from '@kobalte/core/tabs'
import { A, useLocation, useNavigate } from '@solidjs/router'
import { ChartColumnIncreasing } from 'lucide-solid'
import type { Accessor, Component } from 'solid-js'
import { createMemo, For, lazy, Show, Suspense } from 'solid-js'
import { Loading, ScrollToTop } from '../../../components'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO } from '../../../types/api'
import { UserNameplate } from './components/UserNameplate'
import { UserRecordCard } from './components/UserRecordCard'
import { buildUserProfilePagePath, type ProfilePageQuery } from './profilePageQuery'
import { shouldShowProfileScrollToTop } from './scrollToTopVisibility'
import type { UserPageRatingProfile, UserPageRecordProfile } from './UserPage'

const UserRecord = lazy(() => import('../UserRecord'))
const WorldsendRecord = lazy(() => import('../WorldsendRecord'))

type Props = {
  profile: UserPageRatingProfile
  recordProfile: Accessor<UserPageRecordProfile | undefined>
  onShowRecords: () => void
  selectedPage: ProfilePageQuery
  username: string
}

const statsPageButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2'

const RecordList: Component<{ records: PlayerRecordDTO[]; candidates?: PlayerRecordDTO[] }> = (
  props
) => (
  <div class="mx-4 flex flex-col gap-2">
    <For each={props.records}>{(record, i) => <UserRecordCard record={record} index={i()} />}</For>
    <Show when={(props.candidates?.length ?? 0) > 0}>
      <For each={props.candidates}>
        {(record, i) => (
          <UserRecordCard
            record={record}
            index={props.records.length + i()}
            showCandidateDivider={i() === 0}
          />
        )}
      </For>
    </Show>
  </div>
)

export const UserProfileView: Component<Props> = (props) => {
  const playerInfo = (): PlayerDTO => props.profile.player
  const honors = (): HonorDTO[] => playerInfo().honors
  const bestRecords = (): PlayerRecordDTO[] => props.profile.rating.best
  const bestCandidateRecords = (): PlayerRecordDTO[] => props.profile.rating.best_candidate
  const newRecords = (): PlayerRecordDTO[] => props.profile.rating.new
  const newCandidateRecords = (): PlayerRecordDTO[] => props.profile.rating.new_candidate
  const recordProfile = () => props.recordProfile()
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
    'rounded-t px-3 py-1 text-sm data-selected:border-b-2 data-selected:border-primary-500 data-selected:bg-white'
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

  const buildProfileNavigationTarget = (page: ProfilePageQuery) => {
    const normalizedPath = buildUserProfilePagePath(props.username, page)
    const queryParams = new URLSearchParams(location.search)
    queryParams.delete('page')
    const queryString = queryParams.toString()
    return `${normalizedPath}${queryString ? `?${queryString}` : ''}${location.hash}`
  }

  const statsPagePath = () => `/users/${encodeURIComponent(props.username)}/stats`

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
            <div class="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <Tabs.List class="inline-flex gap-1 rounded-xl bg-gray-100 p-1">
                <Tabs.Trigger value="standard" class={ratingTabTriggerClass}>
                  STANDARD
                </Tabs.Trigger>
                <Tabs.Trigger value="worldsend" class={ratingTabTriggerClass}>
                  WORLD'S END
                </Tabs.Trigger>
              </Tabs.List>
              <A
                href={statsPagePath()}
                class={statsPageButtonClass}
                aria-label="統計ページ"
                title="統計ページ"
              >
                <ChartColumnIncreasing class="h-5 w-5" aria-hidden="true" />
              </A>
            </div>

            <Tabs.Content value="standard" forceMount class={forceMountedTabContentClass}>
              <Suspense fallback={<Loading />}>
                <Show when={recordProfile()} fallback={<Loading />}>
                  {(profile) => (
                    <UserRecord username={profile().username} record={profile().record} />
                  )}
                </Show>
              </Suspense>
            </Tabs.Content>
            <Tabs.Content value="worldsend" forceMount class={forceMountedTabContentClass}>
              <Suspense fallback={<Loading />}>
                <Show when={recordProfile()} fallback={<Loading />}>
                  {(profile) => <WorldsendRecord records={profile().record.worldsend ?? []} />}
                </Show>
              </Suspense>
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
      <Show when={shouldShowProfileScrollToTop(props.selectedPage)}>
        <div class="md:hidden">
          <ScrollToTop />
        </div>
      </Show>
    </div>
  )
}
