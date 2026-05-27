import { useParams, useSearchParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, Show } from 'solid-js'

import { fetchUserProfileSummary, fetchUserRating, fetchUserRecord } from '../../../api/users'
import { LoadError, Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { PlayerDTO, UserRatingDTO, UserRecordDTO } from '../../../types/api'
import { isNotFoundApiError } from '../../../utils/apiError'
import NotFoundPage from '../../NotFoundPage'
import {
  isRecordPageQuery,
  resolveOverPowerSubPage,
  resolveProfilePageQuery,
} from './profilePageQuery'
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
      fetchUserRating(username),
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
  record: await fetchUserRecord(username, { includeNoPlay: true }),
})

const UserPage: Component = () => {
  const params = useParams<{ username: string; page?: string; subPage?: string }>()
  const [searchParams] = useSearchParams()
  const [shouldFetchRecordProfile, setShouldFetchRecordProfile] = createSignal(false)

  const [pageState] = createResource(() => params.username, fetchUserPageLoadState)
  const [recordProfile] = createResource(
    () =>
      shouldFetchRecordProfile() ||
      isRecordPageQuery(params.page, searchParams.page) ||
      resolveProfilePageQuery(params.page, searchParams.page) === 'overpower'
        ? params.username
        : undefined,
    fetchUserRecordLoadState
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
