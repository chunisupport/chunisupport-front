import { useLocation, useNavigate } from '@solidjs/router'
import { ImageOff } from 'lucide-solid'
import type { Accessor, Component, Resource } from 'solid-js'
import { createMemo, createSignal, For, lazy, Show, Suspense } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { AppIconButton } from '../../../components/common/AppButton'
import { AppTabContent, SegmentedTabs, UnderlineTabs } from '../../../components/common/AppTabs'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO } from '../../../types/api'
import {
  calculateCandidateScoreDifference,
  calculateCandidateTargetRating,
} from '../../../utils/candidateScoreDifference'
import {
  buildUserOverPowerPagePath,
  buildUserProfilePagePath,
  type OverPowerSubPage,
  type ProfilePageQuery,
} from '../../../utils/userProfileRoute'
import { RatingImagePreviewDialog } from './components/RatingImagePreviewDialog'
import { UserNameplate } from './components/UserNameplate'
import { UserRecordCard } from './components/UserRecordCard'
import { UserRecordPlaceholderCard } from './components/UserRecordPlaceholderCard'
import type {
  UserPageCourseRecordProfile,
  UserPageRatingProfile,
  UserPageRecordProfile,
} from './UserPage'
import { RATING_SLOT_COUNT } from './UserProfileView.constants'

const UserRecord = lazy(() => import('../UserRecord'))
const UserOverPower = lazy(() => import('../UserOverPower/UserOverPower'))
const WorldsendRecord = lazy(() => import('../WorldsendRecord'))
const CourseRecord = lazy(() => import('../CourseRecord'))

type Props = {
  profile: UserPageRatingProfile
  recordProfile: Accessor<UserPageRecordProfile | undefined>
  courseRecordProfile: Resource<UserPageCourseRecordProfile>
  onShowRecords: () => void
  selectedOverPowerSubPage: OverPowerSubPage
  selectedPage: ProfilePageQuery
  username: string
}

const BEST_CANDIDATE_HEADING = 'ベスト枠候補'
const NEW_CANDIDATE_HEADING = '新曲枠候補'
const JACKET_VISIBILITY_LABEL = 'ジャケット画像を非表示'
const HIDE_JACKETS_LABEL = 'ジャケット画像を非表示'
const SHOW_JACKETS_LABEL = 'ジャケット画像を表示'
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
  { value: 'course', label: 'COURSE' },
] as const

/**
 * レーティングカードのジャケット画像表示を切り替える。
 *
 * @param props - ジャケット画像の表示状態と切り替え処理。
 * @returns ジャケット画像表示を切り替える丸形アイコンボタン。
 */
const JacketVisibilityToggle: Component<{
  showJackets: boolean
  onToggle: () => void
}> = (props) => {
  const actionLabel = () => (props.showJackets ? HIDE_JACKETS_LABEL : SHOW_JACKETS_LABEL)

  return (
    <AppIconButton
      class="rounded-full data-[jackets-hidden=true]:border-action-primary data-[jackets-hidden=true]:bg-action-primary data-[jackets-hidden=true]:text-text-inverse data-[jackets-hidden=true]:hover:bg-action-primary-hover"
      aria-label={JACKET_VISIBILITY_LABEL}
      aria-pressed={!props.showJackets}
      data-jackets-hidden={!props.showJackets}
      title={actionLabel()}
      onClick={props.onToggle}
    >
      <ImageOff class="h-5 w-5" aria-hidden="true" />
    </AppIconButton>
  )
}

/**
 * レーティング対象レコードと候補レコードを一覧表示する。
 *
 * @param props - レーティング対象・候補レコード、候補見出し、候補の目標レーティング。
 * @returns レコードカードの一覧。
 */
const RecordList: Component<{
  records: PlayerRecordDTO[]
  candidates?: PlayerRecordDTO[]
  candidateHeading: string
  candidateTargetRating?: number
  showJackets: boolean
  /** レーティング対象として表示する規定枠数。 */
  slotCount: number
}> = (props) => {
  /**
   * 実レコードの後ろに表示する空き枠のインデックスを返す。
   *
   * @returns 実レコード件数から規定枠数までの0始まりインデックス。
   */
  const emptySlotIndexes = (): number[] =>
    Array.from(
      { length: Math.max(props.slotCount - props.records.length, 0) },
      (_, index) => props.records.length + index
    )

  return (
    <div class="mx-4 flex flex-col gap-2">
      <For each={props.records}>
        {(record, i) => (
          <UserRecordCard record={record} index={i()} showJackets={props.showJackets} />
        )}
      </For>
      <For each={emptySlotIndexes()}>{(index) => <UserRecordPlaceholderCard index={index} />}</For>
      <Show when={(props.candidates?.length ?? 0) > 0}>
        <h3 class="mt-4 border-t-2 border-border-strong pt-4 text-base font-bold text-text">
          {props.candidateHeading}
        </h3>
        <For each={props.candidates}>
          {(record, i) => (
            <UserRecordCard
              record={record}
              index={i()}
              showJackets={props.showJackets}
              scoreDifference={
                props.candidateTargetRating === undefined
                  ? undefined
                  : calculateCandidateScoreDifference(
                      record.score,
                      record.const,
                      props.candidateTargetRating
                    )
              }
              useDefaultIndexColor
            />
          )}
        </For>
      </Show>
    </div>
  )
}

