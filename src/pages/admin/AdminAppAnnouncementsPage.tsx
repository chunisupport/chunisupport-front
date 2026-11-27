import { TextField } from '@kobalte/core/text-field'
import { createQuery } from '@tanstack/solid-query'
import Pencil from 'lucide-solid/icons/pencil'
import Plus from 'lucide-solid/icons/plus'
import Trash2 from 'lucide-solid/icons/trash-2'
import type { Component, JSX } from 'solid-js'
import { createEffect, createSignal, For, Match, Show, Switch } from 'solid-js'
import { LoadError, Loading } from '../../components'
import { AppAnnouncementKindIcon } from '../../components/appAnnouncements/AppAnnouncementBanner'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { AppConfirmDialog } from '../../components/common/AppConfirmDialog'
import { AppDialog } from '../../components/common/AppDialog'
import { SegmentedToggleGroup } from '../../components/common/AppTabs'
import { showSuccessToast } from '../../components/common/AppToast'
import { CheckboxField } from '../../components/common/CheckboxField'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  adminAppAnnouncementsQueryOptions,
  createAppAnnouncement,
  deleteAppAnnouncement,
  updateAppAnnouncement,
} from '../../queries/appAnnouncements'
import type { AppAnnouncementDTO, AppAnnouncementRequestDTO } from '../../types/api'
import { resolveAppAnnouncementAction } from '../../utils/appAnnouncement'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { formatJstDateTimeMinute } from '../../utils/jstDateTime'
import {
  ADMIN_APP_ANNOUNCEMENTS_COPY,
  APP_ANNOUNCEMENT_INPUT_LIMITS,
  APP_ANNOUNCEMENT_KIND_OPTIONS,
  APP_ANNOUNCEMENT_STATUS_CLASSES,
  APP_ANNOUNCEMENT_STATUS_LABELS,
  formatAppAnnouncementDeleteLabel,
  formatAppAnnouncementDeleteTargetMessage,
  formatAppAnnouncementEditLabel,
} from './AdminAppAnnouncementsPage.constants'
import {
  type AppAnnouncementFormValue,
  buildAppAnnouncementFormValue,
  buildAppAnnouncementRequest,
  getAppAnnouncementFormErrors,
  getAppAnnouncementStatus,
} from './adminAppAnnouncement'

/** スクロール領域内の入力欄。フォーカスリングは内側に出す */
const ANNOUNCEMENT_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans text-base text-text outline-none transition hover:border-input-border-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

const FIELD_LABEL_CLASS = 'mb-1 block text-sm font-medium text-text-muted'

const FIELD_ERROR_CLASS = 'mt-1 block text-sm text-danger'

type AnnouncementFormDialogProps = {
  open: boolean
  announcement: AppAnnouncementDTO | null
  saving: boolean
  errorMessage: string
  onOpenChange: (open: boolean) => void
  onSubmit: (request: AppAnnouncementRequestDTO, bumpRevision: boolean) => void
}

/**
 * お知らせの追加・編集フォームを表示する。
 *
 * @param props - 編集対象（追加時はnull）、送信状態とイベント。
 * @returns お知らせ編集ダイアログ。
 */
