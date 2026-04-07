import { Navigate } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createSignal, Match, onMount, Switch } from 'solid-js'
import { fetchMe } from '../../api/users'
import { getAuthStatus } from '../../stores/authSession.ts'
import { resolveAuthSession } from '../../usecases/auth/resolveAuthSession.ts'
import Loading from '../Loading/Loading'

type RequireAuthProps = {
  children: JSX.Element
}

const getInitialAuthStatus = (): 'checking' | 'authenticated' | 'unauthenticated' => {
  const authStatus = getAuthStatus()
  if (authStatus === 'authenticated' || authStatus === 'unauthenticated') {
    return authStatus
  }

  return 'checking'
}

const RequireAuth = (props: RequireAuthProps) => {
  const [authStatus, setAuthStatus] = createSignal<
    'checking' | 'authenticated' | 'unauthenticated'
  >(getInitialAuthStatus())

  onMount(async () => {
    if (authStatus() !== 'checking') {
      return
    }

    const resolvedAuthStatus = await resolveAuthSession(() =>
      fetchMe({ redirectOnUnauthorized: false })
    )
    setAuthStatus(resolvedAuthStatus)
  })

  return (
    <Switch>
      <Match when={authStatus() === 'checking'}>
        <Loading />
      </Match>

      <Match when={authStatus() === 'authenticated'}>{props.children}</Match>

      <Match when={true}>
        <Navigate href="/login" />
      </Match>
    </Switch>
  )
}

export default RequireAuth
