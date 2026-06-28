import * as Tabs from '@kobalte/core/tabs'
import { A, useLocation, useNavigate } from '@solidjs/router'
import { ChartColumnIncreasing } from 'lucide-solid'
import type { Accessor, Component } from 'solid-js'
import { createMemo, For, lazy, Show, Suspense } from 'solid-js'
import { Loading } from '../../../components/index.ts'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO } from '../../../types/api.ts'
import { UserNameplate } from './components/UserNameplate.tsx'
import { UserRecordCard } from './components/UserRecordCard.tsx'
import {
  buildUserOverPowerPagePath,
  buildUserProfilePagePath,
  type OverPowerSubPage,
  type ProfilePageQuery,
} from './profilePageQuery.ts'
import type { UserPageRatingProfile, UserPageRecordProfile } from './UserPage.tsx'

const UserRecord = lazy(() => import('../UserRecord/index.ts'))
const UserOverPower = lazy(() => import('../UserOverPower/UserOverPower.tsx'))
const WorldsendRecord = lazy(() => import('../WorldsendRecord/index.ts'))

type Props = {
  profile: UserPageRatingProfile
  recordProfile: Accessor<UserPageRecordProfile | undefined>
  onShowRecords: () => void
  selectedOverPowerSubPage: OverPowerSubPage
  selectedPage: ProfilePageQuery
  username: string
}

const statsPageButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2'
const disabledStatsPageButtonClass =
  'pointer-events-none cursor-not-allowed opacity-50 hover:bg-surface focus-visible:ring-0'
const isStatsPageLinkDisabled = true
const BEST_CANDIDATE_HEADING = 'ベスト枠候補'
const NEW_CANDIDATE_HEADING = '新曲枠候補'

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
  /** プロフィールページ上部のメインタブに適用する表示クラス。 */
  const tabTriggerClass =
    'rounded-t border-b-2 border-transparent px-3 py-1 text-sm text-text-muted transition-colors hover:border-success data-selected:border-focus-ring data-selected:bg-bg data-selected:text-text data-selected:hover:border-focus-ring'
  /** レーティング枠とレコード種別を切り替えるサブタブの表示クラス。 */
  const ratingTabTriggerClass =
    'rounded-lg p-2 text-sm font-medium text-text-muted transition-colors hover:bg-action-secondary hover:text-text data-selected:bg-action-primary data-selected:text-text-inverse data-selected:shadow-sm data-selected:hover:bg-action-primary data-selected:hover:text-text-inverse focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring'
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

      <Tabs.Root value={selectedPageTab()} class="mb-4" onChange={handlePageTabChange}>
        <Tabs.List class="sticky top-0 z-10 bg-bg flex gap-2 mb-4 px-4 pt-2 border-b border-border-strong">
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
            <div class="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <Tabs.List class="inline-flex gap-1 rounded-xl bg-surface-hover p-1">
                <Tabs.Trigger value="best" class={ratingTabTriggerClass}>
                  ベスト枠
                </Tabs.Trigger>
                <Tabs.Trigger value="new" class={ratingTabTriggerClass}>
                  新曲枠
                </Tabs.Trigger>
              </Tabs.List>
              <StatsPageLink href={statsPagePath()} />
            </div>

            <Tabs.Content value="best">
              <RecordList
                records={bestRecords()}
                candidates={bestCandidateRecords()}
                candidateHeading={BEST_CANDIDATE_HEADING}
              />
            </Tabs.Content>
            <Tabs.Content value="new">
              <RecordList
                records={newRecords()}
                candidates={newCandidateRecords()}
                candidateHeading={NEW_CANDIDATE_HEADING}
              />
            </Tabs.Content>
          </Tabs.Root>
        </Tabs.Content>

        <Tabs.Content value="records" forceMount class={forceMountedTabContentClass}>
          <Tabs.Root value={selectedRecordTab()} onChange={handleRecordTabChange}>
            <div class="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <Tabs.List class="inline-flex gap-1 rounded-xl bg-surface-hover p-1">
                <Tabs.Trigger value="standard" class={ratingTabTriggerClass}>
                  STANDARD
                </Tabs.Trigger>
                <Tabs.Trigger value="worldsend" class={ratingTabTriggerClass}>
                  WORLD'S END
                </Tabs.Trigger>
              </Tabs.List>
              <StatsPageLink href={statsPagePath()} />
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
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
