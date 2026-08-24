import { Button } from '@kobalte/core/button'
import type { ComponentProps, JSX } from 'solid-js'
import { splitProps } from 'solid-js'

type KobalteButtonProps = ComponentProps<typeof Button>

export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'surface'
  | 'danger'
  | 'dangerOutline'
  | 'success'
  | 'ghost'

export type AppButtonSize = 'xs' | 'sm' | 'md'
export type AppButtonShape = 'rounded' | 'pill'

export type AppButtonProps = Omit<KobalteButtonProps, 'class'> & {
  /** ボタンの役割と優先度に対応する見た目 */
  variant?: AppButtonVariant
  /** ボタンの余白と文字サイズ */
  size?: AppButtonSize
  /** ボタンの角丸形状 */
  shape?: AppButtonShape
  /** 横幅いっぱいに広げるかどうか */
  fullWidth?: boolean
  /** 左側に表示するアイコン */
  leftIcon?: JSX.Element
  /** 右側に表示するアイコン */
  rightIcon?: JSX.Element
  /** 追加で適用する Tailwind クラス */
  class?: string
}

export type AppIconButtonTone = 'surface' | 'primary' | 'danger' | 'ghost'
export type AppIconButtonSize = 'sm' | 'md'

export type AppIconButtonProps = Omit<
  AppButtonProps,
  'children' | 'fullWidth' | 'leftIcon' | 'rightIcon' | 'shape' | 'variant'
> & {
  /** アイコンボタンの色調 */
  tone?: AppIconButtonTone
  /** アイコンボタンの大きさ */
  size?: AppIconButtonSize
  /** ボタン内に表示するアイコン */
  children: JSX.Element
}

const BASE_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

const VARIANT_CLASS: Record<AppButtonVariant, string> = {
  primary: 'bg-action-primary font-semibold text-text-inverse hover:bg-action-primary-hover',
  secondary: 'bg-action-secondary text-text-muted hover:bg-action-secondary-hover',
  surface:
    'border border-border-strong bg-surface text-text-muted hover:bg-surface-muted disabled:hover:bg-surface',
  danger: 'bg-danger font-semibold text-text-inverse hover:bg-danger-hover',
  dangerOutline: 'border border-danger text-danger hover:bg-danger-bg',
  success: 'bg-success font-semibold text-text-inverse hover:bg-success',
  ghost: 'text-text-muted hover:bg-surface-muted',
}

const SIZE_CLASS: Record<AppButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
}

const SHAPE_CLASS: Record<AppButtonShape, string> = {
  rounded: 'rounded',
  pill: 'rounded-full',
}

const ICON_BUTTON_TONE_CLASS: Record<AppIconButtonTone, string> = {
  surface:
    'border border-border-strong bg-surface text-text-muted hover:bg-surface-hover disabled:hover:bg-surface',
  primary:
    'border border-action-primary bg-action-primary text-text-inverse hover:bg-action-primary-hover',
  danger:
    'border border-danger-border bg-surface text-danger hover:border-danger hover:bg-danger-bg',
  ghost: 'text-text-muted hover:bg-surface-hover',
}

const ICON_BUTTON_SIZE_CLASS: Record<AppIconButtonSize, string> = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
}

/**
 * 標準ボタンに適用する Tailwind クラスを返す。
 *
 * @param options - ボタンの役割、サイズ、形状、横幅、追加クラス。
 * @returns AppButton と同じ見た目を再利用するためのクラス文字列。
 */
export const getAppButtonClass = (options: {
  variant?: AppButtonVariant
  size?: AppButtonSize
  shape?: AppButtonShape
  fullWidth?: boolean
  class?: string
}): string =>
  `${BASE_BUTTON_CLASS} ${SHAPE_CLASS[options.shape ?? 'rounded']} ${
    SIZE_CLASS[options.size ?? 'md']
  } ${VARIANT_CLASS[options.variant ?? 'secondary']} ${options.fullWidth ? 'w-full' : ''} ${
    options.class ?? ''
  }`

/**
 * 標準アイコンボタンに適用する Tailwind クラスを返す。
 *
 * @param options - アイコンボタンの色調、大きさ、追加クラス。
 * @returns AppIconButton と同じ見た目を再利用するためのクラス文字列。
 */
export const getAppIconButtonClass = (options: {
  tone?: AppIconButtonTone
  size?: AppIconButtonSize
  class?: string
}): string =>
  `${BASE_BUTTON_CLASS} ${ICON_BUTTON_SIZE_CLASS[options.size ?? 'sm']} rounded ${
    ICON_BUTTON_TONE_CLASS[options.tone ?? 'surface']
  } ${options.class ?? ''}`

/**
 * アプリ全体で使う標準ボタンを表示する。
 *
 * @param props - ボタンの役割、サイズ、形状、アイコン、Kobalte Button の属性。
 * @returns 共通スタイルを適用した Kobalte Button。
 */
export const AppButton = (props: AppButtonProps): JSX.Element => {
  const [local, buttonProps] = splitProps(props, [
    'variant',
    'size',
    'shape',
    'fullWidth',
    'leftIcon',
    'rightIcon',
    'class',
    'children',
  ])

  return (
    <Button
      {...buttonProps}
      type={buttonProps.type ?? 'button'}
      class={getAppButtonClass({
        variant: local.variant,
        size: local.size,
        shape: local.shape,
        fullWidth: local.fullWidth,
        class: local.class,
      })}
    >
      {local.leftIcon}
      {local.children}
      {local.rightIcon}
    </Button>
  )
}

/**
 * アイコンのみで操作を表す標準ボタンを表示する。
 *
 * @param props - アイコン、色調、大きさ、Kobalte Button の属性。
 * @returns 正方形サイズの共通アイコンボタン。
 */
export const AppIconButton = (props: AppIconButtonProps): JSX.Element => {
  const [local, buttonProps] = splitProps(props, ['tone', 'size', 'class', 'children'])

  return (
    <Button
      {...buttonProps}
      type={buttonProps.type ?? 'button'}
      class={getAppIconButtonClass({ tone: local.tone, size: local.size, class: local.class })}
    >
      {local.children}
    </Button>
  )
}
