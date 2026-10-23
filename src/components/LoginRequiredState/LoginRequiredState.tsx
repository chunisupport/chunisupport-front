import { LogIn } from 'lucide-solid'
import type { Component } from 'solid-js'
import { LOGIN_REQUIRED_STATE_TEXT } from './constants'
import LoginActionLinks from './LoginActionLinks'

/**
 * 未ログイン時に、ログインまたは新規登録を案内する。
 *
 * @returns 未ログイン時の案内コンポーネント。
 */
const LoginRequiredState: Component = () => (
  <section class="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-12">
    <div class="flex w-full flex-col items-center rounded-2xl border border-action-primary-border bg-gradient-to-br from-surface to-action-primary-muted p-8 text-center shadow-sm">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-action-primary-border bg-action-primary-muted text-action-primary shadow-sm">
        <LogIn class="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 class="text-2xl font-semibold text-text">{LOGIN_REQUIRED_STATE_TEXT.title}</h1>
      <p class="mt-3 text-sm leading-7 text-text-muted">{LOGIN_REQUIRED_STATE_TEXT.message}</p>
      <div class="mt-6">
        <LoginActionLinks />
      </div>
    </div>
  </section>
)

export default LoginRequiredState
