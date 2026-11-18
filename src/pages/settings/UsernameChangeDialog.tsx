import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import Pencil from 'lucide-solid/icons/pencil'
import { type Component, createSignal } from 'solid-js'
import { reauthenticateAndGetToken } from '../../api/reauthenticate'
import { updateUsername } from '../../api/settings'
import {
  AppButton,
  getAppButtonClass,
  getAppIconButtonClass,
} from '../../components/common/AppButton'
import { AppDialog } from '../../components/common/AppDialog'
import { showSuccessToast } from '../../components/common/AppToast'
import { FILTER_DIALOG_FIELD_FOCUS_CLASS } from '../../components/common/filterStyles'
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../../utils/usernameInput'
import { USERNAME_CHANGE_COPY } from './AccountSettings.constants'
import { createUsernameChange } from './createUsernameChange'

type UsernameChangeDialogProps = {
  /** 現在のユーザーネーム。 */
  currentUsername: string
  /** 変更完了後に確定したユーザーネームを通知する。 */
  onChanged: (username: string) => void | Promise<void>
}

/**
 * 鉛筆ボタンから、再認証を伴うユーザーネーム変更ダイアログを開く。
 *
 * @param props - 現在のユーザーネームと変更完了通知。
 * @returns 鉛筆ボタンとユーザーネーム変更ダイアログ。
 */
export const UsernameChangeDialog: Component<UsernameChangeDialogProps> = (props) => {
  const [open, setOpen] = createSignal(false)
  let usernameInput: HTMLInputElement | undefined
  const change = createUsernameChange({
    currentUsername: () => props.currentUsername,
    reauthenticate: () => reauthenticateAndGetToken(),
    updateUsername,
    onChanged: async (username) => {
      await props.onChanged(username)
      setOpen(false)
    },
    notifySuccess: showSuccessToast,
  })

  /**
   * ダイアログの開閉を反映し、閉じるときに入力とエラーを破棄する。
   *
   * @param nextOpen - 開く場合は true。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) change.setUsername('')
    setOpen(nextOpen)
  }

  /**
   * 変更を送信し、ダイアログが開いたままなら入力欄へフォーカスを戻す。
   *
   * @returns 変更処理とフォーカス復帰の完了を待つPromise。
   */
  const submit = async (): Promise<void> => {
    if (change.submitting()) return
    await change.submit()
    if (open()) usernameInput?.focus()
  }

  return (
    <AppDialog
      open={open()}
      onOpenChange={handleOpenChange}
      pending={change.submitting()}
      size="sm"
      layer="raised"
      title={USERNAME_CHANGE_COPY.title}
      onInteractOutside={(event) => event.preventDefault()}
      trigger={
        <Dialog.Trigger
          type="button"
          class={getAppIconButtonClass({ tone: 'ghost', class: 'shrink-0' })}
          aria-label={USERNAME_CHANGE_COPY.title}
          title={USERNAME_CHANGE_COPY.title}
        >
          <Pencil aria-hidden="true" class="h-4 w-4" />
        </Dialog.Trigger>
      }
    >
      <form
        class="mt-4"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
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
            ref={usernameInput}
            class={`mt-2 w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans text-text placeholder:text-text-muted focus:border-action-primary ${FILTER_DIALOG_FIELD_FOCUS_CLASS}`}
            placeholder={USERNAME_CHANGE_COPY.placeholder}
            minlength={USERNAME_MIN_LENGTH}
            maxlength={USERNAME_MAX_LENGTH}
            pattern={USERNAME_PATTERN.source}
            onBlur={change.validate}
          />
          <TextField.Description class="mt-1 text-sm text-text-muted">
            {USERNAME_CHANGE_COPY.formatHint}
          </TextField.Description>
          <TextField.ErrorMessage class="mt-2 text-sm text-danger">
            {change.error()}
          </TextField.ErrorMessage>
        </TextField>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <Dialog.CloseButton
            type="button"
            aria-label={USERNAME_CHANGE_COPY.cancel}
            class={getAppButtonClass({ variant: 'secondary' })}
            disabled={change.submitting()}
          >
            {USERNAME_CHANGE_COPY.cancel}
          </Dialog.CloseButton>
          <AppButton
            type="submit"
            variant="primary"
            disabled={change.submitting() || change.username().length === 0}
          >
            {change.submitting() ? USERNAME_CHANGE_COPY.submitting : USERNAME_CHANGE_COPY.submit}
          </AppButton>
        </div>
      </form>
    </AppDialog>
  )
}
