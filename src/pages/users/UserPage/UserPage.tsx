import { useLocation, useNavigate, useParams, useSearchParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createEffect, createResource, createSignal, ErrorBoundary, Show, Suspense } from 'solid-js'

import { fetchUserProfile } from '../../../api/users'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import {
  buildUserProfilePagePath,
  isRecordPageQuery,
  resolveProfilePageQuery,
} from './profilePageQuery'
import { UserProfileView } from './UserProfileView'
import { getUserProfileFetchOptions } from './userProfileFetchOptions'

const UserPage: Component = () => {
  const params = useParams<{ username: string; page?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
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

  createEffect(() => {
    const resolvedPage = resolveProfilePageQuery(params.page, searchParams.page)
    const currentPath = buildUserProfilePagePath(params.username, resolvedPage)

    if (location.pathname === currentPath && !searchParams.page) {
      return
    }

    navigate(currentPath, { replace: true })
  })

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={userProfile()}>
          {(profile) => (
            <UserProfileView
              profile={profile()}
              recordProfile={recordProfile}
              onShowRecords={() => setShouldFetchRecordProfile(true)}
              selectedPage={resolveProfilePageQuery(params.page, searchParams.page)}
              username={params.username}
            />
          )}
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserPage
