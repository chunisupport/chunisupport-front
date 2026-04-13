import { useParams, useSearchParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createResource, createSignal, ErrorBoundary, Show, Suspense } from 'solid-js'

import { fetchUserProfile } from '../../../api/users'
import { Loading, PlayerDataEmptyState } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { LinkedUserProfileWithRecordsDTO, UserProfileWithRecordsDTO } from '../../../types/api'
import { isRecordPageQuery, resolveProfilePageQuery } from './profilePageQuery'
import { UserProfileView } from './UserProfileView'
import { getUserProfileFetchOptions } from './userProfileFetchOptions'

const toLinkedProfile = (
  profile: UserProfileWithRecordsDTO | undefined
): LinkedUserProfileWithRecordsDTO | undefined => {
  if (!profile?.player || !profile.records) {
    return undefined
  }

  return profile as LinkedUserProfileWithRecordsDTO
}

const UserPage: Component = () => {
  const params = useParams<{ username: string; page?: string }>()
  const [searchParams] = useSearchParams()
  const [shouldFetchRecordProfile, setShouldFetchRecordProfile] = createSignal(false)

  const [userProfile] = createResource(
    () => params.username,
    (username) => fetchUserProfile(username, getUserProfileFetchOptions('rating'))
  )
  const [recordProfile] = createResource(
    () =>
      shouldFetchRecordProfile() || isRecordPageQuery(params.page, searchParams.page)
        ? params.username
        : undefined,
    (username) => fetchUserProfile(username, getUserProfileFetchOptions('record'))
  )

  useDocumentTitle(() => `${params.username}さんのページ`)

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err: Error) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={userProfile()}>
          {(profile) => (
            <Show when={toLinkedProfile(profile())} fallback={<PlayerDataEmptyState />}>
              {(linkedProfile) => (
                <UserProfileView
                  profile={linkedProfile()}
                  recordProfile={() => toLinkedProfile(recordProfile())}
                  onShowRecords={() => setShouldFetchRecordProfile(true)}
                  selectedPage={resolveProfilePageQuery(params.page, searchParams.page)}
                  username={params.username}
                />
              )}
            </Show>
          )}
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserPage
