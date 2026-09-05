import { AlertDialog } from '@kobalte/core/alert-dialog'
import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { Pencil, Plus, Trash2 } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { createVersion, deleteVersion, fetchAdminVersions, renameVersion } from '../../api/versions'
import { LoadError, Loading } from '../../components'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { showSuccessToast } from '../../components/common/AppToast'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { CreateVersionRequestDTO, VersionDTO } from '../../types/api'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  ADMIN_VERSIONS_COPY,
  formatVersionDeleteLabel,
  formatVersionDeleteTargetMessage,
  formatVersionEditLabel,
  VERSION_INPUT_CONSTRAINTS,
} from './AdminVersionsPage.constants'

type VersionFormMode = 'create' | 'edit'

type VersionFormDialogProps = {
  open: boolean
  mode: VersionFormMode
  version: VersionDTO | null
  saving: boolean
  errorMessage: string
  onOpenChange: (open: boolean) => void
  onSubmit: (request: CreateVersionRequestDTO) => void
}

type VersionDeleteDialogProps = {
  version: VersionDTO | null
  deleting: boolean
  errorMessage: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

const VERSION_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans text-base text-text outline-none transition hover:border-input-border-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

/**
 * 編集対象からフォーム初期値を生成する。
 *
 * APIが日時形式で返してもdate入力に載るよう日付部分だけに正規化する。
 *
 * @param version - 編集対象。新規作成時はnull。
 * @returns バージョンフォームの初期値。
 */
const buildVersionFormValue = (version: VersionDTO | null): CreateVersionRequestDTO => ({
  name: version?.name ?? '',
  released_at: version?.released_at.slice(0, 10) ?? '',
})

/**
 * APIから返された稼働日を表示・datetime属性用の日付部分に正規化する。
 *
 * @param releasedAt - APIから返された稼働日。
 * @returns YYYY-MM-DD形式の稼働日。
 */
const toDisplayReleasedAt = (releasedAt: string): string => releasedAt.slice(0, 10)

/**
 * バージョン追加・改名フォームを表示する。
 *
 * @param props - フォーム種別、対象バージョン、送信状態とイベント。
 * @returns バージョン編集ダイアログ。
 */
const VersionFormDialog: Component<VersionFormDialogProps> = (props): JSX.Element => {
  const [formValue, setFormValue] = createSignal(buildVersionFormValue(props.version))

  createEffect(() => {
    if (props.open) {
      setFormValue(buildVersionFormValue(props.version))
    }
  })

  /**
   * フォームの指定フィールドを更新する。
   *
   * @param field - 更新するフィールド名。
   * @param value - 入力された値。
   * @returns なし。
   */
  const updateField = (field: keyof CreateVersionRequestDTO, value: string): void => {
    setFormValue((current) => ({ ...current, [field]: value }))
  }

  /**
   * 入力値を正規化して親コンポーネントへ渡す。
   *
   * @param event - フォーム送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    const current = formValue()
    props.onSubmit({ name: current.name.trim(), released_at: current.released_at })
  }

  /**
   * 空白のみの送信を防ぐために保存可否を判定する。
   *
   * @returns 保存できない場合は true。
   */
  const isSubmitDisabled = (): boolean =>
    props.saving ||
    formValue().name.trim().length === 0 ||
    (props.mode === 'create' && formValue().released_at.length === 0)

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface p-6 shadow-lg">
          <Dialog.Title class="shrink-0 text-lg font-bold text-text">
            {props.mode === 'create'
              ? ADMIN_VERSIONS_COPY.createDialogTitle
              : ADMIN_VERSIONS_COPY.editDialogTitle}
          </Dialog.Title>
          <Dialog.Description class="mt-1 shrink-0 text-sm text-text-muted">
            {props.mode === 'create'
              ? ADMIN_VERSIONS_COPY.createDialogDescription
              : ADMIN_VERSIONS_COPY.editDialogDescription}
          </Dialog.Description>

          <form class="mt-5 flex min-h-0 flex-col" onSubmit={handleSubmit} aria-busy={props.saving}>
            <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <TextField required>
                <TextField.Label class="mb-1 block text-sm font-medium text-text-muted">
                  {ADMIN_VERSIONS_COPY.nameLabel}
                </TextField.Label>
                <TextField.Input
                  name="version-name"
                  value={formValue().name}
                  maxLength={VERSION_INPUT_CONSTRAINTS.nameMaxLength}
                  pattern={VERSION_INPUT_CONSTRAINTS.namePattern}
                  required
                  disabled={props.saving}
                  onInput={(event) => updateField('name', event.currentTarget.value)}
                  class={VERSION_INPUT_CLASS}
                />
              </TextField>

              <Show when={props.mode === 'create'}>
                <TextField required>
                  <TextField.Label class="mb-1 block text-sm font-medium text-text-muted">
                    {ADMIN_VERSIONS_COPY.releasedAtLabel}
                  </TextField.Label>
                  <TextField.Input
                    name="released-at"
                    type="date"
                    value={formValue().released_at}
                    required
                    disabled={props.saving}
                    onInput={(event) => updateField('released_at', event.currentTarget.value)}
                    class={VERSION_INPUT_CLASS}
                  />
                </TextField>
              </Show>

              <Show when={props.errorMessage}>
                <p
                  class="rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
                  role="alert"
                >
                  {props.errorMessage}
                </p>
              </Show>
            </div>

            <div class="mt-5 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AppButton disabled={props.saving} onClick={() => props.onOpenChange(false)}>
                {ADMIN_VERSIONS_COPY.cancelButton}
              </AppButton>
              <AppButton type="submit" variant="primary" disabled={isSubmitDisabled()}>
                {props.saving
                  ? ADMIN_VERSIONS_COPY.saving
                  : props.mode === 'create'
                    ? ADMIN_VERSIONS_COPY.createSubmit
                    : ADMIN_VERSIONS_COPY.saveSubmit}
              </AppButton>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

/**
 * 最新バージョンの削除確認を表示する。
 *
 * @param props - 削除対象、進行状態と確認イベント。
 * @returns 削除確認ダイアログ。
 */
const VersionDeleteDialog: Component<VersionDeleteDialogProps> = (props): JSX.Element => (
  <AlertDialog open={props.version !== null} onOpenChange={props.onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
      <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
        <AlertDialog.Title class="text-lg font-bold text-text">
          {ADMIN_VERSIONS_COPY.deleteDialogTitle}
        </AlertDialog.Title>
        <AlertDialog.Description class="mt-2 text-sm text-text-muted">
          {formatVersionDeleteTargetMessage(props.version?.name ?? '')}
          {ADMIN_VERSIONS_COPY.deleteDialogDescription}
        </AlertDialog.Description>

        <Show when={props.errorMessage}>
          <p
            class="mt-4 rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {props.errorMessage}
          </p>
        </Show>

        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AppButton disabled={props.deleting} onClick={() => props.onOpenChange(false)}>
            {ADMIN_VERSIONS_COPY.cancelButton}
          </AppButton>
          <AppButton variant="danger" disabled={props.deleting} onClick={props.onConfirm}>
            {props.deleting ? ADMIN_VERSIONS_COPY.deleting : ADMIN_VERSIONS_COPY.deleteSubmit}
          </AppButton>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog>
)

/**
 * 管理者向けバージョン一覧と編集操作を表示する。
 *
 * @returns バージョン管理画面。
 */
const AdminVersionsPage = (): JSX.Element => {
  useDocumentTitle(ADMIN_VERSIONS_COPY.pageTitle)

  const [refreshKey, setRefreshKey] = createSignal(0)
  const [formMode, setFormMode] = createSignal<VersionFormMode | null>(null)
  const [editingVersion, setEditingVersion] = createSignal<VersionDTO | null>(null)
  const [deletingVersion, setDeletingVersion] = createSignal<VersionDTO | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [deleting, setDeleting] = createSignal(false)
  const [formError, setFormError] = createSignal('')
  const [deleteError, setDeleteError] = createSignal('')

  const [versionsResponse] = createResource(() => refreshKey(), fetchAdminVersions)
  // APIの並び順に依存せず、稼働日昇順・ID順で表示と最新判定を一致させる。
  const versions = createMemo(() =>
    [...(versionsResponse() ?? [])].sort(
      (left, right) => left.released_at.localeCompare(right.released_at, 'ja') || left.id - right.id
    )
  )
  const latestVersionId = createMemo(() => {
    const values = versions()
    return values[values.length - 1]?.id ?? null
  })

  /** バージョン一覧を再取得する。 */
  const refresh = (): void => {
    setRefreshKey((current) => current + 1)
  }

  /** バージョン追加ダイアログを開く。 */
  const openCreateDialog = (): void => {
    setEditingVersion(null)
    setFormError('')
    setFormMode('create')
  }

  /**
   * バージョン改名ダイアログを開く。
   *
   * @param version - 編集するバージョン。
   */
  const openEditDialog = (version: VersionDTO): void => {
    setEditingVersion(version)
    setFormError('')
    setFormMode('edit')
  }

  /**
   * バージョンフォームの開閉状態を反映する。
   *
   * @param open - 次の開閉状態。
   */
  const handleFormOpenChange = (open: boolean): void => {
    if (open || saving()) return
    setFormMode(null)
    setEditingVersion(null)
    setFormError('')
  }

  /**
   * バージョン追加・改名を実行する。
   *
   * @param request - 正規化済みフォーム値。
   * @returns 保存完了時に解決するPromise。
   */
  const handleFormSubmit = async (request: CreateVersionRequestDTO): Promise<void> => {
    const mode = formMode()
    const version = editingVersion()
    if (mode === null || (mode === 'edit' && version === null)) return

    setFormError('')
    setSaving(true)
    try {
      if (mode === 'create') {
        await createVersion(request)
        showSuccessToast(ADMIN_VERSIONS_COPY.createSuccess)
      } else if (version) {
        await renameVersion(version.id, { name: request.name })
        showSuccessToast(ADMIN_VERSIONS_COPY.editSuccess)
      }
      setFormMode(null)
      setEditingVersion(null)
      refresh()
    } catch (error) {
      setFormError(
        toUserFriendlyErrorMessage(
          error,
          mode === 'create' ? ADMIN_VERSIONS_COPY.createError : ADMIN_VERSIONS_COPY.editError
        )
      )
    } finally {
      setSaving(false)
    }
  }

  /**
   * 最新バージョンの削除確認を開く。
   *
   * @param version - 削除候補の最新バージョン。
   */
  const openDeleteDialog = (version: VersionDTO): void => {
    setDeleteError('')
    setDeletingVersion(version)
  }

  /**
   * 削除確認の開閉状態を反映する。
   *
   * @param open - 次の開閉状態。
   */
  const handleDeleteOpenChange = (open: boolean): void => {
    if (open || deleting()) return
    setDeletingVersion(null)
    setDeleteError('')
  }

  /** 最新バージョンの削除を実行する。 */
  const handleDelete = async (): Promise<void> => {
    const version = deletingVersion()
    if (!version) return

    setDeleteError('')
    setDeleting(true)
    try {
      await deleteVersion(version.id)
      showSuccessToast(ADMIN_VERSIONS_COPY.deleteSuccess)
      setDeletingVersion(null)
      refresh()
    } catch (error) {
      setDeleteError(toUserFriendlyErrorMessage(error, ADMIN_VERSIONS_COPY.deleteError))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main class="mx-auto w-full max-w-5xl space-y-4 p-4">
      <header class="flex items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">{ADMIN_VERSIONS_COPY.pageTitle}</h1>
          <p class="mt-1 text-sm text-text-muted">{ADMIN_VERSIONS_COPY.pageDescription}</p>
        </div>
        <AppButton
          variant="primary"
          leftIcon={<Plus class="h-4 w-4" aria-hidden="true" />}
          onClick={openCreateDialog}
        >
          {ADMIN_VERSIONS_COPY.createButton}
        </AppButton>
      </header>

      <Show when={!versionsResponse.loading} fallback={<Loading />}>
        <Show
          when={!versionsResponse.error}
          fallback={<LoadError error={versionsResponse.error} />}
        >
          <div class="overflow-x-auto rounded-lg border border-border bg-surface">
            <table class="min-w-full text-sm">
              <thead class="bg-surface-muted">
                <tr>
                  <th class="w-0 whitespace-nowrap px-3 py-2 text-left">
                    {ADMIN_VERSIONS_COPY.actionsHeading}
                  </th>
                  <th class="px-3 py-2 text-left">{ADMIN_VERSIONS_COPY.nameLabel}</th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">
                    {ADMIN_VERSIONS_COPY.releasedAtLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={versions()}>
                  {(version) => (
                    <tr class="border-t border-border">
                      <td class="w-0 whitespace-nowrap px-3 py-2">
                        <div class="flex gap-2">
                          <AppIconButton
                            aria-label={formatVersionEditLabel(version.name)}
                            title={ADMIN_VERSIONS_COPY.editAction}
                            onClick={() => openEditDialog(version)}
                          >
                            <Pencil class="h-4 w-4" aria-hidden="true" />
                          </AppIconButton>
                          <Show when={version.id === latestVersionId()}>
                            <AppIconButton
                              tone="danger"
                              aria-label={formatVersionDeleteLabel(version.name)}
                              title={ADMIN_VERSIONS_COPY.deleteAction}
                              onClick={() => openDeleteDialog(version)}
                            >
                              <Trash2 class="h-4 w-4" aria-hidden="true" />
                            </AppIconButton>
                          </Show>
                        </div>
                      </td>
                      <td class="px-3 py-2 font-sans">
                        <div class="flex flex-wrap items-center gap-2">
                          <span>{version.name}</span>
                          <Show when={version.id === latestVersionId()}>
                            <span class="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                              {ADMIN_VERSIONS_COPY.latestLabel}
                            </span>
                          </Show>
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 font-jost">
                        <time datetime={toDisplayReleasedAt(version.released_at)}>
                          {toDisplayReleasedAt(version.released_at)}
                        </time>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <Show when={versions().length === 0}>
            <p class="text-sm text-text-subtle">{ADMIN_VERSIONS_COPY.emptyState}</p>
          </Show>
        </Show>
      </Show>

      <VersionFormDialog
        open={formMode() !== null}
        mode={formMode() ?? 'create'}
        version={editingVersion()}
        saving={saving()}
        errorMessage={formError()}
        onOpenChange={handleFormOpenChange}
        onSubmit={(request) => void handleFormSubmit(request)}
      />
      <VersionDeleteDialog
        version={deletingVersion()}
        deleting={deleting()}
        errorMessage={deleteError()}
        onOpenChange={handleDeleteOpenChange}
        onConfirm={() => void handleDelete()}
      />
    </main>
  )
}

export default AdminVersionsPage
