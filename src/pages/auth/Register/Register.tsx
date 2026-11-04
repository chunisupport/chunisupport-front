import { TextField } from '@kobalte/core/text-field'
import { A, useNavigate } from '@solidjs/router'
import { signInWithPopup, signOut, type User } from 'firebase/auth'
import { Check, Dot, Loader, X } from 'lucide-solid'
import { createEffect, createSignal, For, onMount, Show } from 'solid-js'

import { postSignup } from '../../../api/auth'
import { fetchMe } from '../../../api/users'
import { Loading, Turnstile } from '../../../components'
import { AuthProviderIcon } from '../../../components/auth/AuthProviderIcon'
import { AppButton } from '../../../components/common/AppButton'
import { CheckboxField } from '../../../components/common/CheckboxField'
import { CF_TURNSTILE_SITE_KEY } from '../../../config'
import { AUTH_PROVIDERS, type AuthProviderKind } from '../../../constants/authProviders'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import useRedirectIfAuthenticated from '../../../hooks/useRedirectIfAuthenticated'
import { auth, createAuthProvider } from '../../../lib/firebase'
import { clearAuthenticatedUser } from '../../../stores/authSession'
import {
  type AuthAccountSummary,
  resolveAuthAccountSummary,
} from '../../../usecases/auth/authProviders'
import { resolveRegistrationEligibility } from '../../../usecases/auth/registrationEligibility'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { redirectAfterAuthentication } from '../../../utils/postAuthRedirect'
import {
  authAccountHeading,
  PRIVACY_POLICY_URL,
  PROVIDER_AUTH_ERROR_MESSAGE,
  providerContinueButtonLabel,
  REGISTERED_ACCOUNT_MESSAGE,
  TERMS_URL,
  TURNSTILE_ERROR_MESSAGE,
  TURNSTILE_REQUIRED_MESSAGE,
  USERNAME_FORBIDDEN_WORD_REQUIREMENT,
} from './constants'

/**
 * Google・X認証を利用する新規登録画面を表示する。
 *
 * @returns 新規登録画面。
 */
