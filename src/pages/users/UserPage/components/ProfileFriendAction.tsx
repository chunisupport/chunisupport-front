import { AlertDialog } from '@kobalte/core/alert-dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { Check, Clock, UserMinus, UserPlus, X } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  createFriendRequest,
  deleteFriend,
  rejectFriendRequest,
} from '../../../../api/friends'
import { AppButton, type AppButtonVariant } from '../../../../components/common/AppButton'
import { showSuccessToast } from '../../../../components/common/AppToast'
import { Loading } from '../../../../components/Loading'
import {
  friendMutationKeys,
  friendsQueryOptions,
  invalidateFriendQueriesAfterMutation,
  receivedFriendRequestsQueryOptions,
  sentFriendRequestsQueryOptions,
} from '../../../../queries/friends'
import { authSession } from '../../../../stores/authSession'
import {
  setActiveFriendRequestNotificationUser,
  syncFriendRequestNotificationFromReceivedCount,
} from '../../../../stores/friendRequestNotification'
import { toUserFriendlyErrorMessage } from '../../../../utils/errorMessage'
import { resolveProfileFriendshipStatus } from '../../../../utils/profileFriendshipStatus'
import {
  PROFILE_FRIEND_ACTION_BUTTON_CLASS,
  PROFILE_FRIEND_ACTION_BUTTON_LEADING_CLASS,
  PROFILE_FRIEND_ACTION_COPY,
  PROFILE_FRIEND_ACTION_FOOTER_CLASS,
  PROFILE_FRIEND_DIALOG_COPY,
  type ProfileFriendDialogAction,
} from './ProfileFriendAction.constants'

type ProfileFriendActionProps = {
  /** 表示中プロフィールのユーザー名 */
  username: string
  /** 確認ダイアログに表示するプレイヤー名 */
  playerName: string
}

type ProfileFriendCardAction = {
  /** 確認後に実行する操作 */
  action: ProfileFriendDialogAction
  /** カード下部ボタンの文言 */
  label: string
  /** カード下部ボタンの見た目 */
  variant: AppButtonVariant
  /** カード下部ボタンのアイコン */
  icon: typeof UserPlus
}

type ProfileFriendConfirmDialogProps = {
  /** 確認対象の操作。未表示時は null */
  action: ProfileFriendDialogAction | null
  /** 操作対象のプレイヤー名 */
  playerName: string
  /** 操作対象のユーザー名 */
  username: string
  /** API操作中かどうか */
  busy: boolean
  /** 操作失敗時にダイアログ内へ表示する文言 */
  errorMessage: string
  /** ダイアログの開閉変更 */
  onOpenChange: (open: boolean) => void
  /** 確定ボタン押下時の処理 */
  onConfirm: () => void
}

/**
 * フレンド操作の確認ダイアログを表示する。
 *
 * @param props - 確認対象、対象ユーザー、実行状態、イベントハンドラー。
 * @returns 確認ダイアログ。
 */
