import { useParams, useSearchParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createEffect, createResource, createSignal, ErrorBoundary, Show, Suspense } from 'solid-js'

import { fetchUserProfile } from '../../../api/users'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { UserProfileView } from './UserProfileView'
import { userProfileFetchOptions } from './userProfileFetchOptions'
import { shouldFetchRecordProfile } from './userProfileViewState'

const UserPage: Component = () => {
  const params = useParams<{ username: string }>()
  const [searchParams] = useSearchParams()
  const [recordProfileCache, setRecordProfileCache] = createSignal<Awaited<
    ReturnType<typeof fetchUserProfile>
  > | null>(null)

  const [userProfile] = createResource(
    () => params.username,
    (username) => fetchUserProfile(username, userProfileFetchOptions)
  )
  const [recordProfile] = createResource(
    () => (shouldFetchRecordProfile(searchParams.view) ? params.username : undefined),
    async (username) => {
      const cachedProfile = recordProfileCache()
      if (cachedProfile?.username === username) {
        return cachedProfile
      }

      const profile = await fetchUserProfile(username, {
        ...userProfileFetchOptions,
        view: 'record',
      })
      setRecordProfileCache(profile)
      return profile
    }
  )

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
              recordProfile={recordProfile() ?? recordProfileCache()}
            />
          )}
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserPage
