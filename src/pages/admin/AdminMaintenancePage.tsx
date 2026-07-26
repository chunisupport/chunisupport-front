import { AlertDialog } from '@kobalte/core/alert-dialog'
import { TextField } from '@kobalte/core/text-field'
import { CircleCheck, Wrench } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { updateMaintenance } from '../../api/maintenance'
import { Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import {
  MAINTENANCE_COMMENT_ERROR_MESSAGES,
  MAINTENANCE_COMMENT_MAX_CODE_POINTS,
  MAINTENANCE_RECHECK_BUTTON_LABEL,
  SYSTEM_STATUS_LABELS,
} from '../../constants/maintenance'
import { ADMIN_MAINTENANCE_PAGE_TITLE } from '../../constants/pageTitles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  applySystemStatus,
  availability,
  subscribeSystemStatusApplied,
} from '../../stores/availability'
import { refreshAvailability } from '../../usecases/availability/refreshAvailability'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import type { MaintenanceCommentValidationError } from '../../utils/maintenanceComment'
import {
  countMaintenanceCommentCodePoints,
  normalizeMaintenanceComment,
  validateMaintenanceComment,
} from '../../utils/maintenanceComment'
import { formatMaintenanceDateTime } from '../../utils/maintenanceDateTime'
import {
  ADMIN_MAINTENANCE_ACTION_COPY,
  ADMIN_MAINTENANCE_COMMENT_ROWS,
  ADMIN_MAINTENANCE_COPY,
} from './adminMaintenance.constants'
import {
  buildMaintenanceUpdateRequest,
  isMaintenanceCommentUnchanged,
  type MaintenanceAction,
} from './maintenanceAction'

type MaintenanceConfirmation = {
  /** 確認する状態変更操作。 */
  action: MaintenanceAction
  /** 確認画面に表示し、確定時に送信する正規化済みコメント。 */
  comment: string
}

type MaintenanceStatusSummaryProps = {
  /** メンテナンス中の場合はtrue。 */
  maintenance: boolean
  /** APIが返した最終更新日時。 */
  updatedAt: string | null
}

/** 管理操作を解放する前に行う状態同期の進行状況。 */
type MaintenanceStatusSyncState = 'loading' | 'ready' | 'error'

const COMMENT_TEXT_AREA_CLASS =
  'min-h-48 w-full resize-y rounded-md border border-input-border bg-input-bg px-3 py-2 text-base leading-relaxed text-text outline-none transition hover:border-input-border-hover focus:border-action-primary focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

/**
 * 現在の稼働状態と最終更新日時をアイコンとテキストで表示する。
 *
 * @param props - 稼働状態とAPIの最終更新日時。
 * @returns 管理画面の状態サマリー。
 */
const MaintenanceStatusSummary = (props: MaintenanceStatusSummaryProps): JSX.Element => {
  const formattedUpdatedAt = createMemo(() => formatMaintenanceDateTime(props.updatedAt))

  return (
    <section
      class="rounded-lg border border-border bg-surface p-4"
      aria-labelledby="status-heading"
    >
      <h2 id="status-heading" class="text-sm font-medium text-text-muted">
        {ADMIN_MAINTENANCE_COPY.currentStatus}
      </h2>
      <div
        class={`mt-3 flex items-center gap-3 rounded-md border px-3 py-3 ${
          props.maintenance
            ? 'border-warning-border bg-warning-bg text-warning'
            : 'border-success-border bg-success-bg text-success'
        }`}
      >
        <Show
          when={props.maintenance}
          fallback={<CircleCheck class="h-5 w-5 shrink-0" aria-hidden="true" />}
        >
          <Wrench class="h-5 w-5 shrink-0" aria-hidden="true" />
        </Show>
        <span class="font-semibold">
          {props.maintenance ? SYSTEM_STATUS_LABELS.maintenance : SYSTEM_STATUS_LABELS.operational}
        </span>
      </div>
      <dl class="mt-3 text-sm">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <dt class="text-text-muted">{ADMIN_MAINTENANCE_COPY.updatedAt}</dt>
          <dd class="font-medium text-text">
            <Show when={formattedUpdatedAt()} fallback={ADMIN_MAINTENANCE_COPY.updatedAtUnknown}>
              {(formatted) => <time datetime={props.updatedAt ?? undefined}>{formatted()}</time>}
            </Show>
          </dd>
        </div>
      </dl>
    </section>
  )
}

