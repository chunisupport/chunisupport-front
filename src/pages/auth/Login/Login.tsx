import { TextField } from '@kobalte/core/text-field'
import { A, useNavigate } from '@solidjs/router'
import { createSignal } from 'solid-js'

import { postLogin } from '../../../api/auth'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { redirectAfterAuthentication } from '../../../utils/postAuthRedirect'
import useRedirectIfAuthenticated from '../../../hooks/useRedirectIfAuthenticated'

const Login = () => {
  const navigate = useNavigate()
  const [username, setUsername] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)

  // すでにログインしている場合はユーザーページへリダイレクト
  const { isCheckingAuth } = useRedirectIfAuthenticated()

  // ログイン処理
  const handleLogin = async () => {
    if (!username() || !password()) {
      setErrorMessage('ユーザー名とパスワードを入力してください。')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await postLogin({ username: username(), password: password() })
      await redirectAfterAuthentication(navigate)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ログインに失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  useDocumentTitle('ログイン')

  return (
    <div class="min-h-screen flex justify-center px-4 py-10">
      <div class="w-full max-w-md">
        {isCheckingAuth() ? (
          <div class="text-center text-sm text-gray-600">認証状態を確認中...</div>
        ) : (
          <>
            <div class="text-center mb-6">
              <p class="text-gray-600 mb-2">ChuniSupport</p>
              <h1 class="text-2xl font-semibold">ログイン</h1>
            </div>

            <div class="mb-6 text-center">
              <TextField>
                <TextField.Input
                  class="mb-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ユーザー名"
                  value={username()}
                  onInput={(event) => setUsername(event.currentTarget.value)}
                />
                <TextField.Input
                  class="mb-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="パスワード"
                  type="password"
                  value={password()}
                  onInput={(event) => setPassword(event.currentTarget.value)}
                />
              </TextField>
              {errorMessage() && <p class="text-sm text-red-600 mb-2">{errorMessage()}</p>}
              <button
                type="button"
                class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                onClick={handleLogin}
                disabled={isSubmitting()}
              >
                {isSubmitting() ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>

            <div class="text-center">
              <p class="mb-3 text-sm text-gray-600">
                パスワードを忘れた場合は
                <A href="/recovery" class="text-primary-500 underline ml-1">
                  こちら
                </A>
              </p>
              <p class="mb-5 text-sm text-gray-600">
                新規アカウント作成は
                <A href="/register" class="text-primary-500 underline ml-1">
                  こちら
                </A>
              </p>
              <p class="text-sm text-gray-600">
                <A href="/" class="text-primary-500 underline ml-1">
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
