import { Navigate } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createResource, Match, Switch } from 'solid-js'
import { fetchMe } from '../../api/users'
import type { AccountType } from '../../types/api'

type RequireRoleProps = {
  allowedRoles: AccountType[]
  children: JSX.Element
}

const RequireRole = (props: RequireRoleProps) => {
  const [me] = createResource(async () => {
    try {
      return await fetchMe()
    } catch {
      return null
    }
  })

  const isAllowed = () => {
    const accountType = me()?.account_type
    if (!accountType) return false
    return props.allowedRoles.includes(accountType)
  }

  return (
    <Switch>
      <Match when={me.loading}>
        <div class="mx-auto w-full max-w-3xl p-6 text-sm text-gray-600">認証情報を確認中...</div>
      </Match>

      <Match when={isAllowed()}>
        {props.children}
      </Match>

      <Match when={true}>
        <Navigate href="/403" />
      </Match>
    </Switch>
  )
}

export default RequireRole