/**
 * ADMINがメンテナンスの開始、コメント更新、終了を行う画面を表示する。
 *
 * @returns メンテナンス状態管理フォームと確認ダイアログ。
 */
const AdminMaintenancePage = (): JSX.Element => {
  useDocumentTitle(ADMIN_MAINTENANCE_PAGE_TITLE)

  const initialComment = availability.state.kind === 'maintenance' ? availability.state.comment : ''
  const [comment, setComment] = createSignal(initialComment)
  const [commentError, setCommentError] = createSignal<MaintenanceCommentValidationError | null>(
    null
  )
  const [confirmation, setConfirmation] = createSignal<MaintenanceConfirmation | null>(null)
  const [pendingAction, setPendingAction] = createSignal<MaintenanceAction | null>(null)
  const [statusSyncState, setStatusSyncState] = createSignal<MaintenanceStatusSyncState>('loading')
  const [actionError, setActionError] = createSignal('')
  const [actionSuccess, setActionSuccess] = createSignal('')
  let commentTextArea: HTMLTextAreaElement | undefined
  let synchronizedStateKey: string | null = null
  let disposed = false

  const isMaintenance = createMemo(() => availability.state.kind === 'maintenance')
  const currentComment = createMemo(() =>
    availability.state.kind === 'maintenance' ? availability.state.comment : ''
  )
  const updatedAt = createMemo(() => {
    const state = availability.state
    return state.kind === 'operational' || state.kind === 'maintenance' ? state.updatedAt : null
  })
  const normalizedComment = createMemo(() => normalizeMaintenanceComment(comment()))
  const commentCodePointCount = createMemo(() =>
    countMaintenanceCommentCodePoints(normalizedComment())
  )
  const commentErrorMessage = createMemo(() => {
    const error = commentError()
    return error === null ? '' : MAINTENANCE_COMMENT_ERROR_MESSAGES[error]
  })
  const isSubmitting = createMemo(() => pendingAction() !== null)
  const isUpdateDisabled = createMemo(
    () => isSubmitting() || isMaintenanceCommentUnchanged(comment(), currentComment())
  )

  createEffect(() => {
    const state = availability.state
    if (state.kind !== 'operational' && state.kind !== 'maintenance') return

    const nextStateKey =
      state.kind === 'maintenance'
        ? `${state.kind}\u0000${state.updatedAt ?? ''}\u0000${state.comment}`
        : `${state.kind}\u0000${state.updatedAt}`
    if (nextStateKey === synchronizedStateKey) return

    synchronizedStateKey = nextStateKey
    setComment(state.kind === 'maintenance' ? state.comment : '')
    setCommentError(null)
  })

  /**
   * 管理画面を開いた時点のAPI状態を取得し、操作前に共通Storeと表示を同期する。
   *
   * @returns 状態確認の完了後に解決されるPromise。
   */
  const synchronizeMaintenanceStatus = async (): Promise<void> => {
    setStatusSyncState('loading')
    const result = await refreshAvailability()
    if (disposed) return

    setStatusSyncState(result.type === 'success' ? 'ready' : 'error')
  }

  onMount(() => {
    const unsubscribeSystemStatusApplied = subscribeSystemStatusApplied(() => {
      if (!disposed && statusSyncState() === 'error') {
        setStatusSyncState('ready')
      }
    })
    void synchronizeMaintenanceStatus()

    onCleanup(() => {
      disposed = true
      unsubscribeSystemStatusApplied()
    })
  })

  /**
   * コメント入力に応じて、入力値と操作フィードバックを更新する。
   *
   * @param value - textareaへ入力された値。
   * @returns なし。
   */
  const handleCommentChange = (value: string): void => {
    setComment(value)
    setCommentError(null)
    setActionError('')
    setActionSuccess('')
  }

  /**
   * 操作内容を検証し、API送信値を固定した確認ダイアログを開く。
   *
   * @param action - 確認する開始、コメント更新、終了操作。
   * @returns なし。
   */
  const requestConfirmation = (action: MaintenanceAction): void => {
    if (isSubmitting()) return

    setActionError('')
    setActionSuccess('')

    if (action === 'end') {
      setConfirmation({ action, comment: '' })
      return
    }

    const validation = validateMaintenanceComment(comment(), { required: true })
    if (validation.error !== null) {
      setCommentError(validation.error)
      queueMicrotask(() => commentTextArea?.focus())
      return
    }

    setComment(validation.value)
    setCommentError(null)
    setConfirmation({ action, comment: validation.value })
  }

  /**
   * 状態に対応する開始またはコメント更新操作をフォーム送信から確認する。
   *
   * @param event - メンテナンスコメントフォームの送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    requestConfirmation(isMaintenance() ? 'update' : 'start')
  }

  /**
   * 確認ダイアログの閉鎖要求を処理する。
   *
   * @param open - ダイアログを開く場合はtrue。
   * @returns なし。
   */
  const handleConfirmationOpenChange = (open: boolean): void => {
    if (!open && !isSubmitting()) {
      setConfirmation(null)
    }
  }

  /**
   * 確認済みのメンテナンス操作を一度だけAPIへ送信する。
   *
   * @returns API処理完了後に解決するPromise。
   */
  const handleConfirm = async (): Promise<void> => {
    const confirmed = confirmation()
    if (confirmed === null || pendingAction() !== null) return

    const copy = ADMIN_MAINTENANCE_ACTION_COPY[confirmed.action]
    setPendingAction(confirmed.action)
    setActionError('')
    setActionSuccess('')

    try {
      const response = await updateMaintenance(
        buildMaintenanceUpdateRequest(confirmed.action, confirmed.comment)
      )
      applySystemStatus(response)
      setComment(response.comment)
      setCommentError(null)
      setConfirmation(null)
      setActionSuccess(copy.success)
    } catch (error) {
      setConfirmation(null)
      setActionError(toUserFriendlyErrorMessage(error, copy.failure))
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <h1 class="text-2xl font-semibold text-text">{ADMIN_MAINTENANCE_COPY.heading}</h1>

      <Show
        when={statusSyncState() === 'ready'}
        fallback={
          <Show
            when={statusSyncState() === 'error'}
            fallback={
              <div class="flex min-h-48 items-center justify-center" aria-busy="true">
                <Loading />
                <span class="sr-only">{ADMIN_MAINTENANCE_COPY.loadingStatus}</span>
              </div>
            }
          >
            <section
              class="rounded-lg border border-danger-border bg-danger-bg p-4"
              aria-label={ADMIN_MAINTENANCE_COPY.statusLoadFailed}
            >
              <p class="text-sm text-danger" role="alert">
                {ADMIN_MAINTENANCE_COPY.statusLoadFailed}
              </p>
              <AppButton
                variant="surface"
                class="mt-3"
                onClick={() => void synchronizeMaintenanceStatus()}
              >
                {MAINTENANCE_RECHECK_BUTTON_LABEL}
              </AppButton>
            </section>
          </Show>
        }
      >
        <MaintenanceStatusSummary maintenance={isMaintenance()} updatedAt={updatedAt()} />

        <form
          class="rounded-lg border border-border bg-surface p-4 sm:p-5"
          aria-busy={isSubmitting()}
          onSubmit={handleSubmit}
          novalidate
        >
          <TextField
            value={comment()}
            onChange={handleCommentChange}
            required
            disabled={isSubmitting()}
            validationState={commentError() === null ? undefined : 'invalid'}
          >
            <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <TextField.Label class="block text-sm font-medium text-text-muted">
                {ADMIN_MAINTENANCE_COPY.commentLabel}
              </TextField.Label>
              <TextField.Description
                class={`text-sm ${
                  commentCodePointCount() > MAINTENANCE_COMMENT_MAX_CODE_POINTS
                    ? 'font-semibold text-danger'
                    : 'text-text-muted'
                }`}
              >
                {commentCodePointCount()} / {MAINTENANCE_COMMENT_MAX_CODE_POINTS}
              </TextField.Description>
            </div>
            <TextField.TextArea
              ref={(element) => {
                commentTextArea = element
              }}
              name="maintenance-comment"
              rows={ADMIN_MAINTENANCE_COMMENT_ROWS}
              placeholder={ADMIN_MAINTENANCE_COPY.commentPlaceholder}
              class={`mt-2 ${COMMENT_TEXT_AREA_CLASS}`}
            />
            <TextField.ErrorMessage class="mt-2 text-sm text-danger" role="alert">
              {commentErrorMessage()}
            </TextField.ErrorMessage>
          </TextField>

          <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Show
              when={isMaintenance()}
              fallback={
                <AppButton type="submit" variant="danger" disabled={isSubmitting()}>
                  {ADMIN_MAINTENANCE_COPY.startButton}
                </AppButton>
              }
            >
              <AppButton type="submit" variant="primary" disabled={isUpdateDisabled()}>
                {ADMIN_MAINTENANCE_COPY.updateButton}
              </AppButton>
              <AppButton
                variant="success"
                disabled={isSubmitting()}
                onClick={() => requestConfirmation('end')}
              >
                {ADMIN_MAINTENANCE_COPY.endButton}
              </AppButton>
            </Show>
          </div>

          <Show when={actionError()}>
            <p class="mt-3 text-sm text-danger" role="alert">
              {actionError()}
            </p>
          </Show>
          <Show when={actionSuccess()}>
            <p class="mt-3 text-sm text-success" role="status">
              {actionSuccess()}
            </p>
          </Show>
        </form>

        <AlertDialog open={confirmation() !== null} onOpenChange={handleConfirmationOpenChange}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
            <Show when={confirmation()} keyed>
              {(confirmed) => {
                const copy = ADMIN_MAINTENANCE_ACTION_COPY[confirmed.action]
                return (
                  <AlertDialog.Content class="fixed inset-x-4 top-4 bottom-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg bg-surface p-5 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:max-h-[90dvh] sm:w-[90vw] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
                    <AlertDialog.Title class="shrink-0 text-lg font-bold text-text">
                      {copy.title}
                    </AlertDialog.Title>

                    <div class="min-h-0 flex-1 overflow-y-auto">
                      <AlertDialog.Description class="mt-2 text-sm text-text-muted">
                        {copy.description}
                      </AlertDialog.Description>

                      <Show when={confirmed.action !== 'end'}>
                        <section
                          class="mt-4 rounded-md border border-border bg-surface-muted p-3"
                          aria-label={ADMIN_MAINTENANCE_COPY.commentPreview}
                        >
                          <h2 class="text-xs font-semibold text-text-muted">
                            {ADMIN_MAINTENANCE_COPY.commentPreview}
                          </h2>
                          <p class="mt-2 whitespace-pre-wrap break-words text-sm text-text">
                            {confirmed.comment}
                          </p>
                        </section>
                      </Show>
                    </div>

                    <div class="mt-5 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <AppButton
                        disabled={isSubmitting()}
                        onClick={() => handleConfirmationOpenChange(false)}
                      >
                        {ADMIN_MAINTENANCE_COPY.cancelButton}
                      </AppButton>
                      <AppButton
                        variant={
                          confirmed.action === 'start'
                            ? 'danger'
                            : confirmed.action === 'end'
                              ? 'success'
                              : 'primary'
                        }
                        disabled={isSubmitting()}
                        aria-busy={pendingAction() === confirmed.action}
                        onClick={() => void handleConfirm()}
                      >
                        {pendingAction() === confirmed.action
                          ? ADMIN_MAINTENANCE_COPY.submitting
                          : copy.confirmButton}
                      </AppButton>
                    </div>
                  </AlertDialog.Content>
                )
              }}
            </Show>
          </AlertDialog.Portal>
        </AlertDialog>
      </Show>
    </div>
  )
}

export default AdminMaintenancePage
