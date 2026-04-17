import { useParams, useSearchParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, Show, Suspense } from 'solid-js'

import { fetchUserProfileSummary, fetchUserRating, fetchUserRecord } from '../../../api/users'
import { Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { PlayerDTO, UserRatingDTO, UserRecordDTO } from '../../../types/api'
import { isRecordPageQuery, resolveProfilePageQuery } from './profilePageQuery'
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

const UserPage: Component = () => {
  const params = useParams<{ username: string; page?: string }>()
  const [searchParams] = useSearchParams()
  const [shouldFetchRecordProfile, setShouldFetchRecordProfile] = createSignal(false)

  const [profileSummary] = createResource(() => params.username, fetchUserProfileSummary)
  const [ratingProfile] = createResource(() => params.username, fetchUserRating)
  const [recordProfile] = createResource(
    () =>
      shouldFetchRecordProfile() || isRecordPageQuery(params.page, searchParams.page)
        ? params.username
        : undefined,
    (username) => fetchUserRecord(username, { includeNoPlay: true })
  )

  const linkedRatingProfile = createMemo<UserPageRatingProfile | undefined>(() => {
    const profile = profileSummary()
    const rating = ratingProfile()
    if (!profile?.player || !rating) {
      return undefined
    }

    return {
      username: profile.username,
      player: profile.player,
      rating,
    }
  })

  const linkedRecordProfile = createMemo<UserPageRecordProfile | undefined>(() => {
    const profile = profileSummary()
    const record = recordProfile()
    if (!profile?.player || !record) {
      return undefined
    }

    return {
      username: profile.username,
      player: profile.player,
      record,
    }
  })

  const hasPlayerData = createMemo((): boolean => {
    const profile = profileSummary()
    return Boolean(profile?.player)
  })

  useDocumentTitle(() => `${params.username}さんのページ`)

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err: Error) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={profileSummary() && ratingProfile()}>
          <Show when={hasPlayerData()} fallback={<PlayerDataEmptyState />}>
            <Show when={linkedRatingProfile()}>
              {(linkedProfile) => (
                <UserProfileView
                  profile={linkedProfile()}
                  recordProfile={linkedRecordProfile}
                  onShowRecords={() => setShouldFetchRecordProfile(true)}
                  selectedPage={resolveProfilePageQuery(params.page, searchParams.page)}
                  username={params.username}
                />
              )}
            </Show>
          </Show>
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserPage
