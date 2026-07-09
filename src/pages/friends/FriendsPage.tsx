import { AlertDialog } from '@kobalte/core/alert-dialog'
import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import { TextField } from '@kobalte/core/text-field'
import { A, useNavigate, useParams } from '@solidjs/router'
import { Check, Copy, EllipsisVertical, Lock, RotateCw, UserMinus, UserPlus, X } from 'lucide-solid'
import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  onCleanup,
  Show,
} from 'solid-js'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  createFriendRequest,
  deleteFriend,
  fetchFriends,
  fetchReceivedFriendRequests,
  fetchSentFriendRequests,
  rejectFriendRequest,
} from '../../api/friends'
import { AppButton } from '../../components/common/AppButton'
import { AppMenuContent, AppMenuItem, AppMenuTrigger } from '../../components/common/AppMenu'
import { AppTabContent, UnderlineTabs } from '../../components/common/AppTabs'
import { showErrorToast, showSuccessToast } from '../../components/common/AppToast'
import { Loading } from '../../components/Loading'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import {
  friendRequestNotification,
  setActiveFriendRequestNotificationUser,
  syncFriendRequestNotificationFromReceivedCount,
} from '../../stores/friendRequestNotification'
import type { FriendshipUserDTO } from '../../types/api'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  buildFriendsTabOptions,
  buildFriendsTabPath,
  FRIEND_REQUEST_USERNAME_ERROR_ID,
  FRIENDS_COPY,
  FRIENDS_COPY_FEEDBACK_DURATION_MS,
  FRIENDS_PAGE_TITLE,
  type FriendsTabValue,
  resolveFriendsTabValue,
} from './constants'
import {
  formatFriendPlayerLevel,
  formatFriendPlayerName,
  formatFriendRating,
} from './friendshipDisplay'

type FriendshipPageData = {
  friends: FriendshipUserDTO[]
  received: FriendshipUserDTO[]
  sent: FriendshipUserDTO[]
}

type FriendshipOperation = 'request' | 'accept' | 'reject' | 'cancel' | 'remove'

type ApiErrorLike = {
  /** APIエラーコード。 */
  code?: unknown
}

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
  /** 送信済み申請取り消し時の処理。 */
  onCancel: (user: FriendshipUserDTO) => void
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
 * @returns 承認済みフレンド、受信済みフレンドリクエスト、送信済みフレンドリクエスト。
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
 * フレンドカードでプロフィール情報とリンクを非表示にするか判定する。
 *
 * @param variant - 表示中のフレンド画面タブ。
 * @param user - 表示対象ユーザー。
 * @returns 非公開の送信済み申請先なら true。
 */
const shouldHideFriendProfile = (variant: FriendsTabValue, user: FriendshipUserDTO): boolean =>
  variant === 'sent' && user.is_private

/**
 * フレンド申請失敗時の表示文言を生成する。
 *
 * @param error - API操作で発生したエラー。
 * @returns フレンド申請欄に表示するエラーメッセージ。
 */
const formatFriendRequestErrorMessage = (error: unknown): string => {
  const errorCode =
    typeof error === 'object' && error !== null ? (error as ApiErrorLike).code : undefined

  if (errorCode === 'validation_failed') {
    return FRIENDS_COPY.requestUserNotFound
  }

  return toUserFriendlyErrorMessage(error, FRIENDS_COPY.requestFailure)
}

/**
 * フレンドカード右上のメニュー操作を表示する。
 *
 * @param props - 操作状態とフレンド解除ハンドラー。
 * @returns フレンドカード用のドロップダウンメニュー。
 */
const FriendMenuActions = (props: { busy: boolean; onRemove: () => void }): JSX.Element => (
  <DropdownMenu gutter={4}>
    <AppMenuTrigger
      label={FRIENDS_COPY.openFriendMenu}
      icon={<EllipsisVertical class="h-5 w-5" aria-hidden="true" />}
      disabled={props.busy}
    />
    <DropdownMenu.Portal>
      <AppMenuContent variant="compact">
        <AppMenuItem
          icon={<UserMinus class="h-4 w-4" aria-hidden="true" />}
          label={FRIENDS_COPY.remove}
          tone="danger"
          disabled={props.busy}
          onSelect={props.onRemove}
        />
      </AppMenuContent>
    </DropdownMenu.Portal>
  </DropdownMenu>
)

