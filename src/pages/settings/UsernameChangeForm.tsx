import { TextField } from '@kobalte/core/text-field'
import UserRoundPen from 'lucide-solid/icons/user-round-pen'
import type { Component } from 'solid-js'
import { reauthenticateAndGetToken } from '../../api/reauthenticate'
import { updateUsername } from '../../api/settings'
import { AppButton } from '../../components/common/AppButton'
import { showSuccessToast } from '../../components/common/AppToast'
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../../utils/usernameInput'
import { USERNAME_CHANGE_COPY } from './AccountSettings.constants'
import { createUsernameChange } from './createUsernameChange'
import { SETTINGS_SUBSECTION_CLASS, SETTINGS_SUBSECTION_TITLE_CLASS } from './settingsStyles'

type UsernameChangeFormProps = {
  /** 現在のユーザーネーム。 */
  currentUsername: string
  /** 変更完了後に確定したユーザーネームを通知する。 */
  onChanged: (username: string) => void | Promise<void>
}

/**
 * 再認証を伴うユーザーネーム変更フォームを表示する。
 *
 * @param props - 現在のユーザーネームと変更完了通知。
 * @returns ユーザーネーム変更フォーム。
 */
export const UsernameChangeForm: Component<UsernameChangeFormProps> = (props) => {
  const change = createUsernameChange({
    currentUsername: () => props.currentUsername,
    reauthenticate: () => reauthenticateAndGetToken(),
    updateUsername,
    onChanged: (username) => props.onChanged(username),
    notifySuccess: showSuccessToast,
  })

  return (
    <section aria-labelledby="username-change-title" class={SETTINGS_SUBSECTION_CLASS}>
      <h3 id="username-change-title" class={SETTINGS_SUBSECTION_TITLE_CLASS}>
        <UserRoundPen aria-hidden="true" class="h-5 w-5" />
        {USERNAME_CHANGE_COPY.title}
      </h3>
      <form
        class="mt-4 max-w-md"
        onSubmit={(event) => {
          event.preventDefault()
          void change.submit()
        }}
      >
        <TextField
          value={change.username()}
          onChange={change.setUsername}
          validationState={change.error() ? 'invalid' : undefined}
          disabled={change.submitting()}
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
            onBlur={change.validate}
          />
          <TextField.Description id="username-change-hint" class="mt-1 text-sm text-text-muted">
            {USERNAME_CHANGE_COPY.formatHint}
          </TextField.Description>
          <TextField.ErrorMessage id="username-change-error" class="mt-2 text-sm text-danger">
            {change.error()}
          </TextField.ErrorMessage>
        </TextField>
        <AppButton
          type="submit"
          variant="primary"
          class="mt-4"
          disabled={change.submitting() || change.username().length === 0}
        >
          {change.submitting() ? USERNAME_CHANGE_COPY.submitting : USERNAME_CHANGE_COPY.submit}
        </AppButton>
      </form>
    </section>
  )
}
