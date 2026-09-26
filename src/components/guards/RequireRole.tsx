import { Navigate, useLocation } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { Match, onMount, Switch } from 'solid-js'
import { fetchMe } from '../../api/users'
import { t } from '../../i18n'
import { authSession } from '../../stores/authSession'
import type { AccountType } from '../../types/api'
import { buildLoginRedirectPath } from '../../usecases/auth/redirectPath'
import { resolveAuthSession } from '../../usecases/auth/resolveAuthSession'
import { buildCurrentPath } from '../../utils/currentPath'
import Loading from '../Loading/Loading'

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
        <Loading />
      </Match>

      <Match when={authSession.status === 'error'}>
        <div class="mx-auto w-full max-w-3xl p-6 text-sm text-text-muted">
          {t('common.authLoadFailed')}
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