/**
 * フレンド申請カード下部の操作ボタン群を表示する。
 *
 * @param props - 表示種別、操作状態、イベントハンドラー。
 * @returns 申請カード用の操作ボタン。
 */
const FriendRequestActions = (props: {
  variant: FriendsTabValue
  busy: boolean
  onAccept: () => void
  onReject: () => void
  onCancel: () => void
}): JSX.Element => (
  <Show when={props.variant !== 'friends'}>
    <div class="mt-4 flex w-full flex-col gap-2">
      <Show when={props.variant === 'received'}>
        <div class="grid grid-cols-2 gap-2">
          <AppButton
            variant="primary"
            size="sm"
            fullWidth
            leftIcon={<Check class="h-4 w-4" aria-hidden="true" />}
            disabled={props.busy}
            onClick={props.onAccept}
          >
            {FRIENDS_COPY.accept}
          </AppButton>
          <AppButton
            variant="dangerOutline"
            size="sm"
            fullWidth
            leftIcon={<X class="h-4 w-4" aria-hidden="true" />}
            disabled={props.busy}
            onClick={props.onReject}
          >
            {FRIENDS_COPY.reject}
          </AppButton>
        </div>
      </Show>
      <Show when={props.variant === 'sent'}>
        <AppButton
          variant="dangerOutline"
          size="sm"
          fullWidth
          leftIcon={<X class="h-4 w-4" aria-hidden="true" />}
          disabled={props.busy}
          onClick={props.onCancel}
        >
          {FRIENDS_COPY.cancelRequest}
        </AppButton>
      </Show>
    </div>
  </Show>
)

/**
 * フレンドユーザーのプロフィールURLを生成する。
 *
 * @param username - 遷移先ユーザー名。
 * @returns プロフィール画面のURL。
 */