const Register = () => {
  const navigate = useNavigate()
  const [step, setStep] = createSignal<'provider_auth' | 'fill_username'>('provider_auth')
  const [authAccount, setAuthAccount] = createSignal<AuthAccountSummary>()
  const [authenticatingProvider, setAuthenticatingProvider] = createSignal<AuthProviderKind>()
  const [username, setUsername] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [agreedToTerms, setAgreedToTerms] = createSignal(false)
  const [turnstileToken, setTurnstileToken] = createSignal('')
  const [turnstileResetKey, setTurnstileResetKey] = createSignal(0)

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

  /**
   * 認証済みのFirebaseユーザーを表示し、ユーザー名入力へ進める。
   *
   * @param user - 認証済みのFirebaseユーザー。
   * @returns なし。
   */
  const showUsernameStep = (user: User) => {
    setAuthAccount(resolveAuthAccountSummary(user.providerData))
    setStep('fill_username')
  }

  /**
   * Turnstile の応答トークンを破棄し、ウィジェットの再検証を要求する。
   *
   * @returns なし。
   */
  const resetTurnstile = () => {
    setTurnstileToken('')
    setTurnstileResetKey((current) => current + 1)
  }

  // Firebaseに既にサインイン済みの場合はStep 2へスキップ（ログインページからのリダイレクト時）
  onMount(async () => {
    await auth.authStateReady()
    const firebaseUser = auth.currentUser
    if (firebaseUser) showUsernameStep(firebaseUser)
  })

  /**
   * Step 1: 認証プロバイダで認証後、既存アカウントでなければユーザー名入力へ進める。
   *
   * @param kind - 認証に使う認証プロバイダの種類。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleProviderAuth = async (kind: AuthProviderKind) => {
    setIsSubmitting(true)
    setAuthenticatingProvider(kind)
    setErrorMessage('')
    try {
      const result = await signInWithPopup(auth, createAuthProvider(kind))
      const registrationEligibility = await resolveRegistrationEligibility(() =>
        fetchMe({ redirectOnUnauthorized: false })
      )
      if (registrationEligibility === 'registered') {
        await signOut(auth)
        clearAuthenticatedUser()
        setErrorMessage(REGISTERED_ACCOUNT_MESSAGE)
        return
      }

      showUsernameStep(result.user)
    } catch (error) {
      setErrorMessage(toUserFriendlyErrorMessage(error, PROVIDER_AUTH_ERROR_MESSAGE))
    } finally {
      setIsSubmitting(false)
      setAuthenticatingProvider(undefined)
    }
  }

  /**
   * 入力されたユーザー名でアカウントを作成し、登録後の遷移先へ移動する。
   *
   * @param event - 登録フォームの送信イベント。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleRegister = async (event: SubmitEvent) => {
    event.preventDefault()
    const verifiedToken = turnstileToken()
    if (!verifiedToken) {
      setErrorMessage(TURNSTILE_REQUIRED_MESSAGE)
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await postSignup({ username: username(), turnstile_token: verifiedToken })
      await redirectAfterAuthentication(navigate)
    } catch (error) {
      resetTurnstile()
      setErrorMessage(toUserFriendlyErrorMessage(error, '予期せぬエラーで登録に失敗しました。'))
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
        <Check class="inline w-4 h-4 text-action-primary" />
      ) : (
        <X class="inline w-4 h-4 text-danger" />
      )
    }
    const getColor = () => {
      if (props.isChecking) return 'text-text-subtle'
      if (props.status === null) return 'text-text-subtle'
      return props.status ? 'text-action-primary' : 'text-danger'
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
          <Loading />
        ) : (
          <>
            <div class="text-center mb-6">
              <p class="text-text-muted mb-2">ChuniSupport</p>
              <h1 class="text-2xl font-semibold">新規登録</h1>
            </div>

            {/* 注意事項 */}
            <div class="mb-6 p-4 bg-warning-bg border border-warning-border rounded-md">
              <p class="text-warning text-sm">
                スコアデータの登録には
                <span class="font-bold">ゲキチュウマイ-NET利用権</span>が必要です。
              </p>
            </div>

            {/* Step 1: 認証プロバイダで認証 */}
            <Show when={step() === 'provider_auth'}>
              <div class="mb-6 text-center">
                {errorMessage() && (
                  <div class="mb-4 p-3 bg-danger-bg border border-danger-border rounded-md flex items-center text-left">
                    <X class="w-5 h-5 text-danger mr-2 shrink-0" />
                    <p class="text-sm text-danger">{errorMessage()}</p>
                  </div>
                )}
                <div class="space-y-3">
                  <For each={AUTH_PROVIDERS}>
                    {(provider) => (
                      <AppButton
                        variant="surface"
                        fullWidth
                        class="gap-3 rounded-md"
                        onClick={() => handleProviderAuth(provider.kind)}
                        disabled={isSubmitting()}
                      >
                        {authenticatingProvider() === provider.kind ? (
                          <Loader class="w-5 h-5 animate-spin" />
                        ) : (
                          <AuthProviderIcon kind={provider.kind} />
                        )}
                        <span class="text-sm font-medium text-text-muted">
                          {providerContinueButtonLabel(provider.label)}
                        </span>
                      </AppButton>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Step 2: ユーザー名入力 */}
            <Show when={step() === 'fill_username'}>
              <div class="mb-6 text-left">
                <Show when={authAccount()}>
                  {(account) => (
                    <div class="mb-4 flex items-center gap-2 p-3 bg-surface-hover border border-border-strong rounded-md text-sm text-text-muted">
                      <AuthProviderIcon kind={account().kind} class="shrink-0" />
                      <span class="shrink-0">{authAccountHeading(account().label)}</span>
                      <span class="min-w-0 break-all font-sans font-medium">{account().name}</span>
                    </div>
                  )}
                </Show>
                <TextField
                  class="mb-2"
                  validationState={
                    !hasUsernameTouched() ? undefined : isUsernameValid() ? 'valid' : 'invalid'
                  }
                >
                  <TextField.Input
                    class="w-full px-3 py-2 border border-border-strong rounded-md focus:outline-none focus:ring-2 focus:ring-focus-ring data-invalid:border-danger-border"
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
                    <ValidationItem status={null} text={USERNAME_FORBIDDEN_WORD_REQUIREMENT} />
                  </TextField.Description>
                </TextField>
                {/* 利用規約 */}
                <CheckboxField
                  class="relative mt-4 mb-3 flex items-center"
                  inputClass="sr-only"
                  checked={agreedToTerms()}
                  onChange={setAgreedToTerms}
                  labelClass="ml-2 text-text text-sm select-none"
                  label={
                    <>
                      <a
                        href={TERMS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-link underline"
                      >
                        利用規約
                      </a>
                      と
                      <a
                        href={PRIVACY_POLICY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-link underline"
                      >
                        プライバシーポリシー
                      </a>
                      に同意します
                    </>
                  }
                />
                {errorMessage() && (
                  <div class="mb-4 p-3 bg-danger-bg border border-danger-border rounded-md flex items-center">
                    <X class="w-5 h-5 text-danger mr-2 shrink-0" />
                    <p class="text-sm text-danger">{errorMessage()}</p>
                  </div>
                )}
                <form onSubmit={handleRegister}>
                  <Turnstile
                    siteKey={CF_TURNSTILE_SITE_KEY}
                    action="signup"
                    resetKey={turnstileResetKey()}
                    class="mb-4 flex justify-center"
                    onVerify={setTurnstileToken}
                    onExpire={() => setTurnstileToken('')}
                    onError={() => {
                      setTurnstileToken('')
                      setErrorMessage(TURNSTILE_ERROR_MESSAGE)
                    }}
                  />
                  <div class="flex justify-center">
                    <AppButton
                      type="submit"
                      variant="primary"
                      class="rounded-md"
                      disabled={!(isUsernameValid() && agreedToTerms()) || isSubmitting()}
                    >
                      {isSubmitting() ? '処理中...' : '登録'}
                    </AppButton>
                  </div>
                </form>
              </div>
            </Show>

            <div class="text-center">
              <p class="mb-5 text-sm text-text-muted">
                すでにアカウントをお持ちの方は
                <A href="/login" class="text-link underline ml-1">
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

export default Register
