import { Tooltip } from '@kobalte/core/tooltip'
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { AppIconButton, type AppIconButtonProps } from './AppButton'

/** 操作名をツールチップで補うアイコンボタンの属性。AppIconButton の属性に操作名と表示位置を加える。 */
export type AppTooltipIconButtonProps = Omit<AppIconButtonProps, 'aria-label'> & {
  /** ボタンの操作名。読み上げ用のラベルとツールチップの文言を兼ねる。 */
  label: string
  /** ツールチップを出す向き。既定はボタンの上。 */
  placement?: 'top' | 'bottom'
}

/**
 * 操作名をツールチップで補うアイコンボタンを表示する。
 *
 * @param props - 操作名、ツールチップの向き、アイコン、AppIconButton の属性。
 * @returns ツールチップ付きの共通アイコンボタン。
 */
export const AppTooltipIconButton = (props: AppTooltipIconButtonProps): JSX.Element => {
  const [local, buttonProps] = splitProps(props, ['label', 'placement'])

  return (
    <Tooltip placement={local.placement ?? 'top'} gutter={4} openDelay={400}>
      <Tooltip.Trigger as={AppIconButton} {...buttonProps} aria-label={local.label} />
      <Tooltip.Portal>
        <Tooltip.Content class="z-60 rounded-md border border-border-strong bg-surface-raised px-2 py-1 text-xs text-text shadow-lg">
          {local.label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip>
  )
}
