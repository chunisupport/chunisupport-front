import { AlertDialog } from '@kobalte/core/alert-dialog'
import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { A } from '@solidjs/router'
import { Check, FolderOpen, Pencil, Save, Trash2 } from 'lucide-solid'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import { Loading } from '../../../components'
import { LOGIN_PATH } from '../../../constants/routes'
import { authSession } from '../../../stores/authSession'
import { buildLoginRedirectPath } from '../../../usecases/auth/redirectPath'
import { buildCurrentPath } from '../../../utils/currentPath'
import {
  SAVED_RECORD_FILTER_DIALOG_CLASS,
  SAVED_RECORD_FILTER_DIALOG_TEXT,
} from './SavedRecordFiltersDialog.constants'
import {
  buildUniqueRecordFilterName,
  isRecordFilterPayloadWithinLimit,
  isValidRecordFilterName,
  RECORD_FILTER_NAME_MAX_LENGTH,
} from './savedRecordFilters'

/**
 * 保存済みレコードフィルター一覧の表示項目。
 */
export type SavedRecordFilterItem<TFilter> = {
  id: string
  name: string
  filter: TFilter | null
  schemaVersion: number
  isValid: boolean
  invalidReason?: string
}

/**
 * 保存済みレコードフィルターダイアログへ渡す操作と表示設定。
 */
type SavedRecordFiltersDialogProps<TFilter> = {
  open: boolean
  currentFilters: TFilter
  schemaVersion: number
  onApplyFilter: (filter: TFilter) => void
  onEditFilter: (filter: TFilter) => void
  loadFilters: () => Promise<SavedRecordFilterItem<TFilter>[]>
  createFilter: (name: string, filter: TFilter) => Promise<void>
  updateFilter: (id: string, name: string, filter: TFilter) => Promise<void>
  deleteFilter: (id: string) => Promise<void>
  /** 編集中フィルターの状態が変化したときに呼ばれる。null の場合は編集中でないことを示す。 */
  onEditingChange?: (editing: EditingFilter | null) => void
  /** フィルターダイアログ本体で編集中のフィルター名。保存時に内部名よりも優先される。 */
  editedFilterName?: string
}

/** 編集中の保存済みフィルター情報。 */
export type EditingFilter = {
  id: string
  name: string
}

/**
 * 現在の表示ページへ戻るログインURLを生成する。
 *
 * @returns redirect パラメータ付きログインURL。
 */
const buildCurrentLoginHref = (): string => {
  if (typeof window === 'undefined') return LOGIN_PATH
  return buildLoginRedirectPath(buildCurrentPath(window.location))
}

/**
 * 保存名入力値を API の最大文字数に丸める。
 *
 * @param value - 入力欄の値。
 * @returns 最大文字数以内の入力値。
 */
const limitNameInput = (value: string): string =>
  Array.from(value).slice(0, RECORD_FILTER_NAME_MAX_LENGTH).join('')

/**
 * 保存済みフィルターの保存、呼び出し、編集を行う共通ダイアログを表示する。
 *
 * @param props - フィルター状態、CRUD操作、保存済みフィルター適用ハンドラー。
 * @returns 保存済みフィルターダイアログの JSX 要素。
 */
