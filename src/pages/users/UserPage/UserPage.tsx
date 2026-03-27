import { useParams, useSearchParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createEffect, createResource, createSignal, ErrorBoundary, Show, Suspense } from 'solid-js'

import { fetchUserProfile } from '../../../api/users'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { UserProfileView } from './UserProfileView'
import { getUserProfileFetchOptions } from './userProfileFetchOptions'
import { normalizeUserProfileTab } from './userProfileTab'

const UserPage: Component = () => {
  const params = useParams<{ username: string }>()
  const [searchParams, setSearchParams] = useSearchParams<{ tab?: string }>()
  const [shouldFetchRecordProfile, setShouldFetchRecordProfile] = createSignal(false)

  const selectedTab = () => normalizeUserProfileTab(searchParams.tab)

  const [userProfile] = createResource(
    () => params.username,
    (username) => fetchUserProfile(username, getUserProfileFetchOptions('rating'))
  )
  const [recordProfile] = createResource(
    () => (shouldFetchRecordProfile() ? params.username : undefined),
    (username) => fetchUserProfile(username, getUserProfileFetchOptions('record'))
  )

  createEffect(() => {
    const normalizedTab = selectedTab()

    if (searchParams.tab !== normalizedTab) {
      setSearchParams({ tab: normalizedTab }, { replace: true })
    }

    if (normalizedTab === 'record' || normalizedTab === 'record_we') {
      setShouldFetchRecordProfile(true)
    }
  })

  useDocumentTitle(() => `${params.username}さんのページ`)

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={userProfile()}>
          {(profile) => (
            <UserProfileView
              profile={profile()}
              recordProfile={recordProfile}
              selectedTab={selectedTab()}
              onTabChange={(tab) => setSearchParams({ tab })}
              onShowRecords={() => setShouldFetchRecordProfile(true)}
            />
          )}
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserPage
