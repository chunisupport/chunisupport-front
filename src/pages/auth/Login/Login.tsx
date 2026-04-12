import { A, useNavigate } from '@solidjs/router'
import { signInWithPopup } from 'firebase/auth'
import { createSignal } from 'solid-js'
import { fetchMe } from '../../../api/users'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import useRedirectIfAuthenticated from '../../../hooks/useRedirectIfAuthenticated'
import { auth, googleProvider } from '../../../lib/firebase'
import { redirectAfterAuthentication } from '../../../utils/postAuthRedirect'

const Login = () => {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)

  // すでにログインしている場合はユーザーページへリダイレクト
  const { isCheckingAuth } = useRedirectIfAuthenticated()

  // Google ログイン処理
  const handleGoogleLogin = async () => {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await signInWithPopup(auth, googleProvider)
      await fetchMe()
      await redirectAfterAuthentication(navigate)
    } catch (error) {
      const apiError = error as Error & { code?: string }
      if (apiError.code === 'user_not_found') {
        // バックエンドに未登録のFirebaseユーザーは新規登録画面へ
        navigate('/register')
        return
      }
      setErrorMessage(error instanceof Error ? error.message : 'Googleログインに失敗しました。')
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
              <p class="text-gray-600 mb-2">ChuniSupport</p>
              <h1 class="text-2xl font-semibold">ログイン</h1>
            </div>

            <div class="mb-6">
              {errorMessage() && <p class="text-sm text-red-600 mb-4">{errorMessage()}</p>}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting()}
                class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
              </button>
            </div>

            <div class="text-center">
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
