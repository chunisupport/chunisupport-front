import { Navigate, useLocation } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { Match, onMount, Switch } from 'solid-js'
import { fetchMe } from '../../api/users.ts'
import { authSession } from '../../stores/authSession.ts'
import type { AccountType } from '../../types/api.ts'
import { buildLoginRedirectPath } from '../../usecases/auth/redirectPath.ts'
import { resolveAuthSession } from '../../usecases/auth/resolveAuthSession.ts'
import { buildCurrentPath } from '../../utils/currentPath.ts'

type RequireRoleProps = {
  allowedRoles: AccountType[]
  children: JSX.Element
}

const RequireRole = (props: RequireRoleProps) => {
  const location = useLocation()
  // resolveAuthSession 内で重複フェッチが排除されるため、RequireAuth と同時にマウントされても API 呼び出しは1回のみ
  onMount(() => {
    resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }))
  })

  const isAllowed = () => {
    if (authSession.status === 'unknown') return false
    const accountType = authSession.user?.account_type
    if (!accountType) return false
    return props.allowedRoles.includes(accountType)
  }

  return (
    <Switch>
      <Match when={authSession.status === 'unknown'}>
        <div class="mx-auto w-full max-w-3xl p-6 text-sm text-text-muted">認証情報を確認中...</div>
      </Match>

      <Match when={authSession.status === 'error'}>
        <div class="mx-auto w-full max-w-3xl p-6 text-sm text-text-muted">
          認証情報の取得に失敗しました。ページを再読み込みしてください。
        </div>
      </Match>

      <Match when={isAllowed()}>{props.children}</Match>

      <Match when={authSession.status === 'unauthenticated'}>
        <Navigate href={buildLoginRedirectPath(buildCurrentPath(location))} />
      </Match>

      <Match when={true}>
        <Navigate href="/403" />
      </Match>
    </Switch>
  )
}

export default RequireRole
