import { Navigate } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createSignal, Match, onMount, Switch } from 'solid-js'
import { fetchMe } from '../../api/users'
import {
  clearAuthenticatedUser,
  getAuthStatus,
  setAuthenticatedUser,
} from '../../stores/authSession'

type RequireAuthProps = {
  children: JSX.Element
}

const RequireAuth = (props: RequireAuthProps) => {
  const [isChecking, setIsChecking] = createSignal(getAuthStatus() === 'unknown')
  const [isAuthenticated, setIsAuthenticated] = createSignal(getAuthStatus() === 'authenticated')

  onMount(async () => {
    if (getAuthStatus() === 'authenticated') {
      setIsAuthenticated(true)
      setIsChecking(false)
      return
    }

    if (getAuthStatus() === 'unauthenticated') {
      setIsAuthenticated(false)
      setIsChecking(false)
      return
    }

    try {
      const user = await fetchMe({ redirectOnUnauthorized: false })
      setAuthenticatedUser(user)
      setIsAuthenticated(true)
    } catch {
      clearAuthenticatedUser()
      setIsAuthenticated(false)
    } finally {
      setIsChecking(false)
    }
  })

  return (
    <Switch>
      <Match when={isChecking()}>
        <div class="mx-auto w-full max-w-3xl p-6 text-sm text-gray-600">認証状態を確認中...</div>
      </Match>

      <Match when={isAuthenticated()}>{props.children}</Match>

      <Match when={true}>
        <Navigate href="/login" />
      </Match>
    </Switch>
  )
}

export default RequireAuth
