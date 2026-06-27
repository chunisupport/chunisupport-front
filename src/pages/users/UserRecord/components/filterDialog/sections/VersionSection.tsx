import type { Component } from 'solid-js'
import MultiSelectDropdown from '../../../../../../components/common/MultiSelectDropdown'

type VersionSectionProps = {
  /** バージョンの選択肢。 */
  versions: string[]
  /** 現在選択されているバージョン。 */
  selected: string[]
  /** バージョンの選択状態を切り替える処理。 */
  onToggle: (version: string) => void
  /** すべてのバージョンを選択する処理。 */
  onSelectAll: () => void
  /** バージョンの選択をすべて解除する処理。 */
  onClear: () => void
  /** Select のポータルコンテンツに適用する z-index クラス。 */
  contentZIndexClass?: string
}

/**
 * バージョンの複数選択フィルターを共通セレクターで表示する。
 *
 * @param props - 選択肢、選択状態、更新ハンドラーを含む表示設定。
 * @returns バージョン選択の JSX 要素。
 */
const VersionSection: Component<VersionSectionProps> = (props) => (
  <div>
    <span class="mb-1 block text-sm font-medium">バージョン</span>
    <MultiSelectDropdown
      options={props.versions}
      selected={props.selected}
      placeholder="バージョンを選択"
      contentZIndexClass={props.contentZIndexClass}
      onToggle={props.onToggle}
      onSelectAll={props.onSelectAll}
      onClear={props.onClear}
    />
  </div>
)

export default VersionSection
