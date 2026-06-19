import { Button } from '@kobalte/core/button'
import { A, useNavigate, useSearchParams } from '@solidjs/router'
import { signInWithPopup } from 'firebase/auth'
import { createSignal } from 'solid-js'
import { postLogin } from '../../../api/auth'
import { Loading, Turnstile } from '../../../components'
import { CF_TURNSTILE_SITE_KEY } from '../../../config'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import useRedirectIfAuthenticated from '../../../hooks/useRedirectIfAuthenticated'
import { auth, googleProvider } from '../../../lib/firebase'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { redirectAfterAuthentication } from '../../../utils/postAuthRedirect'

const TURNSTILE_ERROR_MESSAGE = '認証確認に失敗しました。しばらく待ってから再度お試しください。'

/**
 * URLクエリのredirect値を単一の文字列へ正規化する。
 *
 * @param redirect - Solid Router から取得したredirectクエリ値。
 * @returns 利用可能なredirect値。複数指定時は先頭を採用する。
 */
const normalizeRedirectParam = (redirect: string | string[] | undefined): string | undefined =>
  Array.isArray(redirect) ? redirect[0] : redirect

/**
 * Google認証直後のバックエンドログイン失敗が未登録ユーザー扱いか判定する。
 *
 * @param error - API呼び出しで発生したエラー。
 * @returns 新規登録画面へ進めるべき場合は true。
 */
const isUnregisteredLoginError = (error: Error & { code?: string }): boolean =>
  error.code === 'user_not_found' || error.code === 'invalid_token'

const Login = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [turnstileToken, setTurnstileToken] = createSignal('')
  const [turnstileResetKey, setTurnstileResetKey] = createSignal(0)
  const redirectParam = () => normalizeRedirectParam(searchParams.redirect)

  // すでにログインしている場合はユーザーページへリダイレクト
  const { isCheckingAuth } = useRedirectIfAuthenticated(redirectParam())

  /**
   * Turnstile の応答トークンを破棄し、ウィジェットの再検証を要求する。
   *
   * @returns なし。
   */
  const resetTurnstile = () => {
    setTurnstileToken('')
    setTurnstileResetKey((current) => current + 1)
  }

  /**
   * Google認証後にログイン後の遷移先へ移動する。
   *
   * @param event - ログインフォームの送信イベント。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleGoogleLogin = async (event: SubmitEvent) => {
    event.preventDefault()
    const verifiedToken = turnstileToken()
    if (!verifiedToken) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await signInWithPopup(auth, googleProvider)
      await postLogin({ turnstile_token: verifiedToken })
      await redirectAfterAuthentication(navigate, redirectParam())
    } catch (error) {
      resetTurnstile()
      const apiError = error as Error & { code?: string }
      if (isUnregisteredLoginError(apiError)) {
        // バックエンドに未登録のFirebaseユーザーは新規登録画面へ
        navigate('/register')
        return
      }
      setErrorMessage(toUserFriendlyErrorMessage(error, 'Googleログインに失敗しました。'))
    } finally {
      setIsSubmitting(false)
    }
  }

  useDocumentTitle('ログイン')

  return (
    <div class="min-h-screen flex justify-center px-4 py-10">
      <div class="w-full max-w-md">
        {isCheckingAuth() ? (
          <Loading />
        ) : (
          <>
            <div class="text-center mb-6">
              <p class="text-text-muted mb-2">ChuniSupport</p>
              <h1 class="text-2xl font-semibold">ログイン</h1>
            </div>

            <div class="mb-6">
              {errorMessage() && <p class="text-sm text-danger mb-4">{errorMessage()}</p>}
              <form onSubmit={handleGoogleLogin}>
                <Turnstile
                  siteKey={CF_TURNSTILE_SITE_KEY}
                  resetKey={turnstileResetKey()}
                  class="mb-4 flex justify-center"
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => {
                    setTurnstileToken('')
                    setErrorMessage(TURNSTILE_ERROR_MESSAGE)
                  }}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting() || !turnstileToken()}
                  class="flex w-full items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-text-muted shadow-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    class="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.2z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.9 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 42.9 14.8 48 24 48z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.8 28.8A14.4 14.4 0 0 1 10 24c0-1.7.3-3.3.8-4.8v-6.2H2.7A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.8l8.1-6z"
                    />
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.2 30.4 0 24 0 14.8 0 6.7 5.1 2.7 13.2l8.1 6.2C12.7 13.6 17.9 9.5 24 9.5z"
                    />
                  </svg>
                  {isSubmitting() ? '処理中...' : 'Googleでログイン'}
                </Button>
              </form>
            </div>

            <div class="text-center">
              <p class="mb-5 text-sm text-text-muted">
                新規アカウント作成は
                <A href="/register" class="text-link underline ml-1">
                  こちら
                </A>
              </p>
              <p class="text-sm text-text-muted">
                <A href="/" class="text-link underline ml-1">
                  トップページへ戻る
                </A>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Login
