import { LayoutGrid, Table2 } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { AppIconButton } from './AppButton'
import { CARD_TABLE_VIEW_TOGGLE_COPY } from './cardTableViewToggle.constants'

/** カード表示と表表示の切り替えに必要な状態と操作。 */
type CardTableViewToggleProps = {
  /** 現在の表示形式。 */
  viewMode: 'card' | 'table'
  /** 表示形式を切り替える操作。 */
  onClick: () => void
}

/**
 * カード表示と表表示を切り替えるアイコンボタンを表示する。
 *
 * @param props - 現在の表示形式と切り替え操作。
 * @returns 切り替え先を示すアイコンボタン。
 */
export const CardTableViewToggle = (props: CardTableViewToggleProps): JSX.Element => {
  const switchLabel = () =>
    props.viewMode === 'card'
      ? CARD_TABLE_VIEW_TOGGLE_COPY.toTable
      : CARD_TABLE_VIEW_TOGGLE_COPY.toCard

  return (
    <AppIconButton
      size="md"
      aria-label={switchLabel()}
      title={switchLabel()}
      onClick={props.onClick}
    >
      {props.viewMode === 'card' ? (
        <Table2 size={20} aria-hidden="true" />
      ) : (
        <LayoutGrid size={20} aria-hidden="true" />
      )}
    </AppIconButton>
  )
}