const AnnouncementFormDialog: Component<AnnouncementFormDialogProps> = (props): JSX.Element => {
  const [formValue, setFormValue] = createSignal(buildAppAnnouncementFormValue(null))
  const [bumpRevision, setBumpRevision] = createSignal(false)

  createEffect(() => {
    if (props.open) {
      setFormValue(buildAppAnnouncementFormValue(props.announcement))
      setBumpRevision(false)
    }
  })

  const request = () => buildAppAnnouncementRequest(formValue())
  const errors = () => getAppAnnouncementFormErrors(formValue())

  /**
   * フォームの指定フィールドを更新する。
   *
   * @param field - 更新するフィールド名。
   * @param value - 入力された値。
   * @returns なし。
   */
  const updateField = <K extends keyof AppAnnouncementFormValue>(
    field: K,
    value: AppAnnouncementFormValue[K]
  ): void => {
    setFormValue((current) => ({ ...current, [field]: value }))
  }

  /**
   * 正規化済みのリクエストを親コンポーネントへ渡す。
   *
   * @param event - フォーム送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    const current = request()
    if (current) props.onSubmit(current, bumpRevision())
  }

  return (
    <AppDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      preventScroll={false}
      pending={props.saving}
      size="lg"
      height="max90"
      title={
        props.announcement
          ? ADMIN_APP_ANNOUNCEMENTS_COPY.editDialogTitle
          : ADMIN_APP_ANNOUNCEMENTS_COPY.createDialogTitle
      }
    >
      <form class="mt-5 flex min-h-0 flex-col" onSubmit={handleSubmit} aria-busy={props.saving}>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div>
            <span class={FIELD_LABEL_CLASS}>{ADMIN_APP_ANNOUNCEMENTS_COPY.kindLabel}</span>
            <SegmentedToggleGroup
              options={APP_ANNOUNCEMENT_KIND_OPTIONS}
              value={formValue().kind}
              onChange={(kind) => updateField('kind', kind)}
              ariaLabel={ADMIN_APP_ANNOUNCEMENTS_COPY.kindLabel}
            />
          </div>

          <TextField required>
            <TextField.Label class={FIELD_LABEL_CLASS}>
              {ADMIN_APP_ANNOUNCEMENTS_COPY.titleLabel}
            </TextField.Label>
            <TextField.Input
              name="announcement-title"
              value={formValue().title}
              maxLength={APP_ANNOUNCEMENT_INPUT_LIMITS.titleMaxLength}
              required
              disabled={props.saving}
              onInput={(event) => updateField('title', event.currentTarget.value)}
              class={ANNOUNCEMENT_INPUT_CLASS}
            />
          </TextField>

          <Show
            when={formValue().kind === 'message'}
            fallback={
              <TextField required validationState={errors().targetUrl ? 'invalid' : 'valid'}>
                <TextField.Label class={FIELD_LABEL_CLASS}>
                  {ADMIN_APP_ANNOUNCEMENTS_COPY.targetUrlLabel}
                </TextField.Label>
                <TextField.Input
                  name="announcement-target-url"
                  value={formValue().targetUrl}
                  maxLength={APP_ANNOUNCEMENT_INPUT_LIMITS.targetUrlMaxLength}
                  placeholder={ADMIN_APP_ANNOUNCEMENTS_COPY.targetUrlPlaceholder}
                  required
                  disabled={props.saving}
                  onInput={(event) => updateField('targetUrl', event.currentTarget.value)}
                  class={ANNOUNCEMENT_INPUT_CLASS}
                />
                <TextField.ErrorMessage class={FIELD_ERROR_CLASS}>
                  {ADMIN_APP_ANNOUNCEMENTS_COPY.targetUrlInvalid}
                </TextField.ErrorMessage>
              </TextField>
            }
          >
            <TextField required>
              <TextField.Label class={FIELD_LABEL_CLASS}>
                {ADMIN_APP_ANNOUNCEMENTS_COPY.bodyLabel}
              </TextField.Label>
              <TextField.TextArea
                name="announcement-body"
                value={formValue().body}
                rows={APP_ANNOUNCEMENT_INPUT_LIMITS.bodyRows}
                maxLength={APP_ANNOUNCEMENT_INPUT_LIMITS.bodyMaxLength}
                required
                disabled={props.saving}
                onInput={(event) => updateField('body', event.currentTarget.value)}
                class={`resize-y ${ANNOUNCEMENT_INPUT_CLASS}`}
              />
            </TextField>
          </Show>

          <div class="grid gap-4 sm:grid-cols-2">
            <TextField required>
              <TextField.Label class={FIELD_LABEL_CLASS}>
                {ADMIN_APP_ANNOUNCEMENTS_COPY.startsAtLabel}
              </TextField.Label>
              <TextField.Input
                name="announcement-starts-at"
                type="datetime-local"
                value={formValue().startsAt}
                required
                disabled={props.saving}
                onInput={(event) => updateField('startsAt', event.currentTarget.value)}
                class={ANNOUNCEMENT_INPUT_CLASS}
              />
            </TextField>
            <TextField required validationState={errors().expiresAt ? 'invalid' : 'valid'}>
              <TextField.Label class={FIELD_LABEL_CLASS}>
                {ADMIN_APP_ANNOUNCEMENTS_COPY.expiresAtLabel}
              </TextField.Label>
              <TextField.Input
                name="announcement-expires-at"
                type="datetime-local"
                value={formValue().expiresAt}
                min={formValue().startsAt}
                required
                disabled={props.saving}
                onInput={(event) => updateField('expiresAt', event.currentTarget.value)}
                class={ANNOUNCEMENT_INPUT_CLASS}
              />
              <TextField.ErrorMessage class={FIELD_ERROR_CLASS}>
                {ADMIN_APP_ANNOUNCEMENTS_COPY.periodInvalid}
              </TextField.ErrorMessage>
            </TextField>
          </div>

          <Show when={props.announcement}>
            <CheckboxField
              checked={bumpRevision()}
              disabled={props.saving}
              onChange={setBumpRevision}
              label={ADMIN_APP_ANNOUNCEMENTS_COPY.bumpRevisionLabel}
            />
          </Show>
        </div>

        <Show when={props.errorMessage}>
          <p
            class="mt-4 shrink-0 rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {props.errorMessage}
          </p>
        </Show>

        <div class="mt-5 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AppButton disabled={props.saving} onClick={() => props.onOpenChange(false)}>
            {ADMIN_APP_ANNOUNCEMENTS_COPY.cancelButton}
          </AppButton>
          <AppButton type="submit" variant="primary" disabled={props.saving || !request()}>
            {props.saving
              ? ADMIN_APP_ANNOUNCEMENTS_COPY.saving
              : props.announcement
                ? ADMIN_APP_ANNOUNCEMENTS_COPY.saveSubmit
                : ADMIN_APP_ANNOUNCEMENTS_COPY.createSubmit}
          </AppButton>
        </div>
      </form>
    </AppDialog>
  )
}

/**
 * 管理者向けのお知らせ一覧と追加・編集・削除の操作を表示する。
 *
 * @returns お知らせ管理画面。
 */
const AdminAppAnnouncementsPage = (): JSX.Element => {
  useDocumentTitle(ADMIN_APP_ANNOUNCEMENTS_COPY.pageTitle)

  const announcements = createQuery(() => adminAppAnnouncementsQueryOptions())
  const [formOpen, setFormOpen] = createSignal(false)
  const [editingAnnouncement, setEditingAnnouncement] = createSignal<AppAnnouncementDTO | null>(
    null
  )
  const [deletingAnnouncement, setDeletingAnnouncement] = createSignal<AppAnnouncementDTO | null>(
    null
  )
  const [saving, setSaving] = createSignal(false)
  const [deleting, setDeleting] = createSignal(false)
  const [formError, setFormError] = createSignal('')
  const [deleteError, setDeleteError] = createSignal('')

  /**
   * 追加または編集のダイアログを開く。
   *
   * @param announcement - 編集対象。追加の場合はnull。
   * @returns なし。
   */
  const openFormDialog = (announcement: AppAnnouncementDTO | null): void => {
    setEditingAnnouncement(announcement)
    setFormError('')
    setFormOpen(true)
  }

  /**
   * フォームの開閉状態を反映する。保存中は閉じない。
   *
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleFormOpenChange = (open: boolean): void => {
    if (open || saving()) return
    setFormOpen(false)
    setFormError('')
  }

  /**
   * お知らせを追加・更新する。
   *
   * @param request - 正規化済みのリクエスト。
   * @param bumpRevision - 閉じた利用者にも再表示させる場合は true。
   * @returns 保存完了時に解決するPromise。
   */
  const handleFormSubmit = async (
    request: AppAnnouncementRequestDTO,
    bumpRevision: boolean
  ): Promise<void> => {
    const editing = editingAnnouncement()
    setFormError('')
    setSaving(true)
    try {
      if (editing) {
        await updateAppAnnouncement(editing.id, { ...request, bump_revision: bumpRevision })
        showSuccessToast(ADMIN_APP_ANNOUNCEMENTS_COPY.editSuccess)
      } else {
        await createAppAnnouncement(request)
        showSuccessToast(ADMIN_APP_ANNOUNCEMENTS_COPY.createSuccess)
      }
      setFormOpen(false)
    } catch (error) {
      setFormError(
        toUserFriendlyErrorMessage(
          error,
          editing
            ? ADMIN_APP_ANNOUNCEMENTS_COPY.editError
            : ADMIN_APP_ANNOUNCEMENTS_COPY.createError
        )
      )
    } finally {
      setSaving(false)
    }
  }

  /**
   * 削除確認の開閉状態を反映する。削除中は閉じない。
   *
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleDeleteOpenChange = (open: boolean): void => {
    if (open || deleting()) return
    setDeletingAnnouncement(null)
    setDeleteError('')
  }

  /**
   * お知らせを削除する。
   *
   * @returns 削除完了時に解決するPromise。
   */
  const handleDelete = async (): Promise<void> => {
    const announcement = deletingAnnouncement()
    if (!announcement) return

    setDeleteError('')
    setDeleting(true)
    try {
      await deleteAppAnnouncement(announcement.id)
      showSuccessToast(ADMIN_APP_ANNOUNCEMENTS_COPY.deleteSuccess)
      setDeletingAnnouncement(null)
    } catch (error) {
      setDeleteError(toUserFriendlyErrorMessage(error, ADMIN_APP_ANNOUNCEMENTS_COPY.deleteError))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main class="mx-auto w-full max-w-5xl space-y-4 p-4">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">{ADMIN_APP_ANNOUNCEMENTS_COPY.pageTitle}</h1>
          <p class="mt-1 text-sm text-text-muted">{ADMIN_APP_ANNOUNCEMENTS_COPY.pageDescription}</p>
        </div>
        <AppButton
          variant="primary"
          leftIcon={<Plus class="h-4 w-4" aria-hidden="true" />}
          onClick={() => openFormDialog(null)}
        >
          {ADMIN_APP_ANNOUNCEMENTS_COPY.createButton}
        </AppButton>
      </header>

      <Switch>
        <Match when={announcements.error}>
          <LoadError error={announcements.error} />
        </Match>
        <Match when={announcements.isPending}>
          <Loading />
        </Match>
        <Match when={announcements.data?.length === 0}>
          <p class="text-sm text-text-subtle">{ADMIN_APP_ANNOUNCEMENTS_COPY.emptyState}</p>
        </Match>
        <Match when={announcements.data}>
          {(items) => (
            <div class="overflow-x-auto rounded-lg border border-border bg-surface">
              <table class="min-w-full text-sm">
                <thead class="bg-surface-muted">
                  <tr>
                    <th class="w-0 whitespace-nowrap px-3 py-2 text-left">
                      {ADMIN_APP_ANNOUNCEMENTS_COPY.actionsHeading}
                    </th>
                    <th class="whitespace-nowrap px-3 py-2 text-left">
                      {ADMIN_APP_ANNOUNCEMENTS_COPY.statusLabel}
                    </th>
                    <th class="px-3 py-2 text-left">{ADMIN_APP_ANNOUNCEMENTS_COPY.titleLabel}</th>
                    <th class="whitespace-nowrap px-3 py-2 text-left">
                      {ADMIN_APP_ANNOUNCEMENTS_COPY.periodLabel}
                    </th>
                    <th class="whitespace-nowrap px-3 py-2 text-right">
                      {ADMIN_APP_ANNOUNCEMENTS_COPY.revisionLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={items()}>
                    {(announcement) => {
                      const status = () => getAppAnnouncementStatus(announcement, new Date())
                      return (
                        <tr class="border-t border-border">
                          <td class="w-0 whitespace-nowrap px-3 py-2">
                            <div class="flex gap-2">
                              <AppIconButton
                                aria-label={formatAppAnnouncementEditLabel(announcement.title)}
                                title={ADMIN_APP_ANNOUNCEMENTS_COPY.editAction}
                                onClick={() => openFormDialog(announcement)}
                              >
                                <Pencil class="h-4 w-4" aria-hidden="true" />
                              </AppIconButton>
                              <AppIconButton
                                tone="danger"
                                aria-label={formatAppAnnouncementDeleteLabel(announcement.title)}
                                title={ADMIN_APP_ANNOUNCEMENTS_COPY.deleteAction}
                                onClick={() => {
                                  setDeleteError('')
                                  setDeletingAnnouncement(announcement)
                                }}
                              >
                                <Trash2 class="h-4 w-4" aria-hidden="true" />
                              </AppIconButton>
                            </div>
                          </td>
                          <td class="whitespace-nowrap px-3 py-2">
                            <span
                              class={`rounded-full border px-2 py-0.5 text-xs font-medium ${APP_ANNOUNCEMENT_STATUS_CLASSES[status()]}`}
                            >
                              {APP_ANNOUNCEMENT_STATUS_LABELS[status()]}
                            </span>
                          </td>
                          <td class="min-w-48 px-3 py-2 font-sans">
                            <div class="flex items-center gap-2">
                              <Show when={resolveAppAnnouncementAction(announcement)}>
                                {(action) => <AppAnnouncementKindIcon action={action()} />}
                              </Show>
                              <span class="break-words">{announcement.title}</span>
                            </div>
                          </td>
                          <td class="whitespace-nowrap px-3 py-2 font-jost">
                            <time datetime={announcement.starts_at}>
                              {formatJstDateTimeMinute(announcement.starts_at)}
                            </time>
                            {' 〜 '}
                            <time datetime={announcement.expires_at}>
                              {formatJstDateTimeMinute(announcement.expires_at)}
                            </time>
                          </td>
                          <td class="whitespace-nowrap px-3 py-2 text-right font-jost">
                            {announcement.revision}
                          </td>
                        </tr>
                      )
                    }}
                  </For>
                </tbody>
              </table>
            </div>
          )}
        </Match>
      </Switch>

      <AnnouncementFormDialog
        open={formOpen()}
        announcement={editingAnnouncement()}
        saving={saving()}
        errorMessage={formError()}
        onOpenChange={handleFormOpenChange}
        onSubmit={(request, bumpRevision) => void handleFormSubmit(request, bumpRevision)}
      />
      <AppConfirmDialog
        open={deletingAnnouncement() !== null}
        onOpenChange={handleDeleteOpenChange}
        title={ADMIN_APP_ANNOUNCEMENTS_COPY.deleteDialogTitle}
        description={
          <>
            {formatAppAnnouncementDeleteTargetMessage(deletingAnnouncement()?.title ?? '')}
            {ADMIN_APP_ANNOUNCEMENTS_COPY.deleteDialogDescription}
          </>
        }
        cancelLabel={ADMIN_APP_ANNOUNCEMENTS_COPY.cancelButton}
        confirmLabel={
          deleting()
            ? ADMIN_APP_ANNOUNCEMENTS_COPY.deleting
            : ADMIN_APP_ANNOUNCEMENTS_COPY.deleteSubmit
        }
        confirmVariant="danger"
        pending={deleting()}
        onConfirm={() => void handleDelete()}
      >
        <Show when={deleteError()}>
          <p
            class="mt-4 rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {deleteError()}
          </p>
        </Show>
      </AppConfirmDialog>
    </main>
  )
}

export default AdminAppAnnouncementsPage
