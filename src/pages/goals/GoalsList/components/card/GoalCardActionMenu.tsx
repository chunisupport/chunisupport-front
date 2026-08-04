import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import { Copy, EllipsisVertical, Pencil, Trash2 } from 'lucide-solid'
import type { Component } from 'solid-js'
import {
  AppMenuContent,
  AppMenuItem,
  AppMenuTrigger,
} from '../../../../../components/common/AppMenu'

interface GoalCardActionMenuProps {
  onEdit: () => void
  onCopy: () => void
  onDelete: () => void
  disabled: boolean
  copyDisabled: boolean
}

/**
 * メニュートリガーのポインター操作が親カードのドラッグ開始処理へ伝播するのを防ぐ。
 *
 * @param event - メニュートリガーで発生したポインターイベント。
 * @returns なし。
 */
const stopDragActivation = (event: PointerEvent): void => {
  event.stopPropagation()
}

/**
 * 目標カード右上の編集・コピー・削除メニューを描画する。
 *
 * @param props - 編集・コピー・削除の選択ハンドラと無効状態。
 * @returns 目標カード操作メニューの JSX 要素。
 */
export const GoalCardActionMenu: Component<GoalCardActionMenuProps> = (props) => (
  <DropdownMenu gutter={4}>
    <AppMenuTrigger
      label="メニューを開く"
      icon={<EllipsisVertical size={20} aria-hidden="true" />}
      disabled={props.disabled}
      class="cursor-pointer"
      onPointerDown={stopDragActivation}
    />
    <DropdownMenu.Portal>
      <AppMenuContent variant="compact">
        <AppMenuItem
          icon={<Pencil size={16} aria-hidden="true" />}
          label="編集"
          onSelect={props.onEdit}
        />
        <AppMenuItem
          icon={<Copy size={16} aria-hidden="true" />}
          label="コピー"
          disabled={props.copyDisabled}
          class="data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
          onSelect={props.onCopy}
        />
        <AppMenuItem
          icon={<Trash2 size={16} aria-hidden="true" />}
          label="削除"
          tone="danger"
          onSelect={props.onDelete}
        />
      </AppMenuContent>
    </DropdownMenu.Portal>
  </DropdownMenu>
)
