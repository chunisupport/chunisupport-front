import { AlertDialog } from '@kobalte/core/alert-dialog'
import { TextField } from '@kobalte/core/text-field'
import { A } from '@solidjs/router'
import { Check, RotateCw, UserMinus, UserPlus, X } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, createResource, createSignal, For, Show } from 'solid-js'
import {
  acceptFriendRequest,
  createFriendRequest,
  deleteFriend,
  fetchFriends,
  fetchReceivedFriendRequests,
  fetchSentFriendRequests,
  rejectFriendRequest,
} from '../../api/friends'
import { AppButton } from '../../components/common/AppButton'
import { AppTabContent, UnderlineTabs } from '../../components/common/AppTabs'
import { Loading } from '../../components/Loading'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { FriendshipUserDTO } from '../../types/api'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  FRIENDS_COPY,
  FRIENDS_PAGE_TITLE,
  FRIENDS_TAB_OPTIONS,
  type FriendsTabValue,
} from './constants'
import {
  formatFriendDateTime,
  formatFriendPlayerLevel,
  formatFriendPlayerName,
  formatFriendRating,
} from './friendshipDisplay'

type FriendshipPageData = {
  friends: FriendshipUserDTO[]
  received: FriendshipUserDTO[]
  sent: FriendshipUserDTO[]
}

type FriendshipOperation = 'request' | 'accept' | 'reject' | 'remove'

type PendingConfirmAction = {
  /** 確認後に実行する操作種別。 */
  type: 'reject' | 'remove'
  /** 操作対象ユーザー。 */
  user: FriendshipUserDTO
}

type FriendshipListProps = {
  /** 一覧の表示種別。 */
  variant: FriendsTabValue
  /** 表示するユーザー概要の一覧。 */
  items: FriendshipUserDTO[]
  /** 空状態で表示する文言。 */
  emptyMessage: string
  /** 一覧内の操作を無効化するか。 */
  actionsDisabled: boolean
  /** 申請承認時の処理。 */
  onAccept: (user: FriendshipUserDTO) => void
  /** 申請拒否時の処理。 */
  onReject: (user: FriendshipUserDTO) => void
  /** フレンド解除時の処理。 */
  onRemove: (user: FriendshipUserDTO) => void
}

type FriendConfirmDialogProps = {
  /** 確認ダイアログを表示する操作。 */
  action: PendingConfirmAction | null
  /** API 操作中かどうか。 */
  busy: boolean
  /** ダイアログ開閉変更時の通知先。 */
  onOpenChange: (open: boolean) => void
  /** 確認ボタン押下時の処理。 */
  onConfirm: () => void
}

/**
 * フレンド画面に必要な3種類の一覧をまとめて取得する。
 *
 * @returns 承認済みフレンド、受信申請、送信申請。
 */
const fetchFriendshipPageData = async (): Promise<FriendshipPageData> => {
  const [friends, received, sent] = await Promise.all([
    fetchFriends(),
    fetchReceivedFriendRequests(),
    fetchSentFriendRequests(),
  ])

  return {
    friends: friends.items,
    received: received.items,
    sent: sent.items,
  }
}

/**
 * username入力値をAPI申請用に正規化する。
 *
 * @param value - 入力されたユーザー名。
 * @returns 前後空白を除いたユーザー名。
 */
const normalizeFriendRequestUsername = (value: string): string => value.trim()

/**
 * フレンド画面のユーザー行に表示する操作ボタン群を生成する。
 *
 * @param props - 表示種別、対象ユーザー、操作状態、イベントハンドラー。
 * @returns 対象行に対応する操作ボタン。
 */
const FriendActions = (props: {
  variant: FriendsTabValue
  user: FriendshipUserDTO
  busy: boolean
  onAccept: () => void
  onReject: () => void
  onRemove: () => void
}): JSX.Element => (
  <div class="flex flex-wrap items-center gap-2">
    <A
      href={`/users/${encodeURIComponent(props.user.username)}`}
      class="inline-flex items-center justify-center gap-2 rounded border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      {FRIENDS_COPY.profile}
    </A>
    <Show when={props.variant === 'received'}>
      <AppButton
        variant="primary"
        size="sm"
        leftIcon={<Check class="h-4 w-4" aria-hidden="true" />}
        disabled={props.busy}
        onClick={props.onAccept}
      >
        {FRIENDS_COPY.accept}
      </AppButton>
      <AppButton
        variant="dangerOutline"
        size="sm"
        leftIcon={<X class="h-4 w-4" aria-hidden="true" />}
        disabled={props.busy}
        onClick={props.onReject}
      >
        {FRIENDS_COPY.reject}
      </AppButton>
    </Show>
    <Show when={props.variant === 'friends'}>
      <AppButton
        variant="dangerOutline"
        size="sm"
        leftIcon={<UserMinus class="h-4 w-4" aria-hidden="true" />}
        disabled={props.busy}
        onClick={props.onRemove}
      >
        {FRIENDS_COPY.remove}
      </AppButton>
    </Show>
  </div>
)

