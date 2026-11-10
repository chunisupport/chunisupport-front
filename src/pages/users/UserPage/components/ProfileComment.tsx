import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { MessageSquarePlus, Pencil } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, Show } from 'solid-js'
import { updateMyComment } from '../../../../api/userComment'
import { AppButton } from '../../../../components/common/AppButton'
import { AppDialogHeader } from '../../../../components/common/AppDialogHeader'
import { showSuccessToast } from '../../../../components/common/AppToast'
import { AppTooltipIconButton } from '../../../../components/common/AppTooltipIconButton'
import { FILTER_DIALOG_FIELD_FOCUS_CLASS } from '../../../../components/common/filterStyles'
import { USER_NAMEPLATE_WIDTH_CLASS } from '../../../../components/common/profile/UserNameplate.constants'
import { USER_COMMENT_MAX_LENGTH } from '../../../../constants/userComment'
import { userCommentQueryOptions, userQueryKeys } from '../../../../queries/users'
import { authSession } from '../../../../stores/authSession'
import { toUserFriendlyErrorMessage } from '../../../../utils/errorMessage'
import { countUserCommentLength, removeUserCommentLineBreaks } from '../../../../utils/userComment'
import {
  IME_COMPOSITION_KEY_CODE,
  PROFILE_COMMENT_COPY,
  PROFILE_COMMENT_INPUT_ROWS,
} from './ProfileComment.constants'

type ProfileCommentProps = {
  /** 表示中プロフィールのユーザー名 */
  username: string
}

/**
 * プロフィールカードの下に、カードと同じ幅でプロフィールコメントを表示する。
 * 自分のプロフィールでは編集ダイアログを開く操作を添える。
 *
 * @param props - 表示中ユーザーのユーザー名。
 * @returns コメントと編集操作。コメント未設定の他人のプロフィールや取得前・取得失敗時は何も表示しない。
 */
