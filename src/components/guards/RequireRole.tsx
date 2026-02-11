import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createResource, Match, Show, Switch } from 'solid-js'
import { fetchMe } from '../../api/users'
import type { AccountType } from '../../types/api'

type RequireRoleProps = {
  allowedRoles: AccountType[]
  children: JSX.Element
}

const RequireRole = (props: RequireRoleProps) => {
  const [me] = createResource(fetchMe)

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

      <Match when={!me()}>
        <div class="mx-auto w-full max-w-3xl p-6 space-y-3">
          <h1 class="text-2xl font-semibold">ログインが必要です</h1>
          <p class="text-sm text-gray-600">このページを表示するにはログインしてください。</p>
          <A href="/login" class="text-blue-600 hover:underline">
            ログイン画面へ
          </A>
        </div>
      </Match>

      <Match when={!isAllowed()}>
        <div class="mx-auto w-full max-w-3xl p-6 space-y-3">
          <h1 class="text-2xl font-semibold">アクセス権限がありません</h1>
          <p class="text-sm text-gray-600">このページを表示する権限が不足しています。</p>
          <A href="/" class="text-blue-600 hover:underline">
            トップへ戻る
          </A>
        </div>
      </Match>

      <Match when={isAllowed()}>
        <Show when={props.children}>{props.children}</Show>
      </Match>
    </Switch>
  )
}

export default RequireRole
