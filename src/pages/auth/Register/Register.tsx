import { Checkbox } from '@kobalte/core/checkbox'
import { TextField } from '@kobalte/core/text-field'
import { A, useNavigate } from '@solidjs/router'
import { signInWithPopup } from 'firebase/auth'
import { Check, Dot, Loader, X } from 'lucide-solid'
import { Show, createEffect, createSignal } from 'solid-js'

import { postFirebaseRegister } from '../../../api/auth'
import AuthLoadingIndicator from '../../../components/AuthLoadingIndicator/AuthLoadingIndicator'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import useRedirectIfAuthenticated from '../../../hooks/useRedirectIfAuthenticated'
import { auth, googleProvider } from '../../../lib/firebase'
import { redirectAfterAuthentication } from '../../../utils/postAuthRedirect'

const Register = () => {
  const navigate = useNavigate()
  const [step, setStep] = createSignal<'google_auth' | 'fill_username'>('google_auth')
  const [idToken, setIdToken] = createSignal('')
  const [googleEmail, setGoogleEmail] = createSignal('')
  const [username, setUsername] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [agreedToTerms, setAgreedToTerms] = createSignal(false)

  // バリデーション用Signal
  const [isAlphanumeric, setIsAlphanumeric] = createSignal<boolean | null>(null)
  const [isValidLength, setIsValidLength] = createSignal<boolean | null>(null)
  const [hasUsernameTouched, setHasUsernameTouched] = createSignal(false)

  // ユーザー名のバリデーション
  createEffect(() => {
    const user = username()

    if (!user) {
      setIsAlphanumeric(null)
      setIsValidLength(null)
      return
    }

    // 条件1: 小文字英数字のみ
    const alnum = /^[a-z0-9]+$/.test(user)
    setIsAlphanumeric(alnum)

    // 条件2: 5〜50文字
    const len = user.length >= 5 && user.length <= 50
    setIsValidLength(len)
  })

  // すでにログインしている場合はユーザーページへリダイレクト
  const { isCheckingAuth } = useRedirectIfAuthenticated()

  // Step 1: Google認証してIDトークンを取得
  const handleGoogleAuth = async () => {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const token = await result.user.getIdToken()
      setIdToken(token)
      setGoogleEmail(result.user.email ?? '')
      setStep('fill_username')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Googleアカウントの認証に失敗しました。'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: ユーザー名を送信してアカウント作成
  const handleRegister = async () => {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await postFirebaseRegister(idToken(), username())
      await redirectAfterAuthentication(navigate)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '予期せぬエラーで登録に失敗しました。'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // バリデーション表示用コンポーネント
  const ValidationItem = (props: {
    status: boolean | null
    isChecking?: boolean
    text: string
  }) => {
    const getIcon = () => {
      if (props.isChecking) return <Loader class="inline w-4 h-4 animate-spin" />
      if (props.status === null) return <Dot class="inline w-4 h-4" />
      return props.status ? (
        <Check class="inline w-4 h-4 text-primary-600" />
      ) : (
        <X class="inline w-4 h-4 text-red-600" />
      )
    }
    const getColor = () => {
      if (props.isChecking) return 'text-gray-500'
      if (props.status === null) return 'text-gray-500'
      return props.status ? 'text-primary-600' : 'text-red-600'
    }
    return (
      <div class={`text-xs ${getColor()}`}>
        {getIcon()} {props.text}
      </div>
    )
  }

  const isUsernameValid = () => {
    return isAlphanumeric() === true && isValidLength() === true
  }

  useDocumentTitle('新規登録')

  return (
    <div class="min-h-screen flex justify-center px-4 py-10">
      <div class="w-full max-w-md">
        {isCheckingAuth() ? (
          <AuthLoadingIndicator />
        ) : (
          <>
            <div class="text-center mb-6">
              <p class="text-gray-600 mb-2">ChuniSupport</p>
              <h1 class="text-2xl font-semibold">新規登録</h1>
            </div>

            {/* 注意事項 */}
            <div class="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
              <p class="text-yellow-800 text-sm">
                スコアデータの登録には
                <span class="font-bold">ゲキチュウマイ-NET利用権</span>が必要です。
              </p>
            </div>

            {/* Step 1: Google認証 */}
            <Show when={step() === 'google_auth'}>
              <div class="mb-6 text-center">
                <p class="text-sm text-gray-600 mb-4">
                  Googleアカウントで新規登録します。
                </p>
                {errorMessage() && (
                  <div class="mb-4 p-3 bg-red-100 border border-red-400 rounded-md flex items-center text-left">
                    <X class="w-5 h-5 text-red-600 mr-2 shrink-0" />
                    <p class="text-sm text-red-700">{errorMessage()}</p>
                  </div>
                )}
                <button
                  type="button"
                  class="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                  onClick={handleGoogleAuth}
                  disabled={isSubmitting()}
                >
                  {isSubmitting() ? (
                    <Loader class="w-5 h-5 animate-spin" />
                  ) : (
                    <svg class="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  )}
                  <span class="text-sm font-medium text-gray-700">Googleで続ける</span>
                </button>
              </div>
            </Show>

            {/* Step 2: ユーザー名入力 */}
            <Show when={step() === 'fill_username'}>
              <div class="mb-6 text-left">
                <div class="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">
                  Googleアカウント: <span class="font-medium">{googleEmail()}</span>
                </div>
                <TextField
                  class="mb-2"
                  validationState={
                    !hasUsernameTouched() ? undefined : isUsernameValid() ? 'valid' : 'invalid'
                  }
                >
                  <TextField.Input
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 data-invalid:border-red-500"
                    placeholder="ユーザー名"
                    value={username()}
                    onInput={(event) => {
                      setUsername(event.currentTarget.value)
                      setHasUsernameTouched(true)
                    }}
                  />
                  <TextField.Description class="mt-1">
                    <ValidationItem status={isAlphanumeric()} text="小文字の英数字のみ" />
                    <ValidationItem status={isValidLength()} text="5文字〜50文字" />
                    <ValidationItem status={null} text="他ユーザーと重複しないもの" />
                  </TextField.Description>
                </TextField>
                {/* 利用規約 */}
                <Checkbox
                  class="flex items-center mb-3 mt-4"
                  checked={agreedToTerms()}
                  onChange={setAgreedToTerms}
                >
                  <Checkbox.Input class="sr-only" />
                  <Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-primary-600 data-checked:bg-primary-600 data-checked:text-white flex items-center justify-center">
                    <Checkbox.Indicator>
                      <Check class="h-4 w-4" />
                    </Checkbox.Indicator>
                  </Checkbox.Control>
                  <Checkbox.Label class="ml-2 text-gray-900 text-sm select-none">
                    <A href="/terms" class="text-primary-500 underline mr-1">
                      利用規約
                    </A>
                    に同意します
                  </Checkbox.Label>
                </Checkbox>
                {errorMessage() && (
                  <div class="mb-4 p-3 bg-red-100 border border-red-400 rounded-md flex items-center">
                    <X class="w-5 h-5 text-red-600 mr-2 shrink-0" />
                    <p class="text-sm text-red-700">{errorMessage()}</p>
                  </div>
                )}
                <div class="flex justify-center">
                  <button
                    type="button"
                    class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    onClick={handleRegister}
                    disabled={!(isUsernameValid() && agreedToTerms()) || isSubmitting()}
                  >
                    {isSubmitting() ? '処理中...' : '登録'}
                  </button>
                </div>
              </div>
            </Show>

            <div class="text-center">
              <p class="mb-5 text-sm text-gray-600">
                すでにアカウントをお持ちの方は
                <A href="/login" class="text-primary-500 underline ml-1">
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

export default Register
