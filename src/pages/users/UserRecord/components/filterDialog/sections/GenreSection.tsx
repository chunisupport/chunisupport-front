import type { Component } from 'solid-js'
import MultiSelectDropdown from '../../../../../../components/common/MultiSelectDropdown'

type GenreSectionProps = {
  /** ジャンルの選択肢。 */
  genres: string[]
  /** 現在選択されているジャンル。 */
  selected: string[]
  /** ジャンルの選択状態を切り替える処理。 */
  onToggle: (genre: string) => void
  /** すべてのジャンルを選択する処理。 */
  onSelectAll: () => void
  /** ジャンルの選択をすべて解除する処理。 */
  onClear: () => void
  /** Select のポータルコンテンツに適用する z-index クラス。 */
  contentZIndexClass?: string
}

/**
 * ジャンルの複数選択フィルターを共通セレクターで表示する。
 *
 * @param props - 選択肢、選択状態、更新ハンドラーを含む表示設定。
 * @returns ジャンル選択の JSX 要素。
 */
const GenreSection: Component<GenreSectionProps> = (props) => (
  <MultiSelectDropdown
    options={props.genres}
    selected={props.selected}
    placeholder="ジャンルを選択"
    contentZIndexClass={props.contentZIndexClass}
    onToggle={props.onToggle}
    onSelectAll={props.onSelectAll}
    onClear={props.onClear}
  />
)

export default GenreSection
