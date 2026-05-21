import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import type { JSX } from 'solid-js'

type CommonDropdownItemProps = {
  label: string
  icon: JSX.Element
  onSelect: () => void
  danger?: boolean
  class?: string
}

/**
 * ドロップダウンで使用する共通項目を表示する。
 * @param props 表示文言、アイコン、選択時処理などを含むプロパティ
 * @returns ドロップダウン項目要素
 */
const BASE_CLASS =
  'block px-4 py-2 text-sm outline-none cursor-pointer font-semibold transition-colors duration-150'

const CommonDropdownItem = (props: CommonDropdownItemProps) => {
  const variantClass = () =>
    props.danger ? 'text-danger hover:bg-danger-bg' : 'text-text-muted hover:bg-surface-muted'

  return (
    <DropdownMenu.Item
      class={`${BASE_CLASS} ${variantClass()} ${props.class ?? ''}`}
      onSelect={props.onSelect}
    >
      {props.icon}
      {props.label}
    </DropdownMenu.Item>
  )
}

export default CommonDropdownItem
