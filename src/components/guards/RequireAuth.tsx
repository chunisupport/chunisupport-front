import { Navigate, useLocation } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createSignal, Match, onMount, Switch } from 'solid-js'
import { fetchMe } from '../../api/users.ts'
import { getAuthStatus } from '../../stores/authSession.ts'
import { buildLoginRedirectPath } from '../../usecases/auth/redirectPath.ts'
import { resolveAuthSession } from '../../usecases/auth/resolveAuthSession.ts'
import { buildCurrentPath } from '../../utils/currentPath.ts'
import Loading from '../Loading/Loading.tsx'

type RequireAuthProps = {
  children: JSX.Element
}

const getInitialAuthStatus = (): 'checking' | 'authenticated' | 'unauthenticated' => {
  const authStatus = getAuthStatus()
  if (authStatus === 'authenticated' || authStatus === 'unauthenticated') {
    return authStatus
  }
  // 'unknown' および 'error' はいずれも再チェックを行う
  return 'checking'
}

const RequireAuth = (props: RequireAuthProps) => {
  const location = useLocation()
  const [authStatus, setAuthStatus] = createSignal<
    'checking' | 'authenticated' | 'unauthenticated' | 'error'
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

      <Match when={authStatus() === 'error'}>
        <div class="mx-auto w-full max-w-3xl p-6 text-sm text-text-muted">
          認証情報の取得に失敗しました。ページを再読み込みしてください。
        </div>
      </Match>

      <Match when={true}>
        <Navigate href={buildLoginRedirectPath(buildCurrentPath(location))} />
      </Match>
    </Switch>
  )
}

export default RequireAuth
