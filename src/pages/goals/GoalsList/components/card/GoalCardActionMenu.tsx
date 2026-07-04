import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-solid'
import type { Component } from 'solid-js'
import {
  AppMenuContent,
  AppMenuItem,
  AppMenuTrigger,
} from '../../../../../components/common/AppMenu'

interface GoalCardActionMenuProps {
  onEdit: () => void
  onDelete: () => void
}

/**
 * 目標カード右上の編集/削除メニューを描画する。
 *
 * @param props - 編集と削除の選択ハンドラ。
 * @returns 目標カード操作メニューの JSX 要素。
 */
export const GoalCardActionMenu: Component<GoalCardActionMenuProps> = (props) => (
  <DropdownMenu gutter={4}>
    <AppMenuTrigger
      label="メニューを開く"
      icon={<EllipsisVertical size={20} aria-hidden="true" />}
    />
    <DropdownMenu.Portal>
      <AppMenuContent variant="compact">
        <AppMenuItem
          icon={<Pencil size={16} aria-hidden="true" />}
          label="編集"
          onSelect={props.onEdit}
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
