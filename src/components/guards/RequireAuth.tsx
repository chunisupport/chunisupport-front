import { Navigate } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createSignal, Match, onMount, Switch } from 'solid-js'
import { fetchMe } from '../../api/users'
import { resolveAuthSession } from '../../usecases/auth/resolveAuthSession.ts'

type RequireAuthProps = {
  children: JSX.Element
}

const RequireAuth = (props: RequireAuthProps) => {
  const [authStatus, setAuthStatus] = createSignal<
    'checking' | 'authenticated' | 'unauthenticated'
  >('checking')

  onMount(async () => {
    const resolvedAuthStatus = await resolveAuthSession(() =>
      fetchMe({ redirectOnUnauthorized: false })
    )
    setAuthStatus(resolvedAuthStatus)
  })

  return (
    <Switch>
      <Match when={authStatus() === 'checking'}>
        <div class="mx-auto w-full max-w-3xl p-6 text-sm text-gray-600">認証状態を確認中...</div>
      </Match>

      <Match when={authStatus() === 'authenticated'}>{props.children}</Match>

      <Match when={true}>
        <Navigate href="/login" />
      </Match>
    </Switch>
  )
}

export default RequireAuth
