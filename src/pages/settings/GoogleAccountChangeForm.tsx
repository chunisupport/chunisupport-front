import { useNavigate } from '@solidjs/router'
import { ArrowRightLeft } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal, onCleanup, Show } from 'solid-js'
import { AppButton } from '../../components/common/AppButton'
import { auth } from '../../lib/firebase'
import { clearAuthenticatedUser } from '../../stores/authSession'
import {
  cancelGoogleAccountChange,
  changeGoogleAccount,
  type GoogleAccountChangeTarget,
  selectGoogleAccountChangeTarget,
} from '../../usecases/auth/changeGoogleAccount'
import { clearClientCache } from '../../usecases/cache/clearClientCache'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { GOOGLE_ACCOUNT_CHANGE_COPY } from './AccountSettings.constants'

/** 変更先を選び直す必要があるAPIエラーコード */
const RESELECT_TARGET_ERROR_CODES = new Set([
  'recent_sign_in_required',
  'firebase_uid_already_linked',
  'firebase_account_unchanged',
])

/**
 * ログインに使うGoogleアカウントを変更するフォームを表示する。
 * 変更先の選択と現在アカウントでの再認証を別々の操作にし、ポップアップがブロックされないようにする。
 *
 * @returns Googleアカウント変更フォーム。
 */
export const GoogleAccountChangeForm: Component = () => {
  const navigate = useNavigate()
  const [currentEmail, setCurrentEmail] = createSignal(auth.currentUser?.email ?? '')
  const [target, setTarget] = createSignal<GoogleAccountChangeTarget>()
  const [isSelecting, setIsSelecting] = createSignal(false)
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [error, setError] = createSignal('')
  const [success, setSuccess] = createSignal('')

  onCleanup(() => {
    void cancelGoogleAccountChange().catch(() => undefined)
  })

  /** 変更先のGoogleアカウントを選択する。 */
  const handleSelect = async (): Promise<void> => {
    setError('')
    setSuccess('')
    setIsSelecting(true)
    try {
      setTarget(await selectGoogleAccountChangeTarget())
    } catch (caught) {
      const code = (caught as { code?: string }).code
      setError(
        code === 'auth/popup-closed-by-user'
          ? GOOGLE_ACCOUNT_CHANGE_COPY.selectionClosed
          : toUserFriendlyErrorMessage(caught, GOOGLE_ACCOUNT_CHANGE_COPY.failure)
      )
    } finally {
      setIsSelecting(false)
    }
  }

  /** 選択を取り消し、変更先のサインイン状態を破棄する。 */
  const handleCancel = async (): Promise<void> => {
    setTarget(undefined)
    setError('')
    await cancelGoogleAccountChange()
  }

  /** 現在のアカウントで再認証し、変更先アカウントへ差し替える。 */
  const handleSubmit = async (): Promise<void> => {
    const selectedTarget = target()
    if (!selectedTarget) return

    setError('')
    setIsSubmitting(true)
    try {
      const sessionSwitched = await changeGoogleAccount(selectedTarget)
      if (!sessionSwitched) {
        // 旧アカウントは削除済みのため、変更先でログインし直してもらう。
        await auth.signOut()
        await clearClientCache().catch(() => undefined)
        clearAuthenticatedUser()
        navigate('/login', { replace: true })
        return
      }
      setTarget(undefined)
      setCurrentEmail(auth.currentUser?.email ?? selectedTarget.email)
      setSuccess(GOOGLE_ACCOUNT_CHANGE_COPY.success)
    } catch (caught) {
      const code = (caught as { code?: string }).code
      if (code === 'auth/popup-closed-by-user') {
        setError(GOOGLE_ACCOUNT_CHANGE_COPY.popupClosed)
      } else if (code === 'auth/user-mismatch' || code === 'invalid_credentials') {
        setError(GOOGLE_ACCOUNT_CHANGE_COPY.userMismatch)
      } else if (code === 'recent_sign_in_required') {
        setError(GOOGLE_ACCOUNT_CHANGE_COPY.recentSignInExpired)
      } else {
        setError(toUserFriendlyErrorMessage(caught, GOOGLE_ACCOUNT_CHANGE_COPY.failure))
      }
      if (code && RESELECT_TARGET_ERROR_CODES.has(code)) {
        setTarget(undefined)
        await cancelGoogleAccountChange().catch(() => undefined)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-labelledby="google-account-change-title"
      class="mt-10 border-t border-border pt-6"
    >
      <h3 id="google-account-change-title" class="flex items-center gap-2 font-semibold text-text">
        <ArrowRightLeft aria-hidden="true" class="h-5 w-5" />
        {GOOGLE_ACCOUNT_CHANGE_COPY.title}
      </h3>
      <dl class="mt-4 max-w-md space-y-2 text-sm">
        <div class="flex flex-wrap justify-between gap-x-4">
          <dt class="text-text-muted">{GOOGLE_ACCOUNT_CHANGE_COPY.currentLabel}</dt>
          <dd class="break-all font-sans text-text">{currentEmail()}</dd>
        </div>
        <Show when={target()}>
          {(selectedTarget) => (
            <div class="flex flex-wrap justify-between gap-x-4">
              <dt class="text-text-muted">{GOOGLE_ACCOUNT_CHANGE_COPY.targetLabel}</dt>
              <dd class="break-all font-sans font-medium text-text">{selectedTarget().email}</dd>
            </div>
          )}
        </Show>
      </dl>
      <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
        {error()}
      </p>
      <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
        {success()}
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <Show
          when={target()}
          fallback={
            <AppButton variant="secondary" disabled={isSelecting()} onClick={handleSelect}>
              {isSelecting()
                ? GOOGLE_ACCOUNT_CHANGE_COPY.selecting
                : GOOGLE_ACCOUNT_CHANGE_COPY.select}
            </AppButton>
          }
        >
          <AppButton variant="primary" disabled={isSubmitting()} onClick={handleSubmit}>
            {isSubmitting()
              ? GOOGLE_ACCOUNT_CHANGE_COPY.submitting
              : GOOGLE_ACCOUNT_CHANGE_COPY.submit}
          </AppButton>
          <AppButton variant="ghost" disabled={isSubmitting()} onClick={handleCancel}>
            {GOOGLE_ACCOUNT_CHANGE_COPY.cancel}
          </AppButton>
        </Show>
      </div>
    </section>
  )
}