/**
 * ユーザープロフィールとレーティング・レコード・OVER POWERの各タブを表示する。
 *
 * @param props - プロフィール表示と各タブの取得状態・選択状態。
 * @returns ユーザープロフィール画面。
 */
export const UserProfileView: Component<Props> = (props) => {
  const [showJackets, setShowJackets] = createSignal(true)
  const playerInfo = (): PlayerDTO => props.profile.player
  const honors = (): HonorDTO[] => playerInfo().honors
  const bestRecords = (): PlayerRecordDTO[] => props.profile.rating.best
  const bestCandidateRecords = (): PlayerRecordDTO[] => props.profile.rating.best_candidate
  const newRecords = (): PlayerRecordDTO[] => props.profile.rating.new
  const newCandidateRecords = (): PlayerRecordDTO[] => props.profile.rating.new_candidate
  const bestCandidateTargetRating = createMemo(() =>
    calculateCandidateTargetRating(bestRecords().map((record) => record.rating))
  )
  const newCandidateTargetRating = createMemo(() =>
    calculateCandidateTargetRating(newRecords().map((record) => record.rating))
  )
  const recordProfile = () => props.recordProfile()
  /**
   * 現在表示中のユーザーに一致するコースレコードだけを返す。
   *
   * @returns 表示対象ユーザーのコースレコード。取得前または別ユーザーの値ならundefined。
   */
  const courseRecordProfile = () => {
    const profile = props.courseRecordProfile()
    return profile?.username === props.username ? profile : undefined
  }
  const navigate = useNavigate()
  const location = useLocation()
  const selectedPageTab = createMemo<'rating' | 'records' | 'overpower'>(() => {
    if (
      props.selectedPage === 'record_normal' ||
      props.selectedPage === 'record_we' ||
      props.selectedPage === 'record_course'
    ) {
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
  const selectedRecordTab = createMemo<'standard' | 'worldsend' | 'course'>(() => {
    if (props.selectedPage === 'record_we') return 'worldsend'
    if (props.selectedPage === 'record_course') return 'course'
    return 'standard'
  })

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

  const handlePageTabChange = (value: string) => {
    if (value !== 'rating' && value !== 'records' && value !== 'overpower') return

    if (value === 'rating') {
      navigate(
        buildProfileNavigationTarget(selectedRatingTab() === 'new' ? 'rating_new' : 'rating_best')
      )
    } else if (value === 'records') {
      navigate(
        buildProfileNavigationTarget(
          selectedRecordTab() === 'worldsend'
            ? 'record_we'
            : selectedRecordTab() === 'course'
              ? 'record_course'
              : 'record_normal'
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

  /**
   * レーティングカードのジャケット画像表示を切り替える。
   *
   * @returns ジャケット画像表示の状態を反転する。
   */
  const handleJacketVisibilityToggle = () => {
    setShowJackets((current) => !current)
  }

  const handleRecordTabChange = (value: string) => {
    if (value !== 'standard' && value !== 'worldsend' && value !== 'course') return
    const page =
      value === 'worldsend' ? 'record_we' : value === 'course' ? 'record_course' : 'record_normal'
    navigate(buildProfileNavigationTarget(page))
    if (value !== 'course') props.onShowRecords()
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
        triggerClass="data-selected:!bg-transparent"
        listAfter={<div class="flex-1" />}
      >
        <AppTabContent value="rating" forceMount class={forceMountedTabContentClass}>
          <SegmentedTabs
            value={selectedRatingTab()}
            onChange={handleRatingTabChange}
            options={RATING_TAB_OPTIONS}
            listClass="rounded-xl"
            listWrapperClass="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3"
            listAside={
              <div class="flex items-center gap-2">
                <JacketVisibilityToggle
                  showJackets={showJackets()}
                  onToggle={handleJacketVisibilityToggle}
                />
                <RatingImagePreviewDialog
                  username={props.username}
                  playerInfo={playerInfo()}
                  honors={honors()}
                  rating={props.profile.rating}
                  showJackets={showJackets()}
                />
              </div>
            }
            triggerClass="p-2"
          >
            <AppTabContent value="best">
              <RecordList
                records={bestRecords()}
                candidates={bestCandidateRecords()}
                candidateHeading={BEST_CANDIDATE_HEADING}
                candidateTargetRating={bestCandidateTargetRating()}
                showJackets={showJackets()}
                slotCount={RATING_SLOT_COUNT.best}
              />
            </AppTabContent>
            <AppTabContent value="new">
              <RecordList
                records={newRecords()}
                candidates={newCandidateRecords()}
                candidateHeading={NEW_CANDIDATE_HEADING}
                candidateTargetRating={newCandidateTargetRating()}
                showJackets={showJackets()}
                slotCount={RATING_SLOT_COUNT.new}
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
            <AppTabContent value="course">
              <Suspense fallback={<Loading />}>
                <Show
                  when={!props.courseRecordProfile.error}
                  fallback={<LoadError error={props.courseRecordProfile.error} />}
                >
                  <Show when={courseRecordProfile()} fallback={<Loading />}>
                    {(profile) => <CourseRecord records={profile().records.courses} />}
                  </Show>
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
