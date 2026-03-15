import { Navigate } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createResource, Match, Switch } from 'solid-js'
import { fetchMe } from '../../api/users'

type RequireAuthProps = {
  children: JSX.Element
}

const RequireAuth = (props: RequireAuthProps) => {
  const [me] = createResource(async () => {
    try {
      return await fetchMe()
    } catch {
      return null
    }
  })

  return (
    <Switch>
      <Match when={me.loading}>
        <div class="mx-auto w-full max-w-3xl p-6 text-sm text-gray-600">認証状態を確認中...</div>
      </Match>

      <Match when={me()}>{props.children}</Match>

      <Match when={true}>
        <Navigate href="/login" />
      </Match>
    </Switch>
  )
}

export default RequireAuth