const buildFriendProfilePath = (username: string): string =>
  `/users/${encodeURIComponent(username)}`

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
    <ul class="grid justify-center gap-3 [grid-template-columns:repeat(auto-fit,15rem)]">
      <For each={props.items}>
        {(user) => {
          const hidesProfile = createMemo(() => shouldHideFriendProfile(props.variant, user))
          const playerNameClass =
            'min-w-0 truncate text-xl font-bold underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring'

          return (
            <li class="relative flex min-w-60 flex-col rounded-lg border border-border bg-surface p-4">
              <Show when={props.variant === 'friends'}>
                <div class="absolute right-2 top-2">
                  <FriendMenuActions
                    busy={props.actionsDisabled}
                    onRemove={() => props.onRemove(user)}
                  />
                </div>
              </Show>
              <div class="min-w-0">
                <div class={`min-w-0 ${props.variant === 'friends' ? 'pr-8' : ''}`}>
                  <div class="flex min-w-0 items-center gap-1">
                    <Show
                      when={!hidesProfile()}
                      fallback={
                        <span class={`${playerNameClass} text-text`}>
                          {formatFriendPlayerName(user.player_name)}
                        </span>
                      }
                    >
                      <A
                        href={buildFriendProfilePath(user.username)}
                        class={`${playerNameClass} text-action-primary hover:text-action-primary-hover hover:underline`}
                      >
                        {formatFriendPlayerName(user.player_name)}
                      </A>
                    </Show>
                    <Show when={hidesProfile()}>
                      <span
                        class="shrink-0 text-text-muted"
                        role="img"
                        aria-label={FRIENDS_COPY.privateAccountLabel}
                        title={FRIENDS_COPY.privateAccountLabel}
                      >
                        <Lock class="h-4 w-4" aria-hidden="true" />
                      </span>
                    </Show>
                  </div>
                  <span class="mt-0.5 block min-w-0 truncate text-xs text-text-muted">
                    @{user.username}
                  </span>
                </div>
                <Show when={!hidesProfile()}>
                  <dl class="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div>
                      <dt class="text-text-subtle">{FRIENDS_COPY.levelLabel}</dt>
                      <dd class="font-medium">{formatFriendPlayerLevel(user.player_level)}</dd>
                    </div>
                    <div>
                      <dt class="text-text-subtle">{FRIENDS_COPY.ratingLabel}</dt>
                      <dd class="font-medium">{formatFriendRating(user.rating)}</dd>
                    </div>
                  </dl>
                </Show>
              </div>
              <FriendRequestActions
                variant={props.variant}
                busy={props.actionsDisabled}
                onAccept={() => props.onAccept(user)}
                onReject={() => props.onReject(user)}
                onCancel={() => props.onCancel(user)}
              />
            </li>
          )
        }}
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
  const params = useParams<{ tab?: string }>()
  const navigate = useNavigate()

  const [usernameInput, setUsernameInput] = createSignal('')
  const [requestErrorMessage, setRequestErrorMessage] = createSignal('')
  const [operation, setOperation] = createSignal<FriendshipOperation | null>(null)
  const [isOwnUsernameCopied, setIsOwnUsernameCopied] = createSignal(false)
  const [pendingConfirmAction, setPendingConfirmAction] = createSignal<PendingConfirmAction | null>(
    null
  )
  let ownUsernameCopyResetTimer: number | undefined

  const [pageData, { refetch }] = createResource(fetchFriendshipPageData)

  const currentData = createMemo(() => pageData() ?? { friends: [], received: [], sent: [] })
  const isInitialLoading = createMemo(() => pageData.loading && pageData() === undefined)
  const hasInitialLoadError = createMemo(() => Boolean(pageData.error && pageData() === undefined))
  const isRequesting = createMemo(() => operation() === 'request')
  const ownUsername = createMemo(() => authSession.user?.username ?? '')
  const resolvedActiveTab = createMemo(() => resolveFriendsTabValue(params.tab))
  const activeTab = createMemo(() => resolvedActiveTab() ?? 'friends')
  const hasPendingReceivedRequest = createMemo(() =>
    pageData() !== undefined
      ? currentData().received.length > 0
      : friendRequestNotification.hasPendingReceivedRequest
  )
  const friendTabOptions = createMemo(() => buildFriendsTabOptions(hasPendingReceivedRequest()))
  const canSubmitRequest = createMemo(
    () => normalizeFriendRequestUsername(usernameInput()).length > 0 && operation() === null
  )

  /**
   * フレンド申請用 username 入力を更新し、申請欄のエラーを解除する。
   *
   * @param value - 入力されたユーザー名。
   * @returns なし。
   */
  const updateUsernameInput = (value: string): void => {
    setUsernameInput(value)
    setRequestErrorMessage('')
  }

  /**
   * タブ選択をURLへ反映する。
   *
   * @param tab - 選択されたフレンド画面タブ。
   * @returns なし。
   */
  const changeActiveTab = (tab: FriendsTabValue): void => {
    navigate(buildFriendsTabPath(tab))
  }

  onCleanup(() => {
    if (ownUsernameCopyResetTimer !== undefined) {
      window.clearTimeout(ownUsernameCopyResetTimer)
    }
  })

  createEffect(() => {
    if (resolvedActiveTab() === null) {
      navigate(buildFriendsTabPath('friends'), { replace: true })
    }
  })

  createEffect(() => {
    if (pageData.error) {
      showErrorToast(toUserFriendlyErrorMessage(pageData.error))
    }
  })

  createEffect(() => {
    const data = pageData()
    const username = ownUsername()

    if (data && username) {
      setActiveFriendRequestNotificationUser(username)
      void syncFriendRequestNotificationFromReceivedCount(username, data.received.length).catch(
        () => undefined
      )
    }
  })

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
    showSuccessToast(successMessage)
    await refresh()
  }

  /**
   * ログイン中ユーザーの username をクリップボードへコピーする。
   *
   * @returns コピー処理完了時に解決されるPromise。
   */
  const copyOwnUsername = async (): Promise<void> => {
    const username = ownUsername()
    if (!username) return

    try {
      await navigator.clipboard.writeText(username)
      setIsOwnUsernameCopied(true)
      if (ownUsernameCopyResetTimer !== undefined) {
        window.clearTimeout(ownUsernameCopyResetTimer)
      }
      ownUsernameCopyResetTimer = window.setTimeout(() => {
        setIsOwnUsernameCopied(false)
        ownUsernameCopyResetTimer = undefined
      }, FRIENDS_COPY_FEEDBACK_DURATION_MS)
    } catch {
      showErrorToast(FRIENDS_COPY.copyOwnUsernameFailure)
    }
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
    setRequestErrorMessage('')

    try {
      await createFriendRequest({ username })
      setUsernameInput('')
      await completeOperation(FRIENDS_COPY.requestSuccess)
    } catch (error) {
      setRequestErrorMessage(formatFriendRequestErrorMessage(error))
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

    try {
      await action()
      await completeOperation(successMessage)
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, FRIENDS_COPY.operationFailure))
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
   * 送信済みフレンド申請を取り消す。
   *
   * @param user - 申請先ユーザー。
   * @returns 取り消し完了時に解決されるPromise。
   */
  const handleCancel = (user: FriendshipUserDTO): Promise<void> =>
    runUserOperation('cancel', () => cancelFriendRequest(user.user_id), FRIENDS_COPY.cancelSuccess)

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
      <header class="mb-4 flex items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold">{FRIENDS_PAGE_TITLE}</h1>
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

      <form
        class="mx-auto mb-6 w-full max-w-[350px] rounded-lg border border-border bg-surface p-4"
        onSubmit={(event) => void handleSubmitRequest(event)}
      >
        <h2 class="sr-only">{FRIENDS_COPY.requestFormTitle}</h2>
        <Show when={ownUsername()}>
          {(username) => (
            <AppButton
              variant="ghost"
              size="sm"
              fullWidth
              class={`mb-4 justify-between text-left transition-colors ${
                isOwnUsernameCopied()
                  ? 'bg-action-primary-muted text-action-primary'
                  : 'text-text-muted'
              }`}
              aria-label={FRIENDS_COPY.copyOwnUsername}
              onClick={() => void copyOwnUsername()}
            >
              <span class="min-w-0 truncate">
                {FRIENDS_COPY.ownUsernameLabel}:{' '}
                <span
                  class={`font-medium transition-colors ${
                    isOwnUsernameCopied() ? 'text-action-primary' : 'text-text'
                  }`}
                >
                  @{username()}
                </span>
              </span>
              <span class="shrink-0 text-action-primary" aria-hidden="true">
                <Show
                  when={isOwnUsernameCopied()}
                  fallback={<Copy class="h-4 w-4" aria-hidden="true" />}
                >
                  <Check class="h-4 w-4" aria-hidden="true" />
                </Show>
              </span>
              <span class="sr-only" aria-live="polite">
                {isOwnUsernameCopied() ? FRIENDS_COPY.copyOwnUsernameSuccess : ''}
              </span>
            </AppButton>
          )}
        </Show>
        <div class="flex flex-col gap-2">
          <TextField class="min-w-0" value={usernameInput()} onChange={updateUsernameInput}>
            <TextField.Label class="mb-1 flex items-center justify-between gap-2 text-sm font-medium text-text-muted">
              <span>{FRIENDS_COPY.usernameLabel}</span>
              <span
                id={FRIEND_REQUEST_USERNAME_ERROR_ID}
                class="text-xs font-normal text-danger"
                aria-live="polite"
              >
                {requestErrorMessage()}
              </span>
            </TextField.Label>
            <div class="flex min-h-10 items-center rounded border border-input-border bg-input-bg transition-colors hover:border-input-border-hover focus-within:ring-2 focus-within:ring-focus-ring">
              <span
                class="shrink-0 pl-3 pr-1 text-sm font-medium text-text-muted"
                aria-hidden="true"
              >
                @
              </span>
              <TextField.Input
                class="min-w-0 flex-1 bg-transparent px-2 py-2 font-sans text-sm outline-none"
                placeholder={FRIENDS_COPY.usernamePlaceholder}
                autocomplete="off"
                aria-errormessage={FRIEND_REQUEST_USERNAME_ERROR_ID}
                aria-invalid={requestErrorMessage() ? 'true' : undefined}
                required
              />
            </div>
          </TextField>
          <AppButton
            type="submit"
            variant="primary"
            fullWidth
            leftIcon={<UserPlus class="h-4 w-4" aria-hidden="true" />}
            disabled={!canSubmitRequest()}
          >
            {isRequesting() ? FRIENDS_COPY.submittingRequest : FRIENDS_COPY.submitRequest}
          </AppButton>
        </div>
      </form>

      <UnderlineTabs
        options={friendTabOptions()}
        value={activeTab()}
        onChange={changeActiveTab}
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
                onCancel={handleCancel}
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
                onCancel={handleCancel}
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
                onCancel={handleCancel}
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
