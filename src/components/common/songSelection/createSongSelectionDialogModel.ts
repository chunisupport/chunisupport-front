import type { Accessor, Setter } from 'solid-js'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { hasSameSelectionKeys, toggleSelectionKey } from './songSelectionDialog'

/** 楽曲選択ダイアログの共有状態を生成するための外部依存 */
type SongSelectionDialogModelOptions<TFilter> = {
  /** ダイアログの表示状態 */
  open: Accessor<boolean>
  /** 保存済みの選択キー */
  selectedKeys: Accessor<ReadonlySet<string>>
  /** フィルターの既定値 */
  defaultFilter: Accessor<TFilter>
  /** フィルター選択肢を初期化できるか判定する */
  isFilterReady: (filter: TFilter) => boolean
  /** 選択キーを画面固有のpayloadへ変換して保存する */
  save: (keys: string[]) => Promise<void>
  /** 保存成功後に呼び出す処理 */
  onSaved: () => void
  /** 保存失敗時の既定メッセージ */
  saveErrorMessage: string
  /** 保存失敗時にdraftを保存済み状態へ戻すか */
  resetDraftOnError?: boolean
}

/** 楽曲選択ダイアログの表示状態とユーザー操作 */
export type SongSelectionDialogModel<TFilter> = {
  query: Accessor<string>
  setQuery: Setter<string>
  filterDialogOpen: Accessor<boolean>
  setFilterDialogOpen: Setter<boolean>
  filters: Accessor<TFilter>
  setFilters: Setter<TFilter>
  showSelectedOnly: Accessor<boolean>
  setShowSelectedOnly: Setter<boolean>
  isListReady: Accessor<boolean>
  draftKeys: Accessor<Set<string>>
  selectedCount: Accessor<number>
  isSaving: Accessor<boolean>
  saveError: Accessor<string | null>
  hasChanges: Accessor<boolean>
  toggleDraftKey: (key: string, limit?: number) => void
  resetFilters: () => void
  save: () => Promise<void>
}

/**
 * 楽曲選択ダイアログで共有する検索・フィルター・draft選択・保存状態を生成する。
 *
 * @param options - 外部状態のAccessor、フィルター初期化、保存処理。
 * @returns 楽曲選択ダイアログの共有状態と操作。
 */
export const createSongSelectionDialogModel = <TFilter>(
  options: SongSelectionDialogModelOptions<TFilter>
): SongSelectionDialogModel<TFilter> => {
  const [query, setQuery] = createSignal('')
  const [filterDialogOpen, setFilterDialogOpen] = createSignal(false)
  const [filters, setFilters] = createSignal<TFilter>(options.defaultFilter())
  const [filterInitialized, setFilterInitialized] = createSignal(false)
  const [showSelectedOnly, setShowSelectedOnly] = createSignal(false)
  const [isListReady, setIsListReady] = createSignal(false)
  const [draftKeys, setDraftKeys] = createSignal<Set<string>>(new Set())
  const [isSaving, setIsSaving] = createSignal(false)
  const [saveError, setSaveError] = createSignal<string | null>(null)

  const selectedCount = createMemo(() => draftKeys().size)
  const hasChanges = createMemo(() => !hasSameSelectionKeys(options.selectedKeys(), draftKeys()))

  createEffect(() => {
    if (filterInitialized()) return
    const nextFilter = options.defaultFilter()
    if (!options.isFilterReady(nextFilter)) return
    setFilters(() => nextFilter)
    setFilterInitialized(true)
  })

  createEffect<boolean>((wasOpen = false) => {
    const open = options.open()
    if (open && !wasOpen) {
      setDraftKeys(new Set(options.selectedKeys()))
      setSaveError(null)
    }
    return open
  })

  createEffect(() => {
    if (!options.open()) {
      setIsListReady(false)
      return
    }
    const timerId = window.setTimeout(() => setIsListReady(true), 0)
    onCleanup(() => window.clearTimeout(timerId))
  })

  /**
   * draft内の選択キーを切り替える。
   *
   * @param key - 切り替える選択キー。
   * @param limit - 選択数の上限。省略時は無制限。
   * @returns なし。
   */
  const toggleDraftKey = (key: string, limit?: number): void => {
    setDraftKeys((current) => toggleSelectionKey(current, key, limit))
  }

  /**
   * フィルターを現在の既定値へ戻す。
   *
   * @returns なし。
   */
  const resetFilters = (): void => {
    setFilters(() => options.defaultFilter())
  }

  /**
   * draft選択を画面固有の保存処理へ渡す。
   *
   * @returns 保存完了時に解決されるPromise。
   */
  const save = async (): Promise<void> => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await options.save([...draftKeys()])
      options.onSaved()
    } catch (error) {
      if (options.resetDraftOnError) {
        setDraftKeys(new Set(options.selectedKeys()))
      }
      setSaveError(toUserFriendlyErrorMessage(error, options.saveErrorMessage))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    query,
    setQuery,
    filterDialogOpen,
    setFilterDialogOpen,
    filters,
    setFilters,
    showSelectedOnly,
    setShowSelectedOnly,
    isListReady,
    draftKeys,
    selectedCount,
    isSaving,
    saveError,
    hasChanges,
    toggleDraftKey,
    resetFilters,
    save,
  }
}
