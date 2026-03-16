import { useParams } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createResource, ErrorBoundary, Show, Suspense } from 'solid-js'

import { fetchUserProfile } from '../../../api/users'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { UserProfileView } from './UserProfileView'

const UserPage: Component = () => {
  const params = useParams<{ username: string }>()

  const [userProfile] = createResource(() => params.username, (username) => fetchUserProfile(username))

  useDocumentTitle(() => `${params.username}さんのページ`)

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={userProfile()}>{(profile) => <UserProfileView profile={profile()} />}</Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserPage
