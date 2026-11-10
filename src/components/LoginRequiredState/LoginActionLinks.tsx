import { A, useLocation } from '@solidjs/router'
import { LogIn, UserPlus } from 'lucide-solid'
import type { Component } from 'solid-js'
import { REGISTER_PATH } from '../../constants/routes'
import { buildLoginRedirectPath } from '../../usecases/auth/redirectPath'
import { buildCurrentPath } from '../../utils/currentPath'
import { type AppButtonSize, getAppButtonClass } from '../common/AppButton'
import { LOGIN_REQUIRED_STATE_TEXT } from './constants'

/**
 * ログイン後に現在のページへ戻るログイン導線と、新規登録導線を表示する。
 *
 * @param props.size - ボタンの大きさ。
 * @returns ログイン・新規登録リンク。
 */
const LoginActionLinks: Component<{ size?: AppButtonSize }> = (props) => {
  const location = useLocation()

  return (
    <div class="flex flex-wrap items-center gap-2">
      <A
        href={buildLoginRedirectPath(buildCurrentPath(location))}
        class={getAppButtonClass({ variant: 'surface', size: props.size })}
      >
        <LogIn class="h-4 w-4" aria-hidden="true" />
        {LOGIN_REQUIRED_STATE_TEXT.loginLink}
      </A>
      <A href={REGISTER_PATH} class={getAppButtonClass({ variant: 'primary', size: props.size })}>
        <UserPlus class="h-4 w-4" aria-hidden="true" />
        {LOGIN_REQUIRED_STATE_TEXT.registerLink}
      </A>
    </div>
  )
}

export default LoginActionLinks