const ProfileFriendConfirmDialog: Component<ProfileFriendConfirmDialogProps> = (props) => {
  const copy = createMemo(() =>
    props.action === null ? undefined : PROFILE_FRIEND_DIALOG_COPY[props.action]
  )

  return (
    <AlertDialog open={props.action !== null} onOpenChange={props.onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
        <AlertDialog.Content class="fixed left-1/2 top-1/2 z-60 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
          <AlertDialog.Title class="text-lg font-bold text-text">{copy()?.title}</AlertDialog.Title>
          <AlertDialog.Description class="mt-2 truncate font-sans text-sm text-text-muted">
            {props.playerName}
            <span class="text-text-subtle"> @{props.username}</span>
          </AlertDialog.Description>
          <Show when={props.errorMessage}>
            <p class="mt-3 text-sm text-danger" role="alert">
              {props.errorMessage}
            </p>
          </Show>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton disabled={props.busy} onClick={() => props.onOpenChange(false)}>
              {PROFILE_FRIEND_ACTION_COPY.cancel}
            </AppButton>
            <AppButton
              variant={copy()?.confirmVariant ?? 'primary'}
              disabled={props.busy}
              onClick={props.onConfirm}
            >
              {props.busy ? copy()?.busyLabel : copy()?.confirmLabel}
            </AppButton>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

/**
 * 他人のプロフィールカード下部に、関係に応じたフレンド操作を表示する。
 *
 * @param props - 表示中ユーザーのユーザー名とプレイヤー名。
 * @returns カードと同じ幅の操作ボタン。自分のプロフィールや未ログイン時は何も表示しない。
 */
export const ProfileFriendAction: Component<ProfileFriendActionProps> = (props) => {
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = createSignal<ProfileFriendDialogAction | null>(null)
  const [actionErrorMessage, setActionErrorMessage] = createSignal('')
  const viewerUsername = createMemo(() =>
    authSession.status === 'authenticated' ? (authSession.user?.username ?? null) : null
  )
  const showFriendAction = createMemo(() => {
    const viewer = viewerUsername()
    return viewer !== null && viewer !== props.username
  })
  const friendshipUsername = createMemo(() => (showFriendAction() ? viewerUsername() : null))
  const friendsQuery = useQuery(() => friendsQueryOptions(friendshipUsername()))
  const sentRequestsQuery = useQuery(() => sentFriendRequestsQueryOptions(friendshipUsername()))
  const receivedRequestsQuery = useQuery(() =>
    receivedFriendRequestsQueryOptions(friendshipUsername())
  )
  const hasStatusData = createMemo(
    () =>
      friendsQuery.data !== undefined &&
      sentRequestsQuery.data !== undefined &&
      receivedRequestsQuery.data !== undefined
  )
  const statusError = createMemo(() =>
    hasStatusData()
      ? undefined
      : (friendsQuery.error ?? sentRequestsQuery.error ?? receivedRequestsQuery.error)
  )
  const status = createMemo(() => {
    const friends = friendsQuery.data
    const sentRequests = sentRequestsQuery.data
    const receivedRequests = receivedRequestsQuery.data
    if (!friends || !sentRequests || !receivedRequests) return 'none'
    return resolveProfileFriendshipStatus(props.username, friends, sentRequests, receivedRequests)
  })
  const cardActions = createMemo((): readonly ProfileFriendCardAction[] => {
    switch (status()) {
      case 'friend':
        return [
          {
            action: 'remove',
            label: PROFILE_FRIEND_ACTION_COPY.remove,
            variant: 'dangerOutline',
            icon: UserMinus,
          },
        ]
      case 'sent':
        return [
          {
            action: 'cancel',
            label: PROFILE_FRIEND_ACTION_COPY.pending,
            variant: 'surface',
            icon: Clock,
          },
        ]
      case 'received':
        return [
          {
            action: 'accept',
            label: PROFILE_FRIEND_ACTION_COPY.accept,
            variant: 'primary',
            icon: Check,
          },
          {
            action: 'reject',
            label: PROFILE_FRIEND_ACTION_COPY.reject,
            variant: 'dangerOutline',
            icon: X,
          },
        ]
      case 'none':
        return [
          {
            action: 'request',
            label: PROFILE_FRIEND_ACTION_COPY.request,
            variant: 'primary',
            icon: UserPlus,
          },
        ]
    }
  })

  /**
   * フレンド操作の成功を通知し、関連queryを無効化する。
   *
   * @param action - 完了した操作。
   * @returns 表示中queryの再取得完了時に解決されるPromise。
   */
  const completeFriendAction = async (action: ProfileFriendDialogAction): Promise<void> => {
    const username = viewerUsername()
    const copy = PROFILE_FRIEND_DIALOG_COPY[action]
    if (!username) return

    showSuccessToast(copy.successMessage)
    await invalidateFriendQueriesAfterMutation(queryClient, username, copy.operation)
  }

  const requestMutation = useMutation(() => ({
    mutationKey: friendMutationKeys.operation(viewerUsername() ?? '', 'request'),
    mutationFn: (targetUsername: string) => createFriendRequest({ username: targetUsername }),
    onSuccess: () => completeFriendAction('request'),
  }))
  const cancelMutation = useMutation(() => ({
    mutationKey: friendMutationKeys.operation(viewerUsername() ?? '', 'cancel'),
    mutationFn: (targetUsername: string) => cancelFriendRequest(targetUsername),
    onSuccess: () => completeFriendAction('cancel'),
  }))
  const removeMutation = useMutation(() => ({
    mutationKey: friendMutationKeys.operation(viewerUsername() ?? '', 'remove'),
    mutationFn: (targetUsername: string) => deleteFriend(targetUsername),
    onSuccess: () => completeFriendAction('remove'),
  }))
  const acceptMutation = useMutation(() => ({
    mutationKey: friendMutationKeys.operation(viewerUsername() ?? '', 'accept'),
    mutationFn: (targetUsername: string) => acceptFriendRequest(targetUsername),
    onSuccess: () => completeFriendAction('accept'),
  }))
  const rejectMutation = useMutation(() => ({
    mutationKey: friendMutationKeys.operation(viewerUsername() ?? '', 'reject'),
    mutationFn: (targetUsername: string) => rejectFriendRequest(targetUsername),
    onSuccess: () => completeFriendAction('reject'),
  }))
  const isMutating = createMemo(
    () =>
      requestMutation.isPending ||
      cancelMutation.isPending ||
      removeMutation.isPending ||
      acceptMutation.isPending ||
      rejectMutation.isPending
  )

  createEffect(() => {
    const receivedRequests = receivedRequestsQuery.data
    const dataUpdatedAt = receivedRequestsQuery.dataUpdatedAt
    const username = viewerUsername()

    if (!showFriendAction() || !receivedRequests || dataUpdatedAt <= 0 || !username) return

    setActiveFriendRequestNotificationUser(username)
    void syncFriendRequestNotificationFromReceivedCount(
      username,
      receivedRequests.length,
      dataUpdatedAt
    ).catch(() => undefined)
  })

  createEffect(() => {
    props.username
    setPendingAction(null)
    setActionErrorMessage('')
  })

  /**
   * 確認ダイアログを開く。
   *
   * @param action - 確認する操作。
   * @returns なし。
   */
  const openDialog = (action: ProfileFriendDialogAction): void => {
    setActionErrorMessage('')
    setPendingAction(action)
  }

  /**
   * 確認ダイアログの開閉を反映する。実行中は閉じない。
   *
   * @param open - ダイアログを開くか。
   * @returns なし。
   */
  const handleDialogOpenChange = (open: boolean): void => {
    if (open || isMutating()) return
    setPendingAction(null)
    setActionErrorMessage('')
  }

  /**
   * 確認済みのフレンド操作を実行する。
   *
   * @returns 操作完了時に解決されるPromise。
   */
  const handleConfirm = async (): Promise<void> => {
    const action = pendingAction()
    const targetUsername = props.username
    if (!action || isMutating()) return

    setActionErrorMessage('')

    try {
      switch (action) {
        case 'request':
          await requestMutation.mutateAsync(targetUsername)
          break
        case 'cancel':
          await cancelMutation.mutateAsync(targetUsername)
          break
        case 'remove':
          await removeMutation.mutateAsync(targetUsername)
          break
        case 'accept':
          await acceptMutation.mutateAsync(targetUsername)
          break
        case 'reject':
          await rejectMutation.mutateAsync(targetUsername)
          break
      }
      setPendingAction(null)
    } catch (error) {
      setActionErrorMessage(toUserFriendlyErrorMessage(error, PROFILE_FRIEND_ACTION_COPY.failure))
    }
  }

  /**
   * フレンド関係の取得を再実行する。
   *
   * @returns 再取得完了時に解決されるPromise。
   */
  const retryStatus = (): Promise<unknown> =>
    Promise.all([
      friendsQuery.refetch(),
      sentRequestsQuery.refetch(),
      receivedRequestsQuery.refetch(),
    ])

  return (
    <Show when={showFriendAction()}>
      <div class={PROFILE_FRIEND_ACTION_FOOTER_CLASS}>
        <Show
          when={hasStatusData()}
          fallback={
            <Show
              when={statusError()}
              fallback={
                <AppButton
                  fullWidth
                  size="md"
                  disabled
                  class={PROFILE_FRIEND_ACTION_BUTTON_CLASS}
                  aria-label={PROFILE_FRIEND_ACTION_COPY.loadingLabel}
                >
                  <span class="flex h-5 w-5 items-center justify-center">
                    <Loading size="inline" ariaHidden />
                  </span>
                </AppButton>
              }
            >
              {(error) => (
                <div>
                  <p class="px-3 py-2 text-sm text-danger" role="alert">
                    {toUserFriendlyErrorMessage(error(), PROFILE_FRIEND_ACTION_COPY.failure)}
                  </p>
                  <AppButton
                    fullWidth
                    size="md"
                    variant="surface"
                    class={PROFILE_FRIEND_ACTION_BUTTON_CLASS}
                    onClick={() => void retryStatus()}
                  >
                    {PROFILE_FRIEND_ACTION_COPY.retry}
                  </AppButton>
                </div>
              )}
            </Show>
          }
        >
          <For each={cardActions()}>
            {(item, index) => {
              const Icon = item.icon

              return (
                <AppButton
                  fullWidth
                  size="md"
                  variant={item.variant}
                  class={
                    index() === cardActions().length - 1
                      ? PROFILE_FRIEND_ACTION_BUTTON_CLASS
                      : PROFILE_FRIEND_ACTION_BUTTON_LEADING_CLASS
                  }
                  disabled={isMutating()}
                  leftIcon={<Icon class="h-4 w-4" aria-hidden="true" />}
                  onClick={() => openDialog(item.action)}
                >
                  {item.label}
                </AppButton>
              )
            }}
          </For>
        </Show>
      </div>
      <ProfileFriendConfirmDialog
        action={pendingAction()}
        playerName={props.playerName}
        username={props.username}
        busy={isMutating()}
        errorMessage={actionErrorMessage()}
        onOpenChange={handleDialogOpenChange}
        onConfirm={() => void handleConfirm()}
      />
    </Show>
  )
}
