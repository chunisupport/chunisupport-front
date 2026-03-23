import { useParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createEffect, createResource, createSignal, ErrorBoundary, Show, Suspense } from 'solid-js'

import { fetchUserProfile } from '../../../api/users'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { UserProfileView } from './UserProfileView'
import { userProfileFetchOptions } from './userProfileFetchOptions'

const UserPage: Component = () => {
  const params = useParams<{ username: string }>()
  const [recordProfileCache, setRecordProfileCache] = createSignal<Awaited<
    ReturnType<typeof fetchUserProfile>
  > | null>(null)
  const [shouldFetchRecordProfile, setShouldFetchRecordProfile] = createSignal(false)

  const [userProfile] = createResource(
    () => params.username,
    (username) =>
      fetchUserProfile(username, {
        ...userProfileFetchOptions,
        view: 'rating',
      })
  )
  const [recordProfile] = createResource(
    () => (shouldFetchRecordProfile() ? params.username : undefined),
    (username) => {
      const cachedProfile = recordProfileCache()
      if (cachedProfile?.username === username) {
        return cachedProfile
      }

      return fetchUserProfile(username, {
        ...userProfileFetchOptions,
      })
    }
  )

  createEffect(() => {
    const profile = recordProfile()
    if (profile) {
      setRecordProfileCache(profile)
    }
  })

  createEffect((previousUsername?: string) => {
    const username = params.username
    if (previousUsername && previousUsername !== username) {
      setRecordProfileCache(null)
    }
    return username
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
              onShowRecords={() => setShouldFetchRecordProfile(true)}
            />
          )}
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserPage
