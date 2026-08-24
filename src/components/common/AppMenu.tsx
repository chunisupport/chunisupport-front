import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import type { ComponentProps, JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { NotificationDot } from './NotificationDot'

type DropdownMenuTriggerProps = ComponentProps<typeof DropdownMenu.Trigger>
type DropdownMenuContentProps = ComponentProps<typeof DropdownMenu.Content>
type DropdownMenuItemProps = ComponentProps<typeof DropdownMenu.Item>

export type AppMenuTriggerVariant = 'navRail' | 'navBar' | 'icon'
export type AppMenuContentVariant = 'default' | 'compact'
export type AppMenuItemTone = 'default' | 'danger'

export type AppMenuTriggerProps = Omit<DropdownMenuTriggerProps, 'class' | 'children'> & {
  /** トリガーのアクセシブルラベル */
  label: string
  /** トリガーに表示するアイコン */
  icon: JSX.Element
  /** トリガーの表示用途 */
  variant?: AppMenuTriggerVariant
  /** トリガー右上に通知ドットを表示するか */
  hasNotificationDot?: boolean
  /** 追加で適用する Tailwind クラス */
  class?: string
}

export type AppMenuContentProps = Omit<DropdownMenuContentProps, 'class'> & {
  /** メニュー内容の表示密度 */
  variant?: AppMenuContentVariant
  /** 追加で適用する Tailwind クラス */
  class?: string
}

export type AppMenuItemProps = Omit<DropdownMenuItemProps, 'class' | 'children'> & {
  /** メニュー項目の表示ラベル */
  label: JSX.Element
  /** ラベル左側に表示するアイコン */
  icon?: JSX.Element
  /** メニュー項目の色調 */
  tone?: AppMenuItemTone
  /** メニュー項目右上に通知ドットを表示するか */
  hasNotificationDot?: boolean
  /** 追加で適用する Tailwind クラス */
  class?: string
}

const APP_MENU_TRIGGER_BASE_CLASS =
  'relative focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring'

const APP_MENU_TRIGGER_VARIANT_CLASS: Record<AppMenuTriggerVariant, string> = {
  navRail:
    'flex w-full flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-nav-text hover:bg-surface-hover',
  navBar:
    'flex flex-1 flex-col items-center justify-center gap-1 rounded-md px-0 py-2 text-xs font-semibold text-nav-text',
  icon: 'inline-flex items-center justify-center rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-text-muted',
}

const APP_MENU_TRIGGER_ICON_CLASS: Record<AppMenuTriggerVariant, string> = {
  navRail: 'text-lg',
  navBar: 'text-lg',
  icon: '',
}

const APP_MENU_CONTENT_BASE_CLASS = 'z-50 border border-border bg-surface'

const APP_MENU_CONTENT_VARIANT_CLASS: Record<AppMenuContentVariant, string> = {
  default: 'min-w-45 rounded-lg py-2 shadow-sm',
  compact: 'min-w-28 rounded-md py-1 shadow-lg',
}

const APP_MENU_ITEM_BASE_CLASS =
  'flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm outline-none'

const APP_MENU_ITEM_TONE_CLASS: Record<AppMenuItemTone, string> = {
  default: 'text-text-muted hover:bg-surface-hover focus:bg-surface-hover',
  danger: 'font-semibold text-danger hover:bg-danger-bg focus:bg-danger-bg',
}

/**
 * ドロップダウンメニューのトリガーを表示する。
 *
 * @param props - 表示ラベル、アイコン、用途、Kobalte Trigger の属性。
 * @returns 共通スタイルを適用した DropdownMenu.Trigger。
 */
export const AppMenuTrigger = (props: AppMenuTriggerProps): JSX.Element => {
  const [local, triggerProps] = splitProps(props, [
    'label',
    'icon',
    'variant',
    'hasNotificationDot',
    'class',
  ])
  const variant = () => local.variant ?? 'icon'

  return (
    <DropdownMenu.Trigger
      {...triggerProps}
      class={`${APP_MENU_TRIGGER_BASE_CLASS} ${APP_MENU_TRIGGER_VARIANT_CLASS[variant()]} ${
        local.class ?? ''
      }`}
    >
      <span class={APP_MENU_TRIGGER_ICON_CLASS[variant()]}>{local.icon}</span>
      <Show when={variant() === 'icon'} fallback={<span>{local.label}</span>}>
        <span class="sr-only">{local.label}</span>
      </Show>
      <NotificationDot visible={local.hasNotificationDot === true} class="right-2 top-1" />
    </DropdownMenu.Trigger>
  )
}

/**
 * ドロップダウンメニューの内容コンテナを表示する。
 *
 * @param props - 表示密度、Kobalte Content の属性、追加クラス。
 * @returns 共通スタイルを適用した DropdownMenu.Content。
 */
export const AppMenuContent = (props: AppMenuContentProps): JSX.Element => {
  const [local, contentProps] = splitProps(props, ['variant', 'class'])

  return (
    <DropdownMenu.Content
      {...contentProps}
      class={`${APP_MENU_CONTENT_BASE_CLASS} ${
        APP_MENU_CONTENT_VARIANT_CLASS[local.variant ?? 'default']
      } ${local.class ?? ''}`}
    />
  )
}

/**
 * ドロップダウンメニューの項目を表示する。
 *
 * @param props - 表示ラベル、アイコン、色調、Kobalte Item の属性。
 * @returns 共通スタイルを適用した DropdownMenu.Item。
 */
export const AppMenuItem = (props: AppMenuItemProps): JSX.Element => {
  const [local, itemProps] = splitProps(props, [
    'label',
    'icon',
    'tone',
    'hasNotificationDot',
    'class',
  ])

  return (
    <DropdownMenu.Item
      {...itemProps}
      class={`relative ${APP_MENU_ITEM_BASE_CLASS} ${
        APP_MENU_ITEM_TONE_CLASS[local.tone ?? 'default']
      } ${local.class ?? ''}`}
    >
      <Show when={local.icon}>{(icon) => <span class="shrink-0">{icon()}</span>}</Show>
      <span>{local.label}</span>
      <NotificationDot visible={local.hasNotificationDot === true} class="right-2 top-1" />
    </DropdownMenu.Item>
  )
}
