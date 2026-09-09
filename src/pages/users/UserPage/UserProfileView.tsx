import { useLocation, useNavigate } from '@solidjs/router'
import { ImageOff } from 'lucide-solid'
import type { Accessor, Component, Resource } from 'solid-js'
import { createMemo, createSignal, For, lazy, Show, Suspense } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { AppIconButton } from '../../../components/common/AppButton'
import { AppTabContent, SegmentedTabs, UnderlineTabs } from '../../../components/common/AppTabs'
import { UserRecordCard } from '../../../components/common/record/UserRecordCard'
import { RATING_SLOT_COUNT } from '../../../constants/rating'
import {
  createAppMainScrollOffsetRestoreEffect,
  useAppMainScrollRestoration,
} from '../../../hooks/useAppMainScrollRestoration'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO } from '../../../types/api'
import {
  getAppMainScrollTop,
  saveAppMainScrollOffset,
} from '../../../utils/appMainScrollRestoration'
import {
  calculateCandidateScoreDifference,
  calculateCandidateTargetRating,
} from '../../../utils/candidateScoreDifference'
import {
  buildUserOverPowerPagePath,
  buildUserProfilePagePath,
  buildUserStatsPagePath,
  type OverPowerSubPage,
  type ProfilePageQuery,
} from '../../../utils/userProfileRoute'
import { scrollToUserProfileContent } from '../../../utils/userProfileScroll'
import { RatingImagePreviewDialog } from './components/RatingImagePreviewDialog'
import { UserNameplate } from './components/UserNameplate'
import { UserRecordPlaceholderCard } from './components/UserRecordPlaceholderCard'
import type {
  UserPageCourseRecordProfile,
  UserPageRatingProfile,
  UserPageRecordProfile,
} from './UserPage'

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
  /** レーティング対象として表示する規定枠数 */
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
  const [standardReady, setStandardReady] = createSignal(false)
  const [worldsendReady, setWorldsendReady] = createSignal(false)
  const [courseReady, setCourseReady] = createSignal(false)
  const [pendingSubTabScrollOffset, setPendingSubTabScrollOffset] = createSignal<number>()
  /**
   * 表示中タブのコンテンツがスクロール復元可能かを返す。
   * レコードは非同期設定の復元と仮想テーブルの描画完了を待つ。
   *
   * @returns 表示中タブの描画が完了していれば true。
   */
  const isSelectedTabReady = () => {
    switch (props.selectedPage) {
      case 'rating_best':
      case 'rating_new':
        return true
      case 'record_normal':
        return standardReady()
      case 'record_we':
        return worldsendReady()
      case 'record_course':
        return courseReady()
      default:
        return false
    }
  }
  useAppMainScrollRestoration(isSelectedTabReady)
  createAppMainScrollOffsetRestoreEffect(
    () => location.pathname,
    isSelectedTabReady,
    pendingSubTabScrollOffset,
    () => setPendingSubTabScrollOffset(undefined)
  )
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

  const forceMountedTabContentClass = 'hidden data-selected:block'

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

  /**
   * タブ切替前の `#app-main` スクロール位置を現在のパスへ保存する。
   * 同一マウント内のタブ遷移では `useBeforeLeave` が発火しない場合があるため、明示的に保存する。
   *
   * @returns 保存した縦スクロール位置。
   */
  const saveCurrentProfileScrollPosition = (): number => {
    const offset = getAppMainScrollTop()
    saveAppMainScrollOffset(location.pathname, offset)
    return offset
  }

  /**
   * 上位タブを切り替え、切り替え先のプロフィール内容の先頭へ移動する。
   *
   * @param value - 切り替え先の上位タブ。
   * @returns なし。
   */
  const handlePageTabChange = (value: string) => {
    if (value !== 'rating' && value !== 'records' && value !== 'overpower') return

    setPendingSubTabScrollOffset(undefined)
    saveCurrentProfileScrollPosition()
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

    scrollToUserProfileContent('smooth')
  }

  /**
   * 現在のスクロール位置を維持したままレーティング枠を切り替える。
   *
   * @param value - 切り替え先のレーティング枠。
   * @returns なし。
   */
  const handleRatingTabChange = (value: string) => {
    if (value !== 'best' && value !== 'new') return
    setPendingSubTabScrollOffset(saveCurrentProfileScrollPosition())
    navigate(buildProfileNavigationTarget(value === 'new' ? 'rating_new' : 'rating_best'), {
      scroll: false,
    })
  }

  /**
   * レーティングカードのジャケット画像表示を切り替える。
   *
   * @returns ジャケット画像表示の状態を反転する。
   */
  const handleJacketVisibilityToggle = () => {
    setShowJackets((current) => !current)
  }

  /**
   * 現在のスクロール位置を維持したままレコード種別を切り替える。
   *
   * @param value - 切り替え先のレコード種別。
   * @returns なし。
   */
  const handleRecordTabChange = (value: string) => {
    if (value !== 'standard' && value !== 'worldsend' && value !== 'course') return
    setPendingSubTabScrollOffset(saveCurrentProfileScrollPosition())
    const page =
      value === 'worldsend' ? 'record_we' : value === 'course' ? 'record_course' : 'record_normal'
    navigate(buildProfileNavigationTarget(page), { scroll: false })
    if (value !== 'course') props.onShowRecords()
  }

  return (
    <div class="mb-4 mx-auto w-full max-w-3xl">
      {/* ↑と↓について: stickyScrollの関係でmy-4を使わず、mb-4とmt-4を別の箇所で指定しています */}
      <div class="mt-4">
        {/* ネームプレート */}
        <UserNameplate
          playerInfo={playerInfo()}
          honors={honors()}
          rating={props.profile.rating}
          historyHref={buildUserStatsPagePath(props.username)}
        />
      </div>

      <UnderlineTabs
        value={selectedPageTab()}
        class="mb-4"
        onChange={handlePageTabChange}
        options={PAGE_TAB_OPTIONS}
        listClass="sticky top-0 z-10 mb-4 bg-page-pattern px-4 pt-2"
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
                    <UserRecord
                      username={profile().username}
                      record={profile().record}
                      active={props.selectedPage === 'record_normal'}
                      onReadyChange={setStandardReady}
                    />
                  )}
                </Show>
              </Suspense>
            </AppTabContent>
            <AppTabContent value="worldsend" forceMount class={forceMountedTabContentClass}>
              <Suspense fallback={<Loading />}>
                <Show when={recordProfile()} fallback={<Loading />}>
                  {(profile) => (
                    <WorldsendRecord
                      username={profile().username}
                      records={profile().record.worldsend ?? []}
                      active={props.selectedPage === 'record_we'}
                      onReadyChange={setWorldsendReady}
                    />
                  )}
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
                    {(profile) => (
                      <CourseRecord
                        username={profile().username}
                        records={profile().records.courses}
                        active={props.selectedPage === 'record_course'}
                        onReadyChange={setCourseReady}
                      />
                    )}
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