export function SavedRecordFiltersDialog<TFilter>(props: SavedRecordFiltersDialogProps<TFilter>) {
  const [saveNameDialogOpen, setSaveNameDialogOpen] = createSignal(false)
  const [listDialogOpen, setListDialogOpen] = createSignal(false)
  const [saveName, setSaveName] = createSignal('')
  const [filtersList, setFiltersList] = createSignal<SavedRecordFilterItem<TFilter>[]>([])
  const [loading, setLoading] = createSignal(false)
  const [pendingAction, setPendingAction] = createSignal<string | null>(null)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [editingFilter, setEditingFilter] = createSignal<EditingFilter | null>(null)
  const [deleteTarget, setDeleteTarget] = createSignal<SavedRecordFilterItem<TFilter> | null>(null)

  const isAuthenticated = createMemo(() => authSession.status === 'authenticated')
  const shouldShowLoginLink = createMemo(
    () => authSession.status === 'unauthenticated' || authSession.status === 'error'
  )
  const loginHref = createMemo(buildCurrentLoginHref)
  const isPayloadWithinLimit = createMemo(() =>
    isRecordFilterPayloadWithinLimit(props.schemaVersion, props.currentFilters)
  )
  const canSubmitName = createMemo(
    () =>
      isValidRecordFilterName(saveName()) &&
      isPayloadWithinLimit() &&
      pendingAction() === null &&
      isAuthenticated()
  )

  createEffect(() => {
    if (props.open) return
    setSaveNameDialogOpen(false)
    setListDialogOpen(false)
    setDeleteTarget(null)
    setEditingFilter(null)
    setErrorMessage(null)
  })

  createEffect(() => {
    props.onEditingChange?.(editingFilter())
  })

  /**
   * 保存済みフィルター一覧をサーバーから再取得する。
   *
   * @returns 取得した保存済みフィルター一覧。
   */
  const reloadFilters = async (): Promise<SavedRecordFilterItem<TFilter>[]> => {
    if (!isAuthenticated()) return []
    setLoading(true)
    setErrorMessage(null)
    try {
      const loadedFilters = await props.loadFilters()
      setFiltersList(loadedFilters)
      return loadedFilters
    } catch {
      setErrorMessage(SAVED_RECORD_FILTER_DIALOG_TEXT.loadError)
      return []
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    if (!listDialogOpen() || !isAuthenticated()) return
    void reloadFilters()
  })

  /**
   * ペイロードサイズが API 制限内か確認する。
   *
   * @returns 保存可能なサイズの場合は true。
   */
  const validateCurrentPayload = (): boolean => {
    if (isPayloadWithinLimit()) return true
    setErrorMessage(SAVED_RECORD_FILTER_DIALOG_TEXT.payloadTooLarge)
    return false
  }

  /**
   * 新規保存名の入力ダイアログを開く。
   *
   * @returns なし。
   */
  const openSaveNameDialog = (): void => {
    if (!validateCurrentPayload()) return
    setSaveName('')
    setErrorMessage(null)
    setSaveNameDialogOpen(true)
  }

  /**
   * 保存済みフィルター一覧ダイアログを開く。
   *
   * @returns なし。
   */
  const openListDialog = (): void => {
    setErrorMessage(null)
    setListDialogOpen(true)
  }

  /**
   * 保存済みフィルターを適用してダイアログを閉じる。
   *
   * @param item - 適用対象の保存済みフィルター。
   * @returns なし。
   */
  const handleApplySavedFilter = (item: SavedRecordFilterItem<TFilter>): void => {
    if (!item.filter) return
    props.onApplyFilter(item.filter)
    setListDialogOpen(false)
  }

  /**
   * 保存済みフィルターを編集対象として読み込む。
   *
   * @param item - 編集対象の保存済みフィルター。
   * @returns なし。
   */
  const handleEditSavedFilter = (item: SavedRecordFilterItem<TFilter>): void => {
    if (!item.filter) return
    props.onEditFilter(item.filter)
    setEditingFilter({ id: item.id, name: item.name })
    setListDialogOpen(false)
  }

  /**
   * 新しい保存済みフィルターを作成する。
   *
   * @returns なし。
   */
  const handleSaveNewFilter = async (): Promise<void> => {
    const name = saveName().trim()
    if (!isValidRecordFilterName(name) || pendingAction() || !validateCurrentPayload()) return
    setPendingAction('create')
    setErrorMessage(null)
    try {
      const latestFilters = await props.loadFilters()
      setFiltersList(latestFilters)
      const uniqueName = buildUniqueRecordFilterName(
        name,
        latestFilters.map((item) => item.name)
      )
      await props.createFilter(uniqueName, props.currentFilters)
      setSaveName('')
      setSaveNameDialogOpen(false)
      await reloadFilters()
      setListDialogOpen(true)
    } catch {
      setErrorMessage(SAVED_RECORD_FILTER_DIALOG_TEXT.saveError)
    } finally {
      setPendingAction(null)
    }
  }

  /**
   * 編集中の保存済みフィルターを現在の条件で上書きする。
   *
   * @returns なし。
   */
  const handleSaveEditingFilter = async (): Promise<void> => {
    const editing = editingFilter()
    if (!editing || pendingAction() || !validateCurrentPayload()) return
    const name = props.editedFilterName ?? editing.name
    setPendingAction(`update:${editing.id}`)
    setErrorMessage(null)
    try {
      await props.updateFilter(editing.id, name, props.currentFilters)
      await reloadFilters()
      setEditingFilter(null)
      setListDialogOpen(true)
    } catch {
      setErrorMessage(SAVED_RECORD_FILTER_DIALOG_TEXT.updateError)
    } finally {
      setPendingAction(null)
    }
  }

  /**
   * 保存ボタン押下時に新規保存または編集中フィルターの更新へ分岐する。
   *
   * @returns なし。
   */
  const handleSaveButtonClick = (): void => {
    if (editingFilter()) {
      void handleSaveEditingFilter()
      return
    }
    openSaveNameDialog()
  }

  /**
   * 保存済みフィルターを削除する。
   *
   * @returns なし。
   */
  const handleDeleteSavedFilter = async (): Promise<void> => {
    const target = deleteTarget()
    if (!target || pendingAction()) return
    setPendingAction(`delete:${target.id}`)
    setErrorMessage(null)
    try {
      await props.deleteFilter(target.id)
      if (editingFilter()?.id === target.id) {
        setEditingFilter(null)
      }
      setDeleteTarget(null)
      await reloadFilters()
    } catch {
      setErrorMessage(SAVED_RECORD_FILTER_DIALOG_TEXT.deleteError)
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <>
      <div class="flex items-center gap-2">
        <Button
          type="button"
          class={SAVED_RECORD_FILTER_DIALOG_CLASS.secondaryButton}
          disabled={!isAuthenticated() || pendingAction() !== null}
          onClick={handleSaveButtonClick}
        >
          <div class="mb-0.5 flex items-center justify-center text-sm">
            <Save class="mr-1 h-4 w-4" aria-hidden="true" />
            <div>{SAVED_RECORD_FILTER_DIALOG_TEXT.save}</div>
          </div>
        </Button>
        <Show when={!editingFilter()}>
          <Button
            type="button"
            class={SAVED_RECORD_FILTER_DIALOG_CLASS.secondaryButton}
            disabled={!isAuthenticated() || pendingAction() !== null}
            onClick={openListDialog}
          >
            <div class="mb-0.5 flex items-center justify-center text-sm">
              <FolderOpen class="mr-1 h-4 w-4" aria-hidden="true" />
              <div>{SAVED_RECORD_FILTER_DIALOG_TEXT.openList}</div>
            </div>
          </Button>
        </Show>
        <Show when={shouldShowLoginLink()}>
          <A
            href={loginHref()}
            class="rounded px-2 py-1 text-sm text-link hover:bg-surface-muted hover:underline"
          >
            {SAVED_RECORD_FILTER_DIALOG_TEXT.login}
          </A>
        </Show>
      </div>
      <Show when={errorMessage()}>
        {(message) => (
          <div class="mt-2 max-w-56 text-xs text-danger" role="alert">
            {message()}
          </div>
        )}
      </Show>

      <Dialog open={saveNameDialogOpen()} onOpenChange={setSaveNameDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-60 bg-overlay" />
          <Dialog.Content class="fixed left-1/2 top-1/2 z-70 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-strong bg-surface p-6 shadow-lg">
            <Dialog.Title class="mb-4 text-lg font-bold">
              {SAVED_RECORD_FILTER_DIALOG_TEXT.saveNameTitle}
            </Dialog.Title>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void handleSaveNewFilter()
              }}
            >
              <TextField class="mb-4">
                <TextField.Input
                  class={SAVED_RECORD_FILTER_DIALOG_CLASS.nameInput}
                  maxLength={RECORD_FILTER_NAME_MAX_LENGTH}
                  value={saveName()}
                  onInput={(event) => setSaveName(limitNameInput(event.currentTarget.value))}
                />
              </TextField>
              <Show when={errorMessage()}>
                {(message) => (
                  <div class="mb-3 text-xs text-danger" role="alert">
                    {message()}
                  </div>
                )}
              </Show>
              <div class="flex justify-end gap-2">
                <Button
                  type="button"
                  class={SAVED_RECORD_FILTER_DIALOG_CLASS.secondaryButton}
                  onClick={() => setSaveNameDialogOpen(false)}
                >
                  {SAVED_RECORD_FILTER_DIALOG_TEXT.cancel}
                </Button>
                <Button
                  type="submit"
                  class={SAVED_RECORD_FILTER_DIALOG_CLASS.primaryButton}
                  disabled={!canSubmitName()}
                >
                  {SAVED_RECORD_FILTER_DIALOG_TEXT.save}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog open={listDialogOpen()} onOpenChange={setListDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-60 bg-overlay" />
          <Dialog.Content class="fixed left-1/2 top-1/2 z-70 flex h-[40rem] max-h-[calc(100vh-2rem)] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border-strong bg-surface p-6 shadow-lg">
            <Dialog.Title class="mb-4 shrink-0 text-lg font-bold">
              {SAVED_RECORD_FILTER_DIALOG_TEXT.listTitle}
            </Dialog.Title>
            <div class="min-h-0 flex-1 basis-0 overflow-y-auto pr-1">
              <Show
                when={!loading()}
                fallback={
                  <div class="h-48">
                    <span class="sr-only">{SAVED_RECORD_FILTER_DIALOG_TEXT.loadingLabel}</span>
                    <Loading />
                  </div>
                }
              >
                <For each={filtersList()}>
                  {(item) => (
                    <div class="mb-2 grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded border border-border-strong bg-surface-muted p-3">
                      <div class="min-w-0 truncate font-semibold leading-5">{item.name}</div>
                      <div class="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          class={SAVED_RECORD_FILTER_DIALOG_CLASS.iconButton}
                          disabled={!item.filter || pendingAction() !== null}
                          aria-label={SAVED_RECORD_FILTER_DIALOG_TEXT.apply}
                          title={SAVED_RECORD_FILTER_DIALOG_TEXT.apply}
                          onClick={() => handleApplySavedFilter(item)}
                        >
                          <Check class="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          class={SAVED_RECORD_FILTER_DIALOG_CLASS.iconButton}
                          disabled={!item.filter || pendingAction() !== null}
                          aria-label={SAVED_RECORD_FILTER_DIALOG_TEXT.edit}
                          title={SAVED_RECORD_FILTER_DIALOG_TEXT.edit}
                          onClick={() => handleEditSavedFilter(item)}
                        >
                          <Pencil class="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          class={SAVED_RECORD_FILTER_DIALOG_CLASS.dangerIconButton}
                          disabled={pendingAction() !== null}
                          aria-label={SAVED_RECORD_FILTER_DIALOG_TEXT.delete}
                          title={SAVED_RECORD_FILTER_DIALOG_TEXT.delete}
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 class="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </For>
                {filtersList().length === 0 && (
                  <div class="mt-2 w-full text-center text-xs text-text-subtle">
                    {SAVED_RECORD_FILTER_DIALOG_TEXT.empty}
                  </div>
                )}
              </Show>
            </div>
            <Show when={errorMessage()}>
              {(message) => (
                <div class="mt-3 shrink-0 text-xs text-danger" role="alert">
                  {message()}
                </div>
              )}
            </Show>
            <div class="mt-4 flex shrink-0 justify-end">
              <Button
                type="button"
                class={SAVED_RECORD_FILTER_DIALOG_CLASS.secondaryButton}
                onClick={() => setListDialogOpen(false)}
              >
                {SAVED_RECORD_FILTER_DIALOG_TEXT.close}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <AlertDialog
        open={deleteTarget() !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay class="fixed inset-0 z-80 bg-overlay" />
          <AlertDialog.Content class="fixed left-1/2 top-1/2 z-90 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
            <AlertDialog.Title class="mb-2 text-lg font-bold">
              {SAVED_RECORD_FILTER_DIALOG_TEXT.deleteTitle}
            </AlertDialog.Title>
            <AlertDialog.Description class="mb-4 text-sm text-text-muted">
              {SAVED_RECORD_FILTER_DIALOG_TEXT.deleteDescription}
            </AlertDialog.Description>
            <div class="flex justify-end gap-2">
              <AlertDialog.CloseButton class={SAVED_RECORD_FILTER_DIALOG_CLASS.secondaryButton}>
                {SAVED_RECORD_FILTER_DIALOG_TEXT.cancel}
              </AlertDialog.CloseButton>
              <Button
                type="button"
                class={SAVED_RECORD_FILTER_DIALOG_CLASS.dangerButton}
                disabled={pendingAction() !== null}
                onClick={() => void handleDeleteSavedFilter()}
              >
                {SAVED_RECORD_FILTER_DIALOG_TEXT.delete}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </>
  )
}
