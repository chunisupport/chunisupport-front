import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { Popover } from '@kobalte/core/popover'
import { TextField } from '@kobalte/core/text-field'
import { A } from '@solidjs/router'
import { EllipsisVertical, Save } from 'lucide-solid'
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
  currentFilters: TFilter
  onApplyFilter: (filter: TFilter) => void
  loadFilters: () => Promise<SavedRecordFilterItem<TFilter>[]>
  createFilter: (name: string, filter: TFilter) => Promise<void>
  updateFilter: (id: string, name: string, filter: TFilter) => Promise<void>
  deleteFilter: (id: string) => Promise<void>
  formatSummary: (filter: TFilter) => string
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
 * 保存済みレコードフィルターの保存、呼び出し、編集を行う共通ダイアログを表示する。
 *
 * @param props - フィルター状態、CRUD操作、要約表示ハンドラー。
 * @returns 保存済みフィルターダイアログの JSX 要素。
 */
export function SavedRecordFiltersDialog<TFilter>(props: SavedRecordFiltersDialogProps<TFilter>) {
  const [open, setOpen] = createSignal(false)
  const [saveName, setSaveName] = createSignal('')
  const [filtersList, setFiltersList] = createSignal<SavedRecordFilterItem<TFilter>[]>([])
  const [editNames, setEditNames] = createSignal<Record<string, string>>({})
  const [loading, setLoading] = createSignal(false)
  const [pendingAction, setPendingAction] = createSignal<string | null>(null)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const isAuthenticated = createMemo(() => authSession.status === 'authenticated')
  const shouldShowLoginLink = createMemo(
    () => authSession.status === 'unauthenticated' || authSession.status === 'error'
  )
  const loginHref = createMemo(buildCurrentLoginHref)

  /**
   * 保存済みフィルター一覧をサーバーから再取得する。
   *
   * @returns なし。
   */
  const reloadFilters = async (): Promise<void> => {
    if (!isAuthenticated()) return
    setLoading(true)
    setErrorMessage(null)
    try {
      setFiltersList(await props.loadFilters())
    } catch {
      setErrorMessage(SAVED_RECORD_FILTER_DIALOG_TEXT.loadError)
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    if (!open() || !isAuthenticated()) return
    void reloadFilters()
  })

  /**
   * 保存済みフィルターを適用してダイアログを閉じる。
   *
   * @param filter - 適用対象のフィルター状態。
   * @returns なし。
   */
  const handleApplySavedFilter = (filter: TFilter): void => {
    props.onApplyFilter(filter)
    setOpen(false)
  }

  /**
   * 新しい保存済みフィルターを作成する。
   *
   * @returns なし。
   */
  const handleSaveNewFilter = async (): Promise<void> => {
    const name = saveName().trim()
    if (!name || pendingAction()) return
    setPendingAction('create')
    setErrorMessage(null)
    try {
      await props.createFilter(name, props.currentFilters)
      setSaveName('')
      await reloadFilters()
    } catch {
      setErrorMessage(SAVED_RECORD_FILTER_DIALOG_TEXT.saveError)
    } finally {
      setPendingAction(null)
    }
  }

  /**
   * 保存済みフィルター名を変更する。
   *
   * @param item - 更新対象の保存済みフィルター。
   * @returns なし。
   */
  const handleRenameFilter = async (item: SavedRecordFilterItem<TFilter>): Promise<void> => {
    const filter = item.filter
    const name = (editNames()[item.id] ?? item.name).trim()
    if (!filter || !name || pendingAction()) return
    setPendingAction(`rename:${item.id}`)
    setErrorMessage(null)
    try {
      await props.updateFilter(item.id, name, filter)
      await reloadFilters()
    } catch {
      setErrorMessage(SAVED_RECORD_FILTER_DIALOG_TEXT.updateError)
    } finally {
      setPendingAction(null)
    }
  }

  /**
   * 保存済みフィルターを現在の条件で上書きする。
   *
   * @param item - 更新対象の保存済みフィルター。
   * @returns なし。
   */
  const handleOverwriteFilter = async (item: SavedRecordFilterItem<TFilter>): Promise<void> => {
    const name = (editNames()[item.id] ?? item.name).trim()
    if (!name || pendingAction()) return
    setPendingAction(`overwrite:${item.id}`)
    setErrorMessage(null)
    try {
      await props.updateFilter(item.id, name, props.currentFilters)
      await reloadFilters()
    } catch {
      setErrorMessage(SAVED_RECORD_FILTER_DIALOG_TEXT.updateError)
    } finally {
      setPendingAction(null)
    }
  }

  /**
   * 保存済みフィルターを削除する。
   *
   * @param id - 削除対象の保存済みフィルターID。
   * @returns なし。
   */
  const handleDeleteSavedFilter = async (id: string): Promise<void> => {
    if (pendingAction()) return
    setPendingAction(`delete:${id}`)
    setErrorMessage(null)
    try {
      await props.deleteFilter(id)
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
          disabled={!isAuthenticated()}
          onClick={() => setOpen(true)}
        >
          <div class="mb-0.5 flex items-center justify-center text-sm">
            <Save class="mr-1 h-4 w-4" />
            <div>{SAVED_RECORD_FILTER_DIALOG_TEXT.trigger}</div>
          </div>
        </Button>
        <Show when={shouldShowLoginLink()}>
          <A
            href={loginHref()}
            class="rounded px-2 py-1 text-sm text-link hover:bg-surface-muted hover:underline"
          >
            {SAVED_RECORD_FILTER_DIALOG_TEXT.login}
          </A>
        </Show>
      </div>
      <Dialog open={open()} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-60 bg-overlay" />
          <Dialog.Content class="fixed left-1/2 top-1/2 z-70 flex h-[40rem] max-h-[calc(100vh-2rem)] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border-strong bg-surface p-6 shadow-lg">
            <Dialog.Title class="mb-2 shrink-0 font-bold">
              {SAVED_RECORD_FILTER_DIALOG_TEXT.title}
            </Dialog.Title>
            <div class="min-h-0 flex-1 basis-0 overflow-y-auto pr-1">
              <div class="mb-1 text-xs text-text-subtle">
                {SAVED_RECORD_FILTER_DIALOG_TEXT.savedListLabel}
              </div>
              <div class="mb-4 min-h-48 rounded border border-border-strong bg-surface-muted px-3 py-2">
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
                      <div class="flex items-center justify-between border-b border-border-strong py-1">
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2">
                            <div class="truncate">{item.name}</div>
                            <Show when={!item.isValid}>
                              <span class="shrink-0 rounded border border-danger px-1 text-[10px] leading-4 text-danger">
                                {SAVED_RECORD_FILTER_DIALOG_TEXT.invalidBadge}
                              </span>
                            </Show>
                          </div>
                        </div>
                        <Popover
                          onOpenChange={(nextOpen) => {
                            if (!nextOpen) return
                            setEditNames((prev) => ({ ...prev, [item.id]: item.name }))
                          }}
                        >
                          <Popover.Trigger
                            aria-label={SAVED_RECORD_FILTER_DIALOG_TEXT.actionsLabel}
                            title={SAVED_RECORD_FILTER_DIALOG_TEXT.actionsLabel}
                          >
                            <EllipsisVertical class="h-5 w-5 cursor-pointer text-text-subtle" />
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content class="z-80 w-72 rounded border border-border-strong bg-surface p-4 shadow">
                              <Popover.Arrow />
                              <div class="mb-4">
                                <div class="mb-2 text-sm font-sm text-text-muted">
                                  {SAVED_RECORD_FILTER_DIALOG_TEXT.detailLabel}
                                </div>
                                <Show
                                  when={item.filter}
                                  fallback={
                                    <div class="max-w-xs whitespace-pre-line text-xs text-danger">
                                      {item.invalidReason ??
                                        SAVED_RECORD_FILTER_DIALOG_TEXT.invalidFallback}
                                    </div>
                                  }
                                >
                                  {(filter) => (
                                    <div class="max-w-xs whitespace-pre-line text-xs text-text-muted">
                                      {props.formatSummary(filter()) ||
                                        SAVED_RECORD_FILTER_DIALOG_TEXT.noCondition}
                                    </div>
                                  )}
                                </Show>
                              </div>
                              <Show when={item.filter}>
                                <div class="mb-3">
                                  <TextField class="mb-2">
                                    <TextField.Label class="sr-only">
                                      {SAVED_RECORD_FILTER_DIALOG_TEXT.filterNameLabel}
                                    </TextField.Label>
                                    <TextField.Input
                                      class={SAVED_RECORD_FILTER_DIALOG_CLASS.nameInput}
                                      value={editNames()[item.id] ?? item.name}
                                      onInput={(event) =>
                                        setEditNames((prev) => ({
                                          ...prev,
                                          [item.id]: event.currentTarget.value,
                                        }))
                                      }
                                    />
                                  </TextField>
                                  <div class="flex flex-wrap justify-end gap-2">
                                    <Button
                                      type="button"
                                      class={SAVED_RECORD_FILTER_DIALOG_CLASS.primarySmallButton}
                                      disabled={
                                        pendingAction() !== null ||
                                        !(editNames()[item.id] ?? item.name).trim()
                                      }
                                      onClick={() => void handleRenameFilter(item)}
                                    >
                                      {SAVED_RECORD_FILTER_DIALOG_TEXT.rename}
                                    </Button>
                                    <Button
                                      type="button"
                                      class={SAVED_RECORD_FILTER_DIALOG_CLASS.primarySmallButton}
                                      disabled={
                                        pendingAction() !== null ||
                                        !(editNames()[item.id] ?? item.name).trim()
                                      }
                                      onClick={() => void handleOverwriteFilter(item)}
                                    >
                                      {SAVED_RECORD_FILTER_DIALOG_TEXT.overwrite}
                                    </Button>
                                  </div>
                                </div>
                              </Show>
                              <div class="flex justify-end">
                                <Button
                                  type="button"
                                  class={SAVED_RECORD_FILTER_DIALOG_CLASS.dangerButton}
                                  disabled={pendingAction() !== null}
                                  onClick={() => void handleDeleteSavedFilter(item.id)}
                                >
                                  {SAVED_RECORD_FILTER_DIALOG_TEXT.delete}
                                </Button>
                              </div>
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover>
                        <Button
                          type="button"
                          class={SAVED_RECORD_FILTER_DIALOG_CLASS.primarySmallButton}
                          disabled={!item.filter}
                          onClick={() => {
                            if (item.filter) handleApplySavedFilter(item.filter)
                          }}
                        >
                          {SAVED_RECORD_FILTER_DIALOG_TEXT.apply}
                        </Button>
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
              <div class="mb-6">
                <TextField class="mb-2">
                  <TextField.Label class="mb-1 block text-xs text-text-subtle">
                    {SAVED_RECORD_FILTER_DIALOG_TEXT.saveCurrentLabel}
                  </TextField.Label>
                  <TextField.Input
                    class={SAVED_RECORD_FILTER_DIALOG_CLASS.nameInput}
                    placeholder={SAVED_RECORD_FILTER_DIALOG_TEXT.namePlaceholder}
                    value={saveName()}
                    onInput={(event) => setSaveName(event.currentTarget.value)}
                  />
                </TextField>
                <div class="flex justify-end space-x-2">
                  <Button
                    type="button"
                    class={SAVED_RECORD_FILTER_DIALOG_CLASS.primarySmallButton}
                    onClick={() => void handleSaveNewFilter()}
                    disabled={!saveName().trim() || pendingAction() !== null}
                  >
                    {SAVED_RECORD_FILTER_DIALOG_TEXT.save}
                  </Button>
                </div>
              </div>
            </div>
            <div class="mt-4 flex shrink-0 items-center justify-between space-x-2">
              <Show when={errorMessage()}>
                {(message) => (
                  <div class="flex-1 text-xs text-danger" role="alert">
                    {message()}
                  </div>
                )}
              </Show>
              <Button
                type="button"
                class={`${SAVED_RECORD_FILTER_DIALOG_CLASS.secondaryButton} ml-auto shrink-0`}
                onClick={() => setOpen(false)}
              >
                {SAVED_RECORD_FILTER_DIALOG_TEXT.close}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
