import {
  MultiSelectField,
  toMultiSelectOptions,
} from '../../../../components/common/AppMultiSelect'

type MultiSelectFilterSectionProps<T extends string | number | null> = {
  /** セクション見出し */
  title: string
  /** 複数選択で表示する選択肢 */
  options: T[]
  /** 現在選択されている値 */
  selected: T[]
  /** 未選択時に表示するプレースホルダー */
  placeholder?: string
  /** 選択肢の値を表示用ラベルへ変換する処理 */
  formatLabel?: (value: T) => string
  /** 選択状態が変更されたときの通知先 */
  onChange: (selected: T[]) => void
  /** Select のポータルコンテンツに適用する z-index クラス */
  contentZIndexClass?: string
}

/**
 * フィルター用の複数選択セクションを表示する。
 *
 * @param props - 選択肢、選択状態、更新ハンドラーを含む表示設定。
 * @returns 複数選択セレクターの JSX 要素。
 */
const MultiSelectFilterSection = <T extends string | number | null>(
  props: MultiSelectFilterSectionProps<T>
) => (
  <MultiSelectField
    label={props.title}
    labelClass="text-text"
    options={toMultiSelectOptions(props.options, props.formatLabel)}
    selected={props.selected}
    placeholder={props.placeholder ?? `${props.title}を選択`}
    contentZIndexClass={props.contentZIndexClass}
    onChange={props.onChange}
  />
)

export default MultiSelectFilterSection