export const ProfileComment: Component<ProfileCommentProps> = (props) => {
  const queryClient = useQueryClient()
  const commentQuery = useQuery(() => userCommentQueryOptions(props.username))
  /** 取得済みのコメント。取得前・取得失敗時は undefined、未設定は null。取得中に data を読んで Suspense を起こさないよう成功時のみ参照する */
  const comment = createMemo(() => (commentQuery.isSuccess ? commentQuery.data : undefined))
  const isOwnProfile = createMemo(
    () => authSession.status === 'authenticated' && authSession.user?.username === props.username
  )
  const [dialogOpen, setDialogOpen] = createSignal(false)
  const [draft, setDraft] = createSignal('')
  const draftLength = createMemo(() => countUserCommentLength(draft()))
  const isTooLong = createMemo(() => draftLength() > USER_COMMENT_MAX_LENGTH)

  const saveMutation = useMutation(() => ({
    mutationFn: updateMyComment,
    onSuccess: (saved: string | null) => {
      // 保存対象は常に自分のコメントのため、表示中のプロフィールではなくログイン中のユーザー名で反映する
      const username = authSession.user?.username
      if (username) queryClient.setQueryData(userQueryKeys.comment(username), saved)
      showSuccessToast(PROFILE_COMMENT_COPY.saved)
      setDialogOpen(false)
    },
  }))

  createEffect(() => {
    props.username
    setDialogOpen(false)
  })

  /**
   * 保存済みのコメントを入力欄へ写して編集ダイアログを開く。
   *
   * @returns なし。
   */
  const openDialog = (): void => {
    saveMutation.reset()
    setDraft(comment() ?? '')
    setDialogOpen(true)
  }

  /**
   * 編集ダイアログの開閉を反映する。保存中は閉じない。
   *
   * @param open - ダイアログを開くか。
   * @returns なし。
   */
  const handleDialogOpenChange = (open: boolean): void => {
    if (open || saveMutation.isPending) return
    setDialogOpen(false)
  }

  /**
   * Enter キーを改行ではなく保存として扱う。IME の変換確定では保存しない。
   * Safari は変換確定の keydown で isComposing が false になるため、keyCode でも判定する。
   *
   * @param event - 入力欄の keydown イベント。
   * @returns なし。
   */
  const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }): void => {
    if (event.key !== 'Enter' || event.isComposing || event.keyCode === IME_COMPOSITION_KEY_CODE)
      return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  /**
   * 下書きを保存する。
   *
   * @param event - フォームの submit イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    if (isTooLong() || saveMutation.isPending) return
    saveMutation.mutate(draft())
  }

  return (
    <>
      <Show when={comment() !== undefined && (comment() !== null || isOwnProfile())}>
        <div class={`${USER_NAMEPLATE_WIDTH_CLASS} mb-2`}>
          <Show
            when={comment()}
            fallback={
              <AppButton
                fullWidth
                size="md"
                variant="surface"
                leftIcon={<MessageSquarePlus class="h-4 w-4" aria-hidden="true" />}
                onClick={openDialog}
              >
                {PROFILE_COMMENT_COPY.add}
              </AppButton>
            }
          >
            {(text) => (
              <div class="flex items-start gap-1">
                <p class="min-w-0 flex-1 wrap-anywhere px-1 py-2 font-sans text-sm text-text">
                  {text()}
                </p>
                <Show when={isOwnProfile()}>
                  <AppTooltipIconButton
                    tone="ghost"
                    class="shrink-0"
                    label={PROFILE_COMMENT_COPY.edit}
                    onClick={openDialog}
                  >
                    <Pencil class="h-4 w-4" aria-hidden="true" />
                  </AppTooltipIconButton>
                </Show>
              </div>
            )}
          </Show>
        </div>
      </Show>
      <Dialog open={dialogOpen()} onOpenChange={handleDialogOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
          <Dialog.Content class="fixed left-1/2 top-1/2 z-60 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
            <AppDialogHeader
              title={PROFILE_COMMENT_COPY.dialogTitle}
              closeLabel={PROFILE_COMMENT_COPY.close}
              closeDisabled={saveMutation.isPending}
            />
            <form class="mt-4" onSubmit={handleSubmit}>
              <TextField
                value={draft()}
                validationState={isTooLong() ? 'invalid' : 'valid'}
                onChange={(value) => setDraft(removeUserCommentLineBreaks(value))}
              >
                <TextField.TextArea
                  rows={PROFILE_COMMENT_INPUT_ROWS}
                  aria-label={PROFILE_COMMENT_COPY.dialogTitle}
                  class={`block w-full resize-none rounded border border-border-strong bg-surface px-3 py-2 font-sans text-sm hover:border-input-border-hover ${FILTER_DIALOG_FIELD_FOCUS_CLASS}`}
                  onKeyDown={handleKeyDown}
                />
              </TextField>
              <p
                class={`mt-1 text-right text-xs ${isTooLong() ? 'text-danger' : 'text-text-muted'}`}
              >
                {draftLength()}/{USER_COMMENT_MAX_LENGTH}
              </p>
              <Show when={saveMutation.error}>
                {(error) => (
                  <p class="mt-2 text-sm text-danger" role="alert">
                    {toUserFriendlyErrorMessage(error(), PROFILE_COMMENT_COPY.failure)}
                  </p>
                )}
              </Show>
              <div class="mt-5 flex justify-end gap-2">
                <AppButton
                  disabled={saveMutation.isPending}
                  onClick={() => handleDialogOpenChange(false)}
                >
                  {PROFILE_COMMENT_COPY.cancel}
                </AppButton>
                <AppButton
                  type="submit"
                  variant="primary"
                  disabled={isTooLong() || saveMutation.isPending}
                >
                  {saveMutation.isPending ? PROFILE_COMMENT_COPY.saving : PROFILE_COMMENT_COPY.save}
                </AppButton>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
