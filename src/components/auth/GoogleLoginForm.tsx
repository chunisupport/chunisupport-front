import { createSignal, createUniqueId, Show } from 'solid-js'

import { CF_TURNSTILE_SITE_KEY } from '../../config'
import type { UserDTO } from '../../types/api'
import { loginWithGoogle } from '../../usecases/auth/loginWithGoogle'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { AppButton } from '../common/AppButton'
import { Turnstile } from '../Turnstile/Turnstile'
import {
  GOOGLE_LOGIN_BUTTON_LABEL,
  GOOGLE_LOGIN_ERROR_MESSAGE,
  GOOGLE_LOGIN_SUBMITTING_LABEL,
  TURNSTILE_ERROR_MESSAGE,
} from './googleLoginForm.constants'

export type GoogleLoginFormProps = {
  /**
   * バックエンドのログイン検証に成功した後のページ固有処理。
   *
   * @param user - APIが返したログイン済みユーザー情報。
   * @returns ページ固有処理の完了を待つPromise、または戻り値なし。
   */
  onSuccess: (user: UserDTO) => void | Promise<void>
  /**
   * Google認証、API検証、成功後処理の失敗に対するページ固有処理。
   *
   * @param error - ログインフローで発生した不明なエラー値。
   * @returns フォーム付近に表示する文言。遷移済みなど表示不要の場合はnull。
   */
  onFailure: (error: unknown) => string | null | Promise<string | null>
}

/**
 * TurnstileとGoogleポップアップ認証を共通化したログインフォームを表示する。
 *
 * @param props - ログイン成功・失敗後のページ固有コールバック。
 * @returns Googleログイン用のフォーム要素。
 */
export const GoogleLoginForm = (props: GoogleLoginFormProps) => {
  const formErrorId = createUniqueId()
  const [errorMessage, setErrorMessage] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [turnstileToken, setTurnstileToken] = createSignal('')
  const [turnstileResetKey, setTurnstileResetKey] = createSignal(0)

  /**
   * Turnstileの応答トークンを破棄し、ウィジェットの再検証を要求する。
   *
   * @returns なし。
   */
  const resetTurnstile = (): void => {
    setTurnstileToken('')
    setTurnstileResetKey((current) => current + 1)
  }

  /**
   * ログインフローの失敗をページ固有処理へ渡し、フォーム内エラーへ反映する。
   *
   * @param error - ログインフローで発生した不明なエラー値。
   * @returns 失敗処理の完了後に解決されるPromise。
   */
  const handleLoginFailure = async (error: unknown): Promise<void> => {
    try {
      const pageErrorMessage = await props.onFailure(error)
      setErrorMessage(pageErrorMessage ?? '')
    } catch (failureHandlerError) {
      setErrorMessage(toUserFriendlyErrorMessage(failureHandlerError, GOOGLE_LOGIN_ERROR_MESSAGE))
    }
  }

  /**
   * Googleログインを1回だけ送信し、成功・失敗を親ページへ通知する。
   *
   * @param event - ログインフォームの送信イベント。
   * @returns ログイン処理の完了後に解決されるPromise。
   */
  const handleSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault()
    const verifiedToken = turnstileToken()
    if (!verifiedToken || isSubmitting()) return

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const user = await loginWithGoogle(verifiedToken)
      await props.onSuccess(user)
    } catch (error) {
      resetTurnstile()
      await handleLoginFailure(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isSubmitting()}
      aria-describedby={errorMessage() ? formErrorId : undefined}
    >
      <Show when={errorMessage()}>
        <p id={formErrorId} class="mb-4 text-sm text-danger" aria-live="polite">
          {errorMessage()}
        </p>
      </Show>
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
      <AppButton
        type="submit"
        variant="surface"
        fullWidth
        disabled={isSubmitting() || !turnstileToken()}
        class="min-h-11 rounded-md shadow-sm"
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
        {isSubmitting() ? GOOGLE_LOGIN_SUBMITTING_LABEL : GOOGLE_LOGIN_BUTTON_LABEL}
      </AppButton>
    </form>
  )
}
