import type { JSX } from 'solid-js'
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
