import { A, useNavigate, useSearchParams } from '@solidjs/router'
import { Loading } from '../../../components'
import { GoogleLoginForm } from '../../../components/auth/GoogleLoginForm'
import { REGISTER_PATH } from '../../../constants/routes'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import useRedirectIfAuthenticated from '../../../hooks/useRedirectIfAuthenticated'
import { isUnregisteredLoginError, normalizeRedirectParam } from '../../../usecases/auth/loginFlow'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { redirectAfterAuthentication } from '../../../utils/postAuthRedirect'

/**
 * Google認証を利用するログイン画面を表示する。
 *
 * @returns ログインフォームの JSX 要素。
 */
const Login = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectParam = () => normalizeRedirectParam(searchParams.redirect)

  // すでにログインしている場合はユーザーページへリダイレクト
  const { isCheckingAuth } = useRedirectIfAuthenticated(redirectParam())

  /**
   * Google認証成功後に既存のログイン後遷移を実行する。
   *
   * @returns ログイン後のユーザー確認と遷移が完了した後に解決されるPromise。
   */
  const handleLoginSuccess = async (): Promise<void> =>
    redirectAfterAuthentication(navigate, redirectParam())

  /**
   * 通常ログイン固有の失敗を処理し、フォームに表示する文言を返す。
   *
   * @param error - 共通ログインフォームから受け取った不明なエラー値。
   * @returns エラーメッセージ。新規登録画面へ遷移した場合はnull。
   */
  const handleLoginFailure = (error: unknown): string | null => {
    if (isUnregisteredLoginError(error)) {
      navigate(REGISTER_PATH)
      return null
    }

    return toUserFriendlyErrorMessage(error, 'Googleログインに失敗しました。')
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
              <GoogleLoginForm onSuccess={handleLoginSuccess} onFailure={handleLoginFailure} />
            </div>

            <div class="text-center">
              <p class="mb-5 text-sm text-text-muted">
                新規アカウント作成は
                <A href={REGISTER_PATH} class="text-link underline ml-1">
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
