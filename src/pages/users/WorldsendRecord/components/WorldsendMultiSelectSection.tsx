import MultiSelectDropdown from '../../../../components/common/MultiSelectDropdown'

type WorldsendMultiSelectSectionProps<T extends string | number | null> = {
  title: string
  options: T[]
  selected: T[]
  formatLabel: (value: T) => string
  onToggle: (value: T) => void
  onSelectAll: () => void
  onClear: () => void
}

/**
 * WORLD'S END フィルター用の複数選択セクションを表示する。
 *
 * @param props - 選択肢、選択状態、更新ハンドラーを含む表示設定。
 * @returns 複数選択セレクターの JSX 要素。
 */
const WorldsendMultiSelectSection = <T extends string | number | null>(
  props: WorldsendMultiSelectSectionProps<T>
) => (
  <div>
    <span class="mb-1 block text-sm font-medium">{props.title}</span>
    <MultiSelectDropdown
      options={props.options}
      selected={props.selected}
      placeholder={`${props.title}を選択`}
      formatLabel={props.formatLabel}
      onToggle={props.onToggle}
      onSelectAll={props.onSelectAll}
      onClear={props.onClear}
    />
  </div>
)

export default WorldsendMultiSelectSection
