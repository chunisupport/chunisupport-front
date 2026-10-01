import { TextField } from '@kobalte/core/text-field'
import { A, useNavigate, useSearchParams } from '@solidjs/router'
import { signOut } from 'firebase/auth'
import { createSignal, Show } from 'solid-js'

import { Loading } from '../../../components'
import { AuthenticationForm } from '../../../components/auth/AuthenticationForm'
import { LOGIN_PATH } from '../../../constants/routes'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import useRedirectIfAuthenticated from '../../../hooks/useRedirectIfAuthenticated'
import { auth } from '../../../lib/firebase'
import { clearAuthenticatedUser } from '../../../stores/authSession'
import type { UserDTO } from '../../../types/api'
import { isUnregisteredLoginError, normalizeRedirectParam } from '../../../usecases/auth/loginFlow'
import { loginWithPassword } from '../../../usecases/auth/loginWithPassword'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { redirectAfterAuthentication } from '../../../utils/postAuthRedirect'
import { STAFF_LOGIN_COPY, STAFF_LOGIN_INPUT_CLASS } from './constants'

/**
 * 公開導線を持たないメール・パスワード認証画面を表示する。
 *
 * @returns 一般ユーザー向け案内と事前登録アカウント用のログインフォーム。
 */
const StaffLogin = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectParam = () => normalizeRedirectParam(searchParams.redirect)
  const { isCheckingAuth } = useRedirectIfAuthenticated(redirectParam())
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')

  useDocumentTitle(STAFF_LOGIN_COPY.title)

  /**
   * 入力された認証情報でログインし、入力欄のパスワードを破棄する。
   *
   * @param token - Turnstileの応答トークン。
   * @returns APIで検証済みのユーザー情報。
   */
  const login = async (token: string): Promise<UserDTO> => {
    try {
      return await loginWithPassword(email(), password(), token)
    } finally {
      setPassword('')
    }
  }

  /**
   * ロールに制限を設けず、通常のログイン後遷移を実行する。
   *
   * @returns 遷移処理が完了した後に解決されるPromise。
   */
  const handleSuccess = async (): Promise<void> =>
    redirectAfterAuthentication(navigate, redirectParam())

  /**
   * ログイン失敗後のセッションを破棄し、登録画面へ遷移せずエラーを返す。
   *
   * @param error - Firebase認証またはAPIログインの失敗。
   * @returns フォーム付近に表示するエラーメッセージ。
   */
  const handleFailure = async (error: unknown): Promise<string> => {
    try {
      await signOut(auth)
    } catch {
      // Firebaseのログアウト失敗時も元のログインエラーを案内する。
    } finally {
      clearAuthenticatedUser()
    }
    if (isUnregisteredLoginError(error)) return STAFF_LOGIN_COPY.unregistered
    return toUserFriendlyErrorMessage(error, STAFF_LOGIN_COPY.error)
  }

  return (
    <main class="min-h-dvh flex justify-center px-4 py-10">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-semibold">{STAFF_LOGIN_COPY.title}</h1>
          <p class="mt-3 text-sm text-text-muted">{STAFF_LOGIN_COPY.notice}</p>
          <A href={LOGIN_PATH} class="mt-3 inline-block text-sm text-link underline">
            {STAFF_LOGIN_COPY.normalLogin}
          </A>
        </div>
        <Show when={!isCheckingAuth()} fallback={<Loading />}>
          <AuthenticationForm
            login={login}
            onSuccess={handleSuccess}
            onFailure={handleFailure}
            submitLabel={STAFF_LOGIN_COPY.submit}
            submittingLabel={STAFF_LOGIN_COPY.submitting}
            fallbackErrorMessage={STAFF_LOGIN_COPY.error}
          >
            <div class="mb-4 space-y-4">
              <TextField required value={email()} onChange={setEmail}>
                <TextField.Label for="email" class="mb-1 block text-sm">
                  {STAFF_LOGIN_COPY.email}
                </TextField.Label>
                <TextField.Input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="username"
                  class={STAFF_LOGIN_INPUT_CLASS}
                />
              </TextField>
              <TextField required value={password()} onChange={setPassword}>
                <TextField.Label for="current-password" class="mb-1 block text-sm">
                  {STAFF_LOGIN_COPY.password}
                </TextField.Label>
                <TextField.Input
                  id="current-password"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  class={STAFF_LOGIN_INPUT_CLASS}
                />
              </TextField>
            </div>
          </AuthenticationForm>
        </Show>
      </div>
    </main>
  )
}

export default StaffLogin