/**
 * フレンド申請拒否またはフレンド解除の確認ダイアログを表示する。
 *
 * @param props - 確認対象の操作、操作状態、イベントハンドラー。
 * @returns Kobalte AlertDialog を使った確認ダイアログ。
 */
const FriendConfirmDialog = (props: FriendConfirmDialogProps): JSX.Element => {
  const isReject = createMemo(() => props.action?.type === 'reject')
  const title = createMemo(() =>
    isReject() ? FRIENDS_COPY.confirmRejectTitle : FRIENDS_COPY.confirmRemoveTitle
  )
  const description = createMemo(() =>
    isReject() ? FRIENDS_COPY.confirmRejectDescription : FRIENDS_COPY.confirmRemoveDescription
  )
  const confirmLabel = createMemo(() => (isReject() ? FRIENDS_COPY.reject : FRIENDS_COPY.remove))
  const busyLabel = createMemo(() =>
    isReject() ? FRIENDS_COPY.confirmingReject : FRIENDS_COPY.confirmingRemove
  )

  return (
    <AlertDialog open={props.action !== null} onOpenChange={props.onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
          <AlertDialog.Title class="text-lg font-bold">{title()}</AlertDialog.Title>
          <AlertDialog.Description class="mt-2 text-sm text-text-muted">
            {description()}
          </AlertDialog.Description>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton disabled={props.busy} onClick={() => props.onOpenChange(false)}>
              {FRIENDS_COPY.confirmCancel}
            </AppButton>
            <AppButton variant="danger" disabled={props.busy} onClick={props.onConfirm}>
              {props.busy ? busyLabel() : confirmLabel()}
            </AppButton>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

/**
 * フレンドまたは申請ユーザーの一覧を表示する。
 *
 * @param props - 表示種別、ユーザー一覧、空状態文言、操作ハンドラー。
 * @returns フレンド一覧UI。
 */
const FriendshipList = (props: FriendshipListProps): JSX.Element => (
  <Show
    when={props.items.length > 0}
    fallback={
      <p class="rounded border border-border bg-surface px-4 py-6 text-sm text-text-muted">
        {props.emptyMessage}
      </p>
    }
  >
    <ul class="space-y-3">
      <For each={props.items}>
        {(user) => (
          <li class="rounded-lg border border-border bg-surface p-4">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p class="text-lg font-semibold text-text">{user.username}</p>
                  <span class="text-sm text-text-muted">
                    {formatFriendPlayerName(user.player_name)}
                  </span>
                </div>
                <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                  <div>
                    <dt class="text-text-subtle">{FRIENDS_COPY.levelLabel}</dt>
                    <dd class="font-medium">{formatFriendPlayerLevel(user.player_level)}</dd>
                  </div>
                  <div>
                    <dt class="text-text-subtle">{FRIENDS_COPY.ratingLabel}</dt>
                    <dd class="font-medium">{formatFriendRating(user.rating)}</dd>
                  </div>
                  <div>
                    <dt class="text-text-subtle">{FRIENDS_COPY.requestedAt}</dt>
                    <dd class="font-medium">{formatFriendDateTime(user.requested_at)}</dd>
                  </div>
                  <Show when={props.variant === 'friends'}>
                    <div>
                      <dt class="text-text-subtle">{FRIENDS_COPY.acceptedAt}</dt>
                      <dd class="font-medium">{formatFriendDateTime(user.accepted_at)}</dd>
                    </div>
                  </Show>
                </dl>
              </div>
              <FriendActions
                variant={props.variant}
                user={user}
                busy={props.actionsDisabled}
                onAccept={() => props.onAccept(user)}
                onReject={() => props.onReject(user)}
                onRemove={() => props.onRemove(user)}
              />
            </div>
          </li>
        )}
      </For>
    </ul>
  </Show>
)

/**
 * フレンド機能の画面を表示する。
 *
 * @returns フレンド画面。
 */
const FriendsPage = () => {
  useDocumentTitle(FRIENDS_PAGE_TITLE)

  const [activeTab, setActiveTab] = createSignal<FriendsTabValue>('friends')
  const [usernameInput, setUsernameInput] = createSignal('')
  const [message, setMessage] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal('')
  const [operation, setOperation] = createSignal<FriendshipOperation | null>(null)
  const [pendingConfirmAction, setPendingConfirmAction] = createSignal<PendingConfirmAction | null>(
    null
  )

  const [pageData, { refetch }] = createResource(fetchFriendshipPageData)

  const currentData = createMemo(() => pageData() ?? { friends: [], received: [], sent: [] })
  const isInitialLoading = createMemo(() => pageData.loading && pageData() === undefined)
  const hasInitialLoadError = createMemo(() => Boolean(pageData.error && pageData() === undefined))
  const isRequesting = createMemo(() => operation() === 'request')
  const canSubmitRequest = createMemo(
    () => normalizeFriendRequestUsername(usernameInput()).length > 0 && operation() === null
  )

  /**
   * 一覧を再取得する。
   *
   * @returns 再取得完了時に解決されるPromise。
   */
  const refresh = async (): Promise<void> => {
    await refetch()
  }

  /**
   * 操作成功後に共通の状態更新を行う。
   *
   * @param successMessage - 操作成功時に表示する文言。
   * @returns 一覧再取得完了時に解決されるPromise。
   */
  const completeOperation = async (successMessage: string): Promise<void> => {
    setMessage(successMessage)
    await refresh()
  }

  /**
   * フレンド申請フォームの送信を処理する。
   *
   * @param event - フォーム送信イベント。
   * @returns 送信処理完了時に解決されるPromise。
   */
  const handleSubmitRequest = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault()
    const username = normalizeFriendRequestUsername(usernameInput())
    if (!username || operation() !== null) return

    setOperation('request')
    setMessage('')
    setErrorMessage('')

    try {
      await createFriendRequest({ username })
      setUsernameInput('')
      await completeOperation(FRIENDS_COPY.requestSuccess)
    } catch (error) {
      setErrorMessage(toUserFriendlyErrorMessage(error, FRIENDS_COPY.requestFailure))
    } finally {
      setOperation(null)
    }
  }

  /**
   * ユーザー単位のフレンド操作を共通処理する。
   *
   * @param nextOperation - 実行する操作種別。
   * @param action - API操作。
   * @param successMessage - 成功時に表示する文言。
   * @returns 操作完了時に解決されるPromise。
   */
  const runUserOperation = async (
    nextOperation: Exclude<FriendshipOperation, 'request'>,
    action: () => Promise<void>,
    successMessage: string
  ): Promise<void> => {
    if (operation() !== null) return

    setOperation(nextOperation)
    setMessage('')
    setErrorMessage('')

    try {
      await action()
      await completeOperation(successMessage)
    } catch (error) {
      setErrorMessage(toUserFriendlyErrorMessage(error, FRIENDS_COPY.operationFailure))
    } finally {
      setOperation(null)
    }
  }

  /**
   * フレンド申請を承認する。
   *
   * @param user - 申請元ユーザー。
   * @returns 承認完了時に解決されるPromise。
   */
  const handleAccept = (user: FriendshipUserDTO): Promise<void> =>
    runUserOperation('accept', () => acceptFriendRequest(user.user_id), FRIENDS_COPY.acceptSuccess)

  /**
   * フレンド申請を拒否する。
   *
   * @param user - 申請元ユーザー。
   * @returns 拒否完了時に解決されるPromise。
   */
  const handleReject = (user: FriendshipUserDTO): Promise<void> => {
    setPendingConfirmAction({ type: 'reject', user })
    return Promise.resolve()
  }

  /**
   * フレンド関係を解除する。
   *
   * @param user - 解除対象ユーザー。
   * @returns 解除完了時に解決されるPromise。
   */
  const handleRemove = (user: FriendshipUserDTO): Promise<void> => {
    setPendingConfirmAction({ type: 'remove', user })
    return Promise.resolve()
  }

  /**
   * 確認ダイアログで選択された拒否または解除を実行する。
   *
   * @returns 操作完了時に解決されるPromise。
   */
  const handleConfirmAction = async (): Promise<void> => {
    const action = pendingConfirmAction()
    if (!action) return

    if (action.type === 'reject') {
      await runUserOperation(
        'reject',
        () => rejectFriendRequest(action.user.user_id),
        FRIENDS_COPY.rejectSuccess
      )
    } else {
      await runUserOperation(
        'remove',
        () => deleteFriend(action.user.user_id),
        FRIENDS_COPY.removeSuccess
      )
    }

    setPendingConfirmAction(null)
  }

  return (
    <div class="mx-auto w-full max-w-5xl p-4">
      <header class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-2xl font-semibold">{FRIENDS_PAGE_TITLE}</h1>
        </div>
        <AppButton
          variant="surface"
          size="sm"
          leftIcon={<RotateCw class="h-4 w-4" aria-hidden="true" />}
          disabled={pageData.loading || operation() !== null}
          onClick={() => void refresh()}
        >
          {FRIENDS_COPY.retry}
        </AppButton>
      </header>

      <Show when={message()}>
        <p
          class="mb-4 rounded border border-success-border bg-success-bg px-3 py-2 text-sm text-success"
          aria-live="polite"
        >
          {message()}
        </p>
      </Show>
      <Show when={errorMessage() || pageData.error}>
        <p
          class="mb-4 rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {errorMessage() || toUserFriendlyErrorMessage(pageData.error)}
        </p>
      </Show>

      <form
        class="mb-6 rounded-lg border border-border bg-surface p-4"
        onSubmit={(event) => void handleSubmitRequest(event)}
      >
        <h2 class="mb-3 text-lg font-semibold">{FRIENDS_COPY.requestFormTitle}</h2>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextField class="min-w-0 flex-1" value={usernameInput()} onChange={setUsernameInput}>
            <TextField.Label class="mb-1 block text-sm font-medium text-text-muted">
              {FRIENDS_COPY.usernameLabel}
            </TextField.Label>
            <TextField.Input
              class="w-full rounded border border-input-border bg-input-bg px-3 py-2 font-sans text-sm outline-none transition-colors hover:border-input-border-hover focus:ring-2 focus:ring-focus-ring"
              placeholder={FRIENDS_COPY.usernamePlaceholder}
              autocomplete="off"
              required
            />
          </TextField>
          <AppButton
            type="submit"
            variant="primary"
            fullWidth
            class="sm:w-auto"
            leftIcon={<UserPlus class="h-4 w-4" aria-hidden="true" />}
            disabled={!canSubmitRequest()}
          >
            {isRequesting() ? FRIENDS_COPY.submittingRequest : FRIENDS_COPY.submitRequest}
          </AppButton>
        </div>
      </form>

      <UnderlineTabs
        options={FRIENDS_TAB_OPTIONS}
        value={activeTab()}
        onChange={setActiveTab}
        class="space-y-4"
      >
        <Show
          when={!isInitialLoading()}
          fallback={
            <div class="h-48">
              <span class="sr-only">{FRIENDS_COPY.loadingLabel}</span>
              <Loading />
            </div>
          }
        >
          <Show when={!hasInitialLoadError()}>
            <AppTabContent value="friends">
              <FriendshipList
                variant="friends"
                items={currentData().friends}
                emptyMessage={FRIENDS_COPY.emptyFriends}
                actionsDisabled={operation() !== null}
                onAccept={handleAccept}
                onReject={handleReject}
                onRemove={handleRemove}
              />
            </AppTabContent>
            <AppTabContent value="received">
              <FriendshipList
                variant="received"
                items={currentData().received}
                emptyMessage={FRIENDS_COPY.emptyReceived}
                actionsDisabled={operation() !== null}
                onAccept={handleAccept}
                onReject={handleReject}
                onRemove={handleRemove}
              />
            </AppTabContent>
            <AppTabContent value="sent">
              <FriendshipList
                variant="sent"
                items={currentData().sent}
                emptyMessage={FRIENDS_COPY.emptySent}
                actionsDisabled={operation() !== null}
                onAccept={handleAccept}
                onReject={handleReject}
                onRemove={handleRemove}
              />
            </AppTabContent>
          </Show>
        </Show>
      </UnderlineTabs>

      <FriendConfirmDialog
        action={pendingConfirmAction()}
        busy={operation() === 'reject' || operation() === 'remove'}
        onOpenChange={(open) => {
          if (!open && operation() === null) {
            setPendingConfirmAction(null)
          }
        }}
        onConfirm={() => void handleConfirmAction()}
      />
    </div>
  )
}

export default FriendsPage
