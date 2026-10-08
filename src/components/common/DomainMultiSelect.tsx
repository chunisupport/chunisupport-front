import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import type { NameFolderDTO } from '../../types/api'
import {
  toNullableAllDisplaySelection,
  toNullableAllFilterSelection,
} from '../../utils/filterSelection'
import type { AppMultiSelectOption, AppMultiSelectValue } from './AppMultiSelect'
import { MultiSelectField, type MultiSelectFieldProps } from './AppMultiSelect'

type DomainMultiSelectProps<TValue extends AppMultiSelectValue> = Omit<
  MultiSelectFieldProps<TValue>,
  'label' | 'placeholder'
> & {
  /** 入力欄上部に表示するラベル */
  label?: string
  /** 未選択時に表示するプレースホルダー */
  placeholder?: string
}

/**
 * 値とラベルを指定して複数選択用の選択肢を作る。
 *
 * @param value - 選択値。
 * @param label - 表示ラベル。
 * @returns AppMultiSelect 用の選択肢。
 */
export const createMultiSelectOption = <TValue extends AppMultiSelectValue>(
  value: TValue,
  label: string
): AppMultiSelectOption<TValue> => ({ value, label })

/**
 * ジャンル選択用の複数選択フィールドを表示する。
 *
 * @param props - ジャンル選択肢、選択状態、更新ハンドラーを含む設定。
 * @returns ジャンル用 MultiSelectField。
 */
export const GenreMultiSelect = <TValue extends AppMultiSelectValue>(
  props: DomainMultiSelectProps<TValue>
): JSX.Element => (
  <MultiSelectField
    {...props}
    label={props.label ?? 'ジャンル'}
    placeholder={props.placeholder ?? 'ジャンルを選択'}
  />
)

/**
 * バージョン選択用の複数選択フィールドを表示する。
 *
 * @param props - バージョン選択肢、選択状態、更新ハンドラーを含む設定。
 * @returns バージョン用 MultiSelectField。
 */
export const VersionMultiSelect = <TValue extends AppMultiSelectValue>(
  props: DomainMultiSelectProps<TValue>
): JSX.Element => (
  <MultiSelectField
    {...props}
    label={props.label ?? 'バージョン'}
    placeholder={props.placeholder ?? 'バージョンを選択'}
  />
)

/**
 * 楽曲名順選択用の複数選択フィールドを表示する。
 *
 * @param props - 楽曲名順の選択肢、選択状態、更新ハンドラーを含む設定。
 * @returns 楽曲名順用 MultiSelectField。
 */
export const NameFolderMultiSelect = <TValue extends AppMultiSelectValue>(
  props: DomainMultiSelectProps<TValue>
): JSX.Element => (
  <MultiSelectField
    {...props}
    label={props.label ?? '楽曲名順'}
    placeholder={props.placeholder ?? '楽曲名順を選択'}
  />
)

/** 全選択を null とするフィルター値で楽曲名順を編集する複数選択フィールドの設定 */
type NameFolderFilterMultiSelectProps = Omit<
  DomainMultiSelectProps<string>,
  'options' | 'selected' | 'onChange'
> & {
  /** 楽曲名順フォルダ一覧（表示順） */
  nameFolders: readonly NameFolderDTO[]
  /** 選択中のフォルダコード。null は全選択、空配列は全件不一致を表す */
  selected: readonly string[] | null
  /** 選択変更時の通知先。全選択時は null を渡す */
  onChange: (selected: string[] | null) => void
}

/**
 * 楽曲名順の絞り込み条件を、全選択を null とするフィルター値で編集する複数選択フィールドを表示する。
 *
 * @param props - 楽曲名順フォルダ一覧、選択状態、更新ハンドラーを含む設定。
 * @returns 楽曲名順用 MultiSelectField。
 */
export const NameFolderFilterMultiSelect = (
  props: NameFolderFilterMultiSelectProps
): JSX.Element => {
  const [local, others] = splitProps(props, ['nameFolders', 'selected', 'onChange'])
  const codes = () => local.nameFolders.map((nameFolder) => nameFolder.code)
  return (
    <NameFolderMultiSelect
      {...others}
      options={local.nameFolders.map((nameFolder) =>
        createMultiSelectOption(nameFolder.code, nameFolder.name)
      )}
      selected={toNullableAllDisplaySelection(local.selected, codes())}
      onChange={(selected) => local.onChange(toNullableAllFilterSelection(selected, codes()))}
    />
  )
}
