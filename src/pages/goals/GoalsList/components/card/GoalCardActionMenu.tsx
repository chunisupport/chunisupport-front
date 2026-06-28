import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-solid'
import type { Component } from 'solid-js'

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
    <DropdownMenu.Trigger class="rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
      <EllipsisVertical size={20} aria-hidden="true" />
      <span class="sr-only">メニューを開く</span>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content class="z-10 min-w-28 rounded-md border border-border bg-surface py-1 shadow-lg">
        <DropdownMenu.Item
          class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-muted hover:bg-surface-muted focus:bg-surface-muted focus:outline-none"
          onSelect={props.onEdit}
        >
          <Pencil size={16} aria-hidden="true" />
          編集
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger hover:bg-danger-bg focus:bg-danger-bg focus:outline-none"
          onSelect={props.onDelete}
        >
          <Trash2 size={16} aria-hidden="true" />
          削除
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu>
)
