import type { JSX } from 'solid-js'
import { createSignal, createUniqueId, Show } from 'solid-js'

import { CF_TURNSTILE_SITE_KEY } from '../../config'
import type { UserDTO } from '../../types/api'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { AppButton } from '../common/AppButton'
import { Turnstile } from '../Turnstile/Turnstile'
import { TURNSTILE_ERROR_MESSAGE } from './googleLoginForm.constants'

/** 認証方法固有の処理・入力欄と、ログイン結果の通知先を指定する。 */
export type AuthenticationFormProps = {
  /**
   * Firebase認証とAPIログインを実行する。
   *
   * @param turnstileToken - Cloudflare Turnstileの応答トークン。
   * @returns バックエンドで検証済みのユーザー情報。
   */
  login: (turnstileToken: string) => Promise<UserDTO>
  /** 送信ボタンの文言 */
  submitLabel: string
  /** 処理中の送信ボタンの文言 */
  submittingLabel: string
  /** 失敗処理でエラーが発生した場合の文言 */
  fallbackErrorMessage: string
  /** 送信ボタンのアイコン */
  icon?: JSX.Element
  /** 認証方法固有の入力欄 */
  children?: JSX.Element
  /**
   * バックエンドのログイン検証に成功した後のページ固有処理。
   *
   * @param user - APIが返したログイン済みユーザー情報。
   * @returns ページ固有処理の完了を待つPromise、または戻り値なし。
   */
  onSuccess: (user: UserDTO) => void | Promise<void>
  /**
   * Firebase認証、API検証、成功後処理の失敗に対するページ固有処理。
   *
   * @param error - ログインフローで発生した不明なエラー値。
   * @returns フォーム付近に表示する文言。遷移済みなど表示不要の場合はnull。
   */
  onFailure: (error: unknown) => string | null | Promise<string | null>
}

/**
 * Turnstileと送信・失敗処理を共通化したログインフォームを表示する。
 *
 * @param props - ログイン成功・失敗後のページ固有コールバック。
 * @returns 認証用のフォーム要素。
 */
export const AuthenticationForm = (props: AuthenticationFormProps) => {
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
      setErrorMessage(toUserFriendlyErrorMessage(failureHandlerError, props.fallbackErrorMessage))
    }
  }

  /**
   * ログインを1回だけ送信し、成功・失敗を親ページへ通知する。
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
      const user = await props.login(verifiedToken)
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
      <fieldset disabled={isSubmitting()} class="min-w-0">
        {props.children}
      </fieldset>
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
      <Show when={errorMessage()}>
        <p id={formErrorId} class="mb-4 text-sm text-danger" aria-live="polite">
          {errorMessage()}
        </p>
      </Show>
      <AppButton
        type="submit"
        variant="surface"
        fullWidth
        disabled={isSubmitting() || !turnstileToken()}
        class="min-h-11 rounded-md shadow-sm"
      >
        {props.icon}
        {isSubmitting() ? props.submittingLabel : props.submitLabel}
      </AppButton>
    </form>
  )
}
