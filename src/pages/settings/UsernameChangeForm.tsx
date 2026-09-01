import { TextField } from '@kobalte/core/text-field'
import { UserRoundPen } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'
import { reauthenticateAndGetToken } from '../../api/reauthenticate'
import { updateUsername } from '../../api/settings'
import { AppButton } from '../../components/common/AppButton'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  validateUsername,
} from '../../utils/usernameInput'
import { USERNAME_CHANGE_COPY } from './AccountSettings.constants'

type UsernameChangeFormProps = {
  /** 現在のユーザー名。 */
  currentUsername: string
  /** 変更完了後に確定したユーザー名を通知する。 */
  onChanged: (username: string) => void | Promise<void>
}

/**
 * ユーザー名入力の検証結果を設定画面向けの文言へ変換する。
 *
 * @param value - 入力中のユーザー名。
 * @param currentUsername - 現在のユーザー名。
 * @returns 入力エラー文言。有効な場合は空文字。
 */
const validateUsernameChange = (value: string, currentUsername: string): string => {
  const validationError = validateUsername(value)
  if (validationError === 'required') return USERNAME_CHANGE_COPY.required
  if (validationError === 'invalid') return USERNAME_CHANGE_COPY.invalid
  if (value === currentUsername) return USERNAME_CHANGE_COPY.unchanged
  return ''
}

/**
 * 再認証を伴うユーザーID変更フォームを表示する。
 *
 * @param props - 現在のユーザー名と変更完了通知。
 * @returns ユーザーID変更フォーム。
 */
export const UsernameChangeForm: Component<UsernameChangeFormProps> = (props) => {
  const [value, setValue] = createSignal('')
  const [error, setError] = createSignal('')
  const [success, setSuccess] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)

  /** 入力値を検証し、結果をフォームへ反映する。 */
  const validateInput = (): boolean => {
    const message = validateUsernameChange(value(), props.currentUsername)
    setError(message)
    return message.length === 0
  }

  /** 再認証後にユーザーIDを変更し、確定値を親へ通知する。 */
  const handleSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault()
    setSuccess('')
    if (!validateInput()) return

    setSubmitting(true)
    try {
      const reauthToken = await reauthenticateAndGetToken()
      const result = await updateUsername(value(), reauthToken)
      await props.onChanged(result.username)
      setValue('')
      setError('')
      setSuccess(USERNAME_CHANGE_COPY.success)
    } catch (caught) {
      const apiError = caught as Error & { code?: string }
      if (apiError.code === 'auth/popup-closed-by-user') {
        setError(USERNAME_CHANGE_COPY.popupClosed)
      } else if (apiError.code === 'auth/user-mismatch') {
        setError(USERNAME_CHANGE_COPY.userMismatch)
      } else if (apiError.code === 'recent_sign_in_required') {
        setError(USERNAME_CHANGE_COPY.recentSignInExpired)
      } else {
        setError(toUserFriendlyErrorMessage(caught, USERNAME_CHANGE_COPY.failure))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="username-change-title" class="mt-10 border-t border-border pt-6">
      <h3 id="username-change-title" class="flex items-center gap-2 font-semibold text-text">
        <UserRoundPen aria-hidden="true" class="h-5 w-5" />
        {USERNAME_CHANGE_COPY.title}
      </h3>
      <form class="mt-4 max-w-md" onSubmit={handleSubmit}>
        <TextField
          value={value()}
          onChange={(nextValue) => {
            setValue(nextValue)
            if (error()) setError('')
            if (success()) setSuccess('')
          }}
          validationState={error() ? 'invalid' : undefined}
          disabled={submitting()}
        >
          <TextField.Label class="block text-sm font-medium text-text">
            {USERNAME_CHANGE_COPY.label}
          </TextField.Label>
          <TextField.Input
            class="mt-2 w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans text-text outline-none placeholder:text-text-muted focus:border-action-primary focus:ring-2 focus:ring-focus-ring"
            placeholder={USERNAME_CHANGE_COPY.placeholder}
            minlength={USERNAME_MIN_LENGTH}
            maxlength={USERNAME_MAX_LENGTH}
            pattern={USERNAME_PATTERN.source}
            aria-describedby="username-change-hint username-change-error"
            onBlur={validateInput}
          />
          <TextField.Description id="username-change-hint" class="mt-1 text-sm text-text-muted">
            {USERNAME_CHANGE_COPY.formatHint}
          </TextField.Description>
          <TextField.ErrorMessage id="username-change-error" class="mt-2 text-sm text-danger">
            {error()}
          </TextField.ErrorMessage>
        </TextField>
        <p class="mt-2 text-sm text-action-primary empty:hidden" role="status">
          {success()}
        </p>
        <AppButton type="submit" variant="primary" class="mt-4" disabled={submitting()}>
          {submitting() ? USERNAME_CHANGE_COPY.submitting : USERNAME_CHANGE_COPY.submit}
        </AppButton>
      </form>
    </section>
  )
}
