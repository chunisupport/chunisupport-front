import { A, useLocation, useNavigate } from '@solidjs/router'
import { ChartColumnIncreasing } from 'lucide-solid'
import type { Accessor, Component } from 'solid-js'
import { createMemo, For, lazy, Show, Suspense } from 'solid-js'
import { Loading } from '../../../components'
import { getAppButtonClass } from '../../../components/common/AppButton'
import { AppTabContent, SegmentedTabs, UnderlineTabs } from '../../../components/common/AppTabs'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO } from '../../../types/api'
import {
  buildUserOverPowerPagePath,
  buildUserProfilePagePath,
  type OverPowerSubPage,
  type ProfilePageQuery,
} from '../../../utils/userProfileRoute'
import { UserNameplate } from './components/UserNameplate'
import { UserRecordCard } from './components/UserRecordCard'
import type { UserPageRatingProfile, UserPageRecordProfile } from './UserPage'

const UserRecord = lazy(() => import('../UserRecord'))
const UserOverPower = lazy(() => import('../UserOverPower/UserOverPower'))
const WorldsendRecord = lazy(() => import('../WorldsendRecord'))

type Props = {
  profile: UserPageRatingProfile
  recordProfile: Accessor<UserPageRecordProfile | undefined>
  onShowRecords: () => void
  selectedOverPowerSubPage: OverPowerSubPage
  selectedPage: ProfilePageQuery
  username: string
}

const statsPageButtonClass = getAppButtonClass({
  variant: 'surface',
  shape: 'pill',
  class: 'h-10 focus-visible:ring-offset-2',
})
const disabledStatsPageButtonClass =
  'pointer-events-none cursor-not-allowed opacity-50 hover:bg-surface focus-visible:ring-0'
const isStatsPageLinkDisabled = true
const BEST_CANDIDATE_HEADING = 'ベスト枠候補'
const NEW_CANDIDATE_HEADING = '新曲枠候補'
const PAGE_TAB_OPTIONS = [
  { value: 'rating', label: 'レーティング' },
  { value: 'records', label: 'レコード' },
  { value: 'overpower', label: 'OVER POWER' },
] as const
const RATING_TAB_OPTIONS = [
  { value: 'best', label: 'ベスト枠' },
  { value: 'new', label: '新曲枠' },
] as const
const RECORD_TAB_OPTIONS = [
  { value: 'standard', label: 'STANDARD' },
  { value: 'worldsend', label: "WORLD'S END" },
] as const

/**
 * ユーザー統計ページへのリンクを表示する。
 *
 * @param props - 統計ページのリンク先。
 * @returns 統計ページへのリンク。
 */
const StatsPageLink: Component<{ href: string }> = (props) => (
  <A
    href={props.href}
    class={`${statsPageButtonClass} ${isStatsPageLinkDisabled ? disabledStatsPageButtonClass : ''}`}
    aria-disabled={isStatsPageLinkDisabled ? 'true' : undefined}
    aria-label={isStatsPageLinkDisabled ? '統計ページ（開発中）' : '統計ページ'}
    tabIndex={isStatsPageLinkDisabled ? -1 : undefined}
    title={isStatsPageLinkDisabled ? '統計ページ（開発中）' : '統計ページ'}
    onClick={(event) => {
      if (isStatsPageLinkDisabled) event.preventDefault()
    }}
  >
    <span>統計</span>
    <ChartColumnIncreasing class="h-5 w-5" aria-hidden="true" />
  </A>
)

/**
 * レーティング対象レコードと候補レコードを一覧表示する。
 *
 * @param props - レーティング対象レコード、候補レコード、候補見出し。
 * @returns レコードカードの一覧。
 */
const RecordList: Component<{
  records: PlayerRecordDTO[]
  candidates?: PlayerRecordDTO[]
  candidateHeading: string
}> = (props) => (
  <div class="mx-4 flex flex-col gap-2">
    <For each={props.records}>{(record, i) => <UserRecordCard record={record} index={i()} />}</For>
    <Show when={(props.candidates?.length ?? 0) > 0}>
      <h3 class="mt-4 border-t-2 border-border-strong pt-4 text-base font-bold text-text">
        {props.candidateHeading}
      </h3>
      <For each={props.candidates}>
        {(record, i) => <UserRecordCard record={record} index={i()} useDefaultIndexColor />}
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

  const buildOverPowerNavigationTarget = (subPage: OverPowerSubPage) => {
    const normalizedPath = buildUserOverPowerPagePath(props.username, subPage)
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
      navigate(buildOverPowerNavigationTarget(props.selectedOverPowerSubPage))
      props.onShowRecords()
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
        <UserNameplate playerInfo={playerInfo()} honors={honors()} rating={props.profile.rating} />
      </div>

      <UnderlineTabs
        value={selectedPageTab()}
        class="mb-4"
        onChange={handlePageTabChange}
        options={PAGE_TAB_OPTIONS}
        listClass="sticky top-0 z-10 mb-4 bg-bg px-4 pt-2"
        listAfter={<div class="flex-1" />}
      >
        <AppTabContent value="rating" forceMount class={forceMountedTabContentClass}>
          <SegmentedTabs
            value={selectedRatingTab()}
            onChange={handleRatingTabChange}
            options={RATING_TAB_OPTIONS}
            listClass="rounded-xl"
            listWrapperClass="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3"
            listAside={<StatsPageLink href={statsPagePath()} />}
            triggerClass="p-2"
          >
            <AppTabContent value="best">
              <RecordList
                records={bestRecords()}
                candidates={bestCandidateRecords()}
                candidateHeading={BEST_CANDIDATE_HEADING}
              />
            </AppTabContent>
            <AppTabContent value="new">
              <RecordList
                records={newRecords()}
                candidates={newCandidateRecords()}
                candidateHeading={NEW_CANDIDATE_HEADING}
              />
            </AppTabContent>
          </SegmentedTabs>
        </AppTabContent>

        <AppTabContent value="records" forceMount class={forceMountedTabContentClass}>
          <SegmentedTabs
            value={selectedRecordTab()}
            onChange={handleRecordTabChange}
            options={RECORD_TAB_OPTIONS}
            listClass="rounded-xl"
            listWrapperClass="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3"
            triggerClass="p-2"
          >
            <AppTabContent value="standard" forceMount class={forceMountedTabContentClass}>
              <Suspense fallback={<Loading />}>
                <Show when={recordProfile()} fallback={<Loading />}>
                  {(profile) => (
                    <UserRecord username={profile().username} record={profile().record} />
                  )}
                </Show>
              </Suspense>
            </AppTabContent>
            <AppTabContent value="worldsend" forceMount class={forceMountedTabContentClass}>
              <Suspense fallback={<Loading />}>
                <Show when={recordProfile()} fallback={<Loading />}>
                  {(profile) => <WorldsendRecord records={profile().record.worldsend ?? []} />}
                </Show>
              </Suspense>
            </AppTabContent>
          </SegmentedTabs>
        </AppTabContent>

        <AppTabContent value="overpower" forceMount class={forceMountedTabContentClass}>
          <Suspense fallback={<Loading />}>
            <Show when={recordProfile()} fallback={<Loading />}>
              {(profile) => (
                <UserOverPower
                  record={profile().record}
                  selectedSubPage={props.selectedOverPowerSubPage}
                  username={props.username}
                />
              )}
            </Show>
          </Suspense>
        </AppTabContent>
      </UnderlineTabs>
    </div>
  )
}
