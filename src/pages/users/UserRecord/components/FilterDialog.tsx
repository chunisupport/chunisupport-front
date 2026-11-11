import type { Component } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'
import { AppButton } from '../../../../components/common/AppButton'
import { AppDialog } from '../../../../components/common/AppDialog'
import FilterResetDialog from '../../../../components/common/FilterResetDialog'
import type { MasterDataDTO, NameFolderDTO, VersionSummaryDTO } from '../../../../types/api'
import type { FilterState } from '../../../../types/recordFilter'
import { normalizeFilterState } from '../../../../utils/recordFilterDefaults'
import type { EditingFilter } from '../../components/SavedRecordFiltersDialog'
import SavedFiltersDialog from './filterDialog/dialogs/SavedFiltersDialog'
import FilterSelectionPanel from './filterDialog/FilterSelectionPanel'

/** フィルターダイアログで表示する文言 */
const FILTER_DIALOG_TEXT = {
  title: 'フィルター',
  cancel: 'キャンセル',
  apply: '適用',
} as const

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterState
  onChange: (filters: FilterState) => void
  masterData?: MasterDataDTO
  versions?: VersionSummaryDTO[]
  /** 楽曲名順フォルダ一覧（表示順） */
  nameFolders?: NameFolderDTO[]
  defaultFilter: FilterState
  /** お気に入り楽曲設定を開く */
  onOpenFavoriteSongs?: () => void
  /** お気に入り楽曲設定を無効化するか */
  favoriteSongsDisabled?: boolean
  /** 未解禁曲除外フィルターを無効化するか */
  lockedSongsDisabled?: boolean
}

/**
 * 通常レコードの絞り込み条件を編集するダイアログを表示する。
 *
 * @param props - 開閉状態、現在のフィルター、変更ハンドラー、初期値。
 * @returns フィルターダイアログの JSX 要素。
 */
export const FilterDialog: Component<FilterDialogProps> = (props) => {
  // 現在のフィルター状態
  const [filters, setFilters] = createSignal<FilterState>(normalizeFilterState(props.filters))
  const [resetKey, setResetKey] = createSignal(0)
  const [editingFilter, setEditingFilter] = createSignal<EditingFilter | null>(null)

  // フィルターダイアログが開かれた時にフィルター状態を同期
  createEffect(() => {
    if (props.open) {
      setFilters(normalizeFilterState(props.filters))
    }
  })

  /**
   * ダイアログの開閉変更を親へ通知する。
   *
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (open: boolean) => {
    props.onOpenChange(open)
  }

  /**
   * 編集中のフィルターを適用してダイアログを閉じる。
   *
   * @returns なし。
   */
  const handleApply = () => {
    props.onChange(filters())
    props.onOpenChange(false)
  }

  /**
   * フィルターを既定値へ戻して選択パネルを再初期化する。
   *
   * @returns なし。
   */
  const handleReset = () => {
    const def = props.defaultFilter
    setFilters({ ...def })
    setResetKey((prev) => prev + 1)
  }

  /**
   * 保存済みフィルターを適用してダイアログを閉じる。
   *
   * @param filter - 適用する保存済みフィルター。
   * @returns なし。
   */
  const handleApplySavedFilter = (filter: FilterState) => {
    props.onChange(normalizeFilterState(filter))
    props.onOpenChange(false)
  }

  /**
   * 保存済みフィルターを編集対象として読み込み、選択パネルへ反映する。
   *
   * @param filter - 編集対象として読み込む保存済みフィルター。
   * @returns なし。
   */
  const handleEditSavedFilter = (filter: FilterState) => {
    setFilters(normalizeFilterState(filter))
    setResetKey((prev) => prev + 1)
  }

  /**
   * 保存済みフィルターダイアログからの編集中状態の変更を反映する。
   *
   * @param editing - 現在の編集中フィルター情報。null の場合は編集中でない。
   * @returns なし。
   */
  const handleEditingChange = (editing: EditingFilter | null) => {
    setEditingFilter(editing)
  }

  return (
    <AppDialog
      open={props.open}
      onOpenChange={handleOpenChange}
      preventScroll={false}
      size="md"
      height="cap"
      selectNone
      title={FILTER_DIALOG_TEXT.title}
      headerActions={
        <div class="flex items-center gap-2">
          <SavedFiltersDialog
            open={props.open}
            currentFilters={filters()}
            onApplyFilter={handleApplySavedFilter}
            onEditFilter={handleEditSavedFilter}
            onEditingChange={handleEditingChange}
            editedFilterName={editingFilter()?.name}
          />
          <FilterResetDialog onReset={handleReset} />
        </div>
      }
      footer={
        <div class="mt-6 flex justify-end">
          <div class="flex gap-2">
            <AppButton onClick={() => props.onOpenChange(false)}>
              {FILTER_DIALOG_TEXT.cancel}
            </AppButton>
            <AppButton variant="primary" onClick={handleApply}>
              {FILTER_DIALOG_TEXT.apply}
            </AppButton>
          </div>
        </div>
      }
    >
      <FilterSelectionPanel
        open={props.open}
        filters={filters()}
        setFilters={setFilters}
        masterData={props.masterData}
        versions={props.versions}
        nameFolders={props.nameFolders}
        defaultFilter={props.defaultFilter}
        resetKey={resetKey()}
        editingFilterName={editingFilter()?.name ?? null}
        onEditingFilterNameChange={(name) =>
          setEditingFilter((prev) => (prev ? { ...prev, name } : null))
        }
        onOpenFavoriteSongs={props.onOpenFavoriteSongs}
        favoriteSongsDisabled={props.favoriteSongsDisabled}
        lockedSongsDisabled={props.lockedSongsDisabled}
      />
    </AppDialog>
  )
}

export default FilterDialog
