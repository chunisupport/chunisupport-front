import { useParams, useSearchParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  Show,
} from 'solid-js'

import { fetchUserProfileSummary } from '../../../api/users'
import { LoadError, Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type {
  PlayerDTO,
  UserCourseRecordsDTO,
  UserRatingDTO,
  UserRecordDTO,
} from '../../../types/api'
import { fetchUserCourseRecordsWithCache } from '../../../usecases/cache/fetchUserCourseRecordsWithCache'
import { fetchUserRatingWithCache } from '../../../usecases/cache/fetchUserRatingWithCache'
import { fetchUserRecordWithCache } from '../../../usecases/cache/fetchUserRecordWithCache'
import { isNotFoundApiError } from '../../../utils/apiError'
import { resolveOverPowerSubPage, resolveProfilePageQuery } from '../../../utils/userProfileRoute'
import NotFoundPage from '../../NotFoundPage'
import { UserProfileView } from './UserProfileView'

export type UserPageRatingProfile = {
  username: string
  player: PlayerDTO
  rating: UserRatingDTO
}

export type UserPageRecordProfile = {
  username: string
  player: PlayerDTO
  record: UserRecordDTO
}

/** ユーザー名とコースレコード取得結果を関連付けた表示用データ。 */
export type UserPageCourseRecordProfile = {
  /** 取得対象のユーザー名。 */
  username: string
  /** コースレコード一覧レスポンス。 */
  records: UserCourseRecordsDTO
}

type UserPageLoadState =
  | {
      type: 'loaded'
      profile: Awaited<ReturnType<typeof fetchUserProfileSummary>>
      rating: UserRatingDTO
    }
  | {
      type: 'notFound'
    }
  | {
      type: 'error'
      error: unknown
    }

type UserPageRecordLoadState = {
  username: string
  record: UserRecordDTO
}

/**
 * ユーザーページの初期表示に必要なプロフィールとレーティングを取得する。
 *
 * @param username - 表示対象のユーザー名。
 * @returns ユーザーページの初期表示状態。
 */
const fetchUserPageLoadState = async (username: string): Promise<UserPageLoadState> => {
  try {
    const [profile, rating] = await Promise.all([
      fetchUserProfileSummary(username),
      fetchUserRatingWithCache(username),
    ])

    return { type: 'loaded', profile, rating }
  } catch (error) {
    if (isNotFoundApiError(error)) {
      return { type: 'notFound' }
    }

    return { type: 'error', error }
  }
}

/**
 * ユーザーレコードと取得対象ユーザー名をまとめて取得する。
 *
 * @param username - レコード取得対象のユーザー名。
 * @returns 取得対象ユーザー名付きのレコード取得結果。
 */
const fetchUserRecordLoadState = async (username: string): Promise<UserPageRecordLoadState> => ({
  username,
  record: await fetchUserRecordWithCache(username),
})

/**
 * ユーザーの未プレイを含むコースレコードを取得する。
 *
 * @param username - コースレコード取得対象のユーザー名。
 * @returns 取得対象ユーザー名付きのコースレコード取得結果。
 */
const fetchUserCourseRecordLoadState = async (
  username: string
): Promise<UserPageCourseRecordProfile> => ({
  username,
  records: await fetchUserCourseRecordsWithCache(username),
})

const UserPage: Component = () => {
  const params = useParams<{ username: string; page?: string; subPage?: string }>()
  const [searchParams] = useSearchParams()
  const [shouldFetchRecordProfile, setShouldFetchRecordProfile] = createSignal(false)
  const [courseRecordProfileUsername, setCourseRecordProfileUsername] = createSignal<string>()

  /** COURSEタブを一度開いたユーザー名を記録し、そのユーザーのページ内でリソースを保持する。 */
  createEffect(() => {
    if (resolveProfilePageQuery(params.page, searchParams.page) === 'record_course') {
      setCourseRecordProfileUsername(params.username)
    }
  })

  const [pageState] = createResource(() => params.username, fetchUserPageLoadState)
  const [recordProfile] = createResource(() => {
    const selectedPage = resolveProfilePageQuery(params.page, searchParams.page)
    return shouldFetchRecordProfile() ||
      selectedPage === 'record_normal' ||
      selectedPage === 'record_we' ||
      selectedPage === 'overpower'
      ? params.username
      : undefined
  }, fetchUserRecordLoadState)
  const [courseRecordProfile] = createResource(
    () => (courseRecordProfileUsername() === params.username ? params.username : undefined),
    fetchUserCourseRecordLoadState
  )

  const linkedRatingProfile = createMemo<UserPageRatingProfile | undefined>(() => {
    const state = pageState()
    if (
      state?.type !== 'loaded' ||
      !state.profile.player ||
      state.profile.username !== params.username
    ) {
      return undefined
    }

    return {
      username: state.profile.username,
      player: state.profile.player,
      rating: state.rating,
    }
  })

  const linkedRecordProfile = createMemo<UserPageRecordProfile | undefined>(() => {
    const state = pageState()
    const recordState = recordProfile()
    if (
      state?.type !== 'loaded' ||
      !state.profile.player ||
      !recordState ||
      state.profile.username !== params.username ||
      recordState.username !== state.profile.username
    ) {
      return undefined
    }

    return {
      username: state.profile.username,
      player: state.profile.player,
      record: recordState.record,
    }
  })

  const hasPlayerData = createMemo((): boolean => {
    const state = pageState()
    return state?.type === 'loaded' && Boolean(state.profile.player)
  })
  const pageLoadError = createMemo(() => {
    const state = pageState()
    if (state?.type === 'error') return state.error
    return recordProfile.error
  })

  useDocumentTitle(() => `${params.username}さんのページ`)

  return (
    <ErrorBoundary
      fallback={(err: Error) => (
        <Show when={isNotFoundApiError(err)} fallback={<LoadError error={err} />}>
          <NotFoundPage />
        </Show>
      )}
    >
      <Show when={pageState()?.type !== 'notFound'} fallback={<NotFoundPage />}>
        <Show
          when={!pageLoadError()}
          fallback={
            <Show
              when={isNotFoundApiError(pageLoadError())}
              fallback={<LoadError error={pageLoadError()} />}
            >
              <NotFoundPage />
            </Show>
          }
        >
          <Show when={pageState()?.type === 'loaded'} fallback={<Loading />}>
            <Show when={hasPlayerData()} fallback={<PlayerDataEmptyState />}>
              <Show when={linkedRatingProfile()} fallback={<Loading />}>
                {(linkedProfile) => (
                  <UserProfileView
                    profile={linkedProfile()}
                    recordProfile={linkedRecordProfile}
                    courseRecordProfile={courseRecordProfile}
                    onShowRecords={() => setShouldFetchRecordProfile(true)}
                    selectedPage={resolveProfilePageQuery(params.page, searchParams.page)}
                    selectedOverPowerSubPage={resolveOverPowerSubPage(params.subPage)}
                    username={params.username}
                  />
                )}
              </Show>
            </Show>
          </Show>
        </Show>
      </Show>
    </ErrorBoundary>
  )
}

export default UserPage
